/**
 * ProfileContext
 * Provides the current user's profile data to the entire app.
 *
 * On mount it loads the persisted profile from AsyncStorage (falling back to
 * a default if nothing is saved yet). Calling saveProfile updates both
 * in-memory state and storage atomically.
 *
 * Provider hierarchy: ThemeProvider → ProfileProvider → PostsProvider
 * (ProfileProvider wraps PostsProvider so posts can read the current username)
 */
import { createContext, useContext, useState, useEffect } from "react";
import { Profile } from "../types/Profile";
import { loadProfile, saveProfile as persistProfile } from "../services/profileService";

/** Shape of everything exposed by this context */
type ProfileContextType = {
  profile: Profile;
  /** Persists an updated profile to storage and updates in-memory state */
  saveProfile: (updated: Profile) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // Start with sensible defaults so screens render immediately on first launch
  const [profile, setProfile] = useState<Profile>({
    username: "alex",
    age: "",
    bio: "",
    hobbies: ["Photography"],
    preferredCity: "London",
  });

  // Replace defaults with the real persisted data as soon as it's available
  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  /** Optimistically updates state, then flushes to AsyncStorage */
  async function saveProfile(updated: Profile) {
    setProfile(updated);
    await persistProfile(updated);
  }

  return (
    <ProfileContext.Provider value={{ profile, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

/** Hook to consume ProfileContext — must be used inside ProfileProvider */
export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
