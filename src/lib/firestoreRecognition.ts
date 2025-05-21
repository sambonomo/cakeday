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
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { sendSlackMessage } from "./integrations/slack";
import { sendTeamsMessage } from "./integrations/teams"; // Import from ./integrations/teams.ts
import type { UserProfile } from "./firestoreUsers";

// ===================== GIVE KUDOS FUNCTION (Gamified) =====================
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
  // 1. Add kudos to Firestore
  await addDoc(collection(db, "kudos"), {
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
    createdAt: serverTimestamp(),
  });

  // 2. Increment recipient's points and update badges
  try {
    const userRef = doc(db, "users", toUid);
    const userSnap = await getDoc(userRef);

    let currentPoints = 0;
    let currentBadges: string[] = [];
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      currentPoints = typeof userData.points === "number" ? userData.points : 0;
      currentBadges = Array.isArray(userData.badges) ? userData.badges : [];
    }
    // Simple rule: +10 points per kudos
    const kudosPoints = 10;
    let newBadges = [...currentBadges];

    // Example: earn "first-kudos" badge on first kudos received
    if (currentPoints === 0 && !currentBadges.includes("first-kudos")) {
      newBadges.push("first-kudos");
    }

    // TODO: Add more badge logic for milestones (50, 100, etc)
    // if (currentPoints + kudosPoints >= 50 && !newBadges.includes("50-points")) { ... }

    await updateDoc(userRef, {
      points: currentPoints + kudosPoints,
      badges: Array.from(new Set(newBadges)),
    });
  } catch (err) {
    // Optionally log or alert, but don't block kudos flow
    // console.error("Failed to update points/badges for kudos recipient:", err);
  }

  // 3. Slack & Teams Integration
  try {
    const companyRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyRef);
    const companyData = companySnap.exists() ? companySnap.data() : null;

    // -------- Slack --------
    const slackWebhookUrl = companyData?.slackWebhookUrl;
    const postKudosToSlack = companyData?.postKudosToSlack !== false; // default to true
    if (slackWebhookUrl && postKudosToSlack) {
      const slackMsg = `:sparkles: *${fromName || fromEmail}* gave kudos to *${toName || toEmail}* ${badge || ""}\n>${message}\n:star: *${toName || toEmail}* now has +10 points!`;
      await sendSlackMessage({
        webhookUrl: slackWebhookUrl,
        text: slackMsg,
      });
    }

    // -------- Teams --------
    const teamsWebhookUrl = companyData?.teamsWebhookUrl;
    const postKudosToTeams = companyData?.postKudosToTeams === true;
    if (teamsWebhookUrl && postKudosToTeams) {
      const teamsMsg = `✨ ${fromName || fromEmail} gave kudos to ${toName || toEmail} ${badge || ""}\n"${message}"\n⭐ ${toName || toEmail} now has +10 points!`;
      await sendTeamsMessage({
        webhookUrl: teamsWebhookUrl,
        text: teamsMsg,
      });
    }
  } catch (err) {
    // Don't block the flow if posting fails
    // console.error("Error posting kudos to Slack/Teams:", err);
  }
}

// ===================== Fetch Recent Kudos =====================
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
