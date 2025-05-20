import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { diffInDays, nextEventDate } from "./dateUtils";

/**
 * User profile type
 */
export type UserProfile = {
  uid: string;
  email: string;
  companyId: string;
  fullName?: string;
  phone?: string;
  birthday?: string;      // "YYYY-MM-DD"
  anniversary?: string;   // "YYYY-MM-DD"
  role?: string;          // "user", "admin", "manager", etc.
};

/**
 * Fetch all users in a company.
 * @param companyId
 * @returns array of UserProfile
 */
export async function fetchAllUsers(companyId: string): Promise<UserProfile[]> {
  const colRef = collection(db, "users");
  const q = query(colRef, where("companyId", "==", companyId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (doc: QueryDocumentSnapshot<DocumentData>) => ({
      uid: doc.id,
      ...doc.data(),
    })
  ) as UserProfile[];
}

/**
 * Fetch a single user's profile.
 * @param uid
 * @returns UserProfile or null
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists()
    ? ({ uid, ...userSnap.data() } as UserProfile)
    : null;
}

/**
 * Update a user's profile (can update any editable fields)
 * @param uid
 * @param updates - Only include fields to update!
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, "fullName" | "phone" | "birthday" | "anniversary" | "role">>
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
}

/**
 * Helper: get the next upcoming birthday/anniversary events for all users in company
 */
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
