import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  deleteUser,
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
  /** Deletes Firestore profile + progress data, then deletes the Firebase Auth user. */
  deleteAccount: () => Promise<void>;
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

  async function deleteAccount() {
    if (!user) return;
    // Delete Firestore data first
    await Promise.allSettled([
      deleteDoc(doc(db, "users", user.uid)),
      deleteDoc(doc(db, "progress", user.uid)),
    ]);
    // Delete the Firebase Auth account (requires recent sign-in)
    await deleteUser(user);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthLoaded, signUp, signIn, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
