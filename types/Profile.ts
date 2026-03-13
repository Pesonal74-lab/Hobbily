/**
 * Profile type definition
 * Represents the locally stored user profile.
 * In Phase 2 (Appwrite) this will be backed by a "profiles" collection
 * keyed by the authenticated user's ID.
 */
export type Profile = {
  username: string;
  /** Stored as a string to match text input state; validated as a number on save */
  age: string;
  bio: string;
  /** List of hobby tags displayed on the profile and used to tag posts */
  hobbies: string[];
  /** Last city the user selected in the WeatherBox — restored on next app launch */
  preferredCity: string;
};
