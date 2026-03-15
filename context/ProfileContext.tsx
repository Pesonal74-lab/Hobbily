import { createContext, useContext, useState, useEffect } from "react";
import { Profile } from "../types/Profile";
import { loadProfile, saveProfile as persistProfile } from "../services/profileService";
import { useAuth } from "./AuthContext";

const DEFAULT_PROFILE: Profile = {
  username: "explorer",
  email: "",
  age: "",
  bio: "",
  hobbies: [],
  preferredCity: "",
  city: "",
  freeTimePerDay: "30-60",
  hasOnboarded: false,
  savedOpportunities: [],
};

type ProfileContextType = {
  profile: Profile;
  /** True once the profile has been loaded from Firestore (or determined no user) */
  isLoaded: boolean;
  saveProfile: (updated: Profile) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoaded } = useAuth();
  const [profile, setProfile] = useState<Profile>({ ...DEFAULT_PROFILE });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!user) {
      // No authenticated user — reset so auth gate redirects to onboarding
      setProfile({ ...DEFAULT_PROFILE });
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    loadProfile(user.uid).then((p) => {
      setProfile(p);
      setIsLoaded(true);
    });
  }, [user, isAuthLoaded]);

  async function saveProfile(updated: Profile) {
    setProfile(updated);
    if (user) await persistProfile(user.uid, updated);
  }

  return (
    <ProfileContext.Provider value={{ profile, isLoaded, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
