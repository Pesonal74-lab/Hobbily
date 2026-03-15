export type FreeTimePerDay = "<30" | "30-60" | "1-2h" | "2h+";

export type Profile = {
  username: string;
  email: string;
  /** Stored as a string to match text input state; validated as a number on save */
  age: string;
  bio: string;
  /** List of hobby tags displayed on the profile and used to tag posts */
  hobbies: string[];
  /** Last city the user selected in the WeatherBox */
  preferredCity: string;
  city: string;
  freeTimePerDay: FreeTimePerDay;
  hasOnboarded: boolean;
  /** IDs of saved/bookmarked opportunities */
  savedOpportunities: string[];
};
