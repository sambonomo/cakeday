import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { diffInDays, nextEventDate } from "./dateUtils";
import { sendSlackMessage } from "./integrations/slack"; // <-- Slack util

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
  photoURL?: string;      // Profile photo URL
  disabled?: boolean;     // User disabled (soft delete)
  points?: number;        // Kudos/recognition points
  badges?: string[];      // Array of badge IDs (earned badges)
  gender?: string;        // "Male", "Female", "Nonbinary", etc.
  department?: string;    // Department name
  status?: string;        // "newHire", "active", "exiting"
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
 * If the user didn't exist before, trigger a "new hire" Slack announcement.
 * @param uid
 * @param updates - Only include fields to update!
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  // If the user doesn't exist (new hire), use setDoc. Otherwise, updateDoc.
  let isNew = false;
  if (!userSnap.exists()) {
    isNew = true;
    // On new profile, initialize points and badges if not present
    await setDoc(
      userRef,
      {
        points: updates.points ?? 0,
        badges: updates.badges ?? [],
        ...updates,
      },
      { merge: true }
    );
  } else {
    // On update, do not overwrite points or badges unless specified
    await updateDoc(userRef, updates);
  }

  // === SLACK INTEGRATION for NEW HIRE ===
  try {
    if (isNew && updates.companyId) {
      // Fetch Slack webhook from company doc
      const companyRef = doc(db, "companies", updates.companyId);
      const companySnap = await getDoc(companyRef);
      const companyData = companySnap.exists() ? companySnap.data() : null;
      const slackWebhookUrl = companyData?.slackWebhookUrl;
      const postNewHireToSlack = companyData?.postNewHireToSlack !== false; // default true

      if (slackWebhookUrl && postNewHireToSlack) {
        // Format new hire message
        const name = updates.fullName || updates.email || "A new team member";
        const slackMsg = `:tada: *${name}* just joined the company! Welcome aboard!`;
        await sendSlackMessage({
          webhookUrl: slackWebhookUrl,
          text: slackMsg,
        });
      }
    }
  } catch (err) {
    // Don't block the flow if Slack fails
    // console.error("Error posting new hire to Slack:", err);
  }
}

/**
 * Increment points and/or add badge(s) for a user.
 * Usage: after a kudos event or admin action.
 */
export async function addPointsAndBadgesToUser(
  uid: string,
  companyId: string,
  points: number,
  newBadges: string[] = []
): Promise<void> {
  const userRef = doc(db, "users", uid);
  // Use a transaction or a get-update to avoid race conditions for real apps (advanced)
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const user = userSnap.data() as UserProfile;
  const currentPoints = typeof user.points === "number" ? user.points : 0;
  const currentBadges = Array.isArray(user.badges) ? user.badges : [];

  const updatedBadges = Array.from(new Set([...currentBadges, ...newBadges]));

  await updateDoc(userRef, {
    points: currentPoints + points,
    badges: updatedBadges,
  });
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
