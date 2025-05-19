import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

// ------------------------------
// User Profile Types
// ------------------------------
export type UserProfile = {
  uid: string;
  email: string;
  birthday?: string;     // "YYYY-MM-DD"
  anniversary?: string;  // "YYYY-MM-DD"
  // Add other profile fields if needed (name, photoURL, etc)
};

// ------------------------------
// Fetch all users (for feeds, admin, etc)
// ------------------------------
export async function fetchAllUsers(): Promise<UserProfile[]> {
  const colRef = collection(db, "users");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(
    (doc: QueryDocumentSnapshot<DocumentData>) => ({
      uid: doc.id,
      ...doc.data(),
    })
  ) as UserProfile[];
}

// ------------------------------
// Fetch a single user's profile (for profile editor)
// ------------------------------
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists()
    ? ({ uid, ...userSnap.data() } as UserProfile)
    : null;
}

// ------------------------------
// Update a user's profile (birthday, anniversary, etc)
// ------------------------------
export async function updateUserProfile(
  uid: string,
  updates: { birthday?: string; anniversary?: string }
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
}

// ------------------------------
// Helper: get the next upcoming birthday/anniversary events for all users
// ------------------------------
export type UserEvent = {
  type: "birthday" | "anniversary";
  user: UserProfile;
  date: Date;
  formatted: string;
  daysUntil: number;
};

export function getUpcomingEvents(users: UserProfile[]): UserEvent[] {
  const today = new Date();
  const events: UserEvent[] = [];

  users.forEach((user) => {
    // Birthdays
    if (user.birthday) {
      const bDate = nextEventDate(user.birthday, today);
      events.push({
        type: "birthday",
        user,
        date: bDate,
        formatted: bDate.toLocaleDateString(),
        daysUntil: diffInDays(today, bDate),
      });
    }
    // Anniversaries
    if (user.anniversary) {
      const aDate = nextEventDate(user.anniversary, today);
      events.push({
        type: "anniversary",
        user,
        date: aDate,
        formatted: aDate.toLocaleDateString(),
        daysUntil: diffInDays(today, aDate),
      });
    }
  });

  // Sort by soonest
  events.sort((a, b) => a.daysUntil - b.daysUntil);
  return events;
}

// ------------------------------
// Helpers
// ------------------------------

// Return the next occurrence (this year or next) of a YYYY-MM-DD string
function nextEventDate(ymd: string, today: Date): Date {
  const [, m, d] = ymd.split("-").map(Number); // Ignore stored year for recurring events
  const thisYear = today.getFullYear();
  const nextEvent = new Date(thisYear, m - 1, d);

  // If the event has already occurred this year, schedule for next year
  if (
    nextEvent < today &&
    (nextEvent.getMonth() < today.getMonth() ||
      (nextEvent.getMonth() === today.getMonth() && nextEvent.getDate() < today.getDate()))
  ) {
    return new Date(thisYear + 1, m - 1, d);
  }
  return nextEvent;
}

function diffInDays(a: Date, b: Date): number {
  // Normalize to midnight for accurate day count
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.ceil((end.getTime() - start.getTime()) / oneDay);
}
