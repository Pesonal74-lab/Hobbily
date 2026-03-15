import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Profile } from "../types/Profile";

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

export async function loadProfile(uid: string): Promise<Profile> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return { ...DEFAULT_PROFILE };
  return { ...DEFAULT_PROFILE, ...snap.data() } as Profile;
}

export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  await setDoc(doc(db, "users", uid), profile, { merge: true });
}
