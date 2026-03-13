/**
 * profileService
 * All AsyncStorage I/O for the user's profile lives here.
 *
 * The profile is stored as a single JSON object. On load, it is merged with
 * DEFAULT_PROFILE so that any new fields added in future versions receive
 * their defaults automatically (forward-compatibility shim).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Profile } from "../types/Profile";

const PROFILE_KEY = "hobbily_profile";

/** Fallback values used on first launch or when a field is missing */
const DEFAULT_PROFILE: Profile = {
  username: "alex",
  age: "",
  bio: "",
  hobbies: ["Photography"],
  preferredCity: "London",
};

/**
 * Loads the persisted profile from storage.
 * Merges with DEFAULT_PROFILE so new fields always have a value.
 */
export async function loadProfile(): Promise<Profile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return DEFAULT_PROFILE;
  // Spread order: defaults first, then stored values override them
  return { ...DEFAULT_PROFILE, ...JSON.parse(raw) } as Profile;
}

/** Persists the full profile object to storage */
export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
