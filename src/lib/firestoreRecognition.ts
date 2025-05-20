import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Updated: Give recognition (kudos) with badge, companyId, and optional name/photo fields
export async function giveKudos({
  fromUid,
  fromEmail,
  toUid,
  toEmail,
  message,
  badge,
  companyId,
  fromName,
  fromPhotoURL,
  toName,
  toPhotoURL,
}: {
  fromUid: string;
  fromEmail: string;
  toUid: string;
  toEmail: string;
  message: string;
  badge: string;
  companyId: string;
  fromName?: string;
  fromPhotoURL?: string;
  toName?: string;
  toPhotoURL?: string;
}) {
  const colRef = collection(db, "kudos");
  await addDoc(colRef, {
    fromUid,
    fromEmail,
    toUid,
    toEmail,
    message,
    badge,
    companyId, // Include companyId in the document!
    fromName,
    fromPhotoURL,
    toName,
    toPhotoURL,
    createdAt: serverTimestamp(),
  });
}

// Fetch latest kudos for a company (e.g., 20)
export async function fetchRecentKudos(companyId: string, limitCount = 20) {
  const colRef = collection(db, "kudos");
  const q = query(
    colRef,
    where("companyId", "==", companyId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];
}
