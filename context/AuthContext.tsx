import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type AuthContextType = {
  user: User | null;
  /** True once the Firebase auth state has been determined (may still be null) */
  isAuthLoaded: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-authenticates, deletes Firestore profile + progress data, then deletes the Firebase Auth user. */
  deleteAccount: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoaded(true);
    });
    return unsub;
  }, []);

  async function signUp(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await fbSignOut(auth);
  }

  async function deleteAccount(password: string) {
    if (!user || !user.email) return;
    // Re-authenticate so Firebase accepts the deleteUser call
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    // Delete Firestore data first
    await Promise.allSettled([
      deleteDoc(doc(db, "users", user.uid)),
      deleteDoc(doc(db, "progress", user.uid)),
    ]);
    // Use auth.currentUser — the state ref may be stale after re-auth
    const freshUser = auth.currentUser;
    if (freshUser) await deleteUser(freshUser);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthLoaded, signUp, signIn, signOut, deleteAccount } as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
