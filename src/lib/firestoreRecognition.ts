import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Give recognition (kudos) with badge
export async function giveKudos({
  fromUid,
  fromEmail,
  toUid,
  toEmail,
  message,
  badge,
}: {
  fromUid: string;
  fromEmail: string;
  toUid: string;
  toEmail: string;
  message: string;
  badge: string; // New!
}) {
  const colRef = collection(db, "kudos");
  await addDoc(colRef, {
    fromUid,
    fromEmail,
    toUid,
    toEmail,
    message,
    badge,
    createdAt: serverTimestamp(),
  });
}

// Fetch latest kudos (e.g., 20)
export async function fetchRecentKudos(limitCount = 20) {
  const colRef = collection(db, "kudos");
  const q = query(colRef, orderBy("createdAt", "desc"), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];
}
