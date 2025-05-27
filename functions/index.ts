import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onDocumentCreated, HttpsError, onCall } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2/options";
import * as sgMail from "@sendgrid/mail";
import { buildInviteEmail } from "./emailTemplates";
import * as functions from "firebase-functions/v2";

// ------------- 1. Initialize -------------
initializeApp();
const db = getFirestore();
setGlobalOptions({ region: "us-central1" });

// ------------- 2. Environment Variables -------------
const SENDGRID_KEY =
  process.env.SENDGRID_API_KEY ||
  process.env.SENDGRID_KEY ||
  ""; // fallback, warn if not set
const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  "https://yourdomain.com";
const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  "noreply@yourdomain.com";
const FROM_NAME =
  process.env.FROM_NAME ||
  "Cakeday HR";

if (!SENDGRID_KEY) {
  console.warn(
    "[WARN] SENDGRID_KEY not set. Outbound email will fail. Set this in your .env or deploy env."
  );
}
sgMail.setApiKey(SENDGRID_KEY);

// ------------- 3. Invite Email Trigger -------------
export const sendInviteEmail = onDocumentCreated("users/{userId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const user = snap.data();

  // Only send for invited users with an email
  if (!user || user.status !== "invited" || !user.email) {
    return;
  }

  // Compose activation URL (include inviteId for seamless merge)
  const activationUrl = `${APP_BASE_URL}/activate?inviteId=${event.params.userId}&email=${encodeURIComponent(user.email)}`;

  // Use centralized template
  const msg = buildInviteEmail({
    to: user.email,
    fullName: user.fullName || user.name || "", // fallback if field varies
    activationUrl,
    from: { email: FROM_EMAIL, name: FROM_NAME },
  });

  try {
    await sgMail.send(msg);
    console.log("Invite email sent to", user.email);

    // Mark as sent in Firestore
    await db.doc(`users/${event.params.userId}`).update({
      inviteSentAt: FieldValue.serverTimestamp(),
      inviteError: FieldValue.delete(),
    });
  } catch (err: any) {
    // SendGrid errors are sometimes arrays
    let errorMsg = err?.message || "Unknown SendGrid error";
    if (err?.response?.body?.errors) {
      errorMsg = err.response.body.errors.map((e: any) => e.message).join("; ");
    }
    console.error("SendGrid error:", errorMsg);
    await db.doc(`users/${event.params.userId}`).update({
      inviteError: errorMsg,
    });
  }
});

// ------------- 4. Accept Invite Callable -------------
// Called by the frontend after user signs up using invite
export const acceptInvite = functions.https.onCall(async (data, context) => {
  // Requires inviteId (doc ID) OR email
  const { inviteId, email } = data;
  const uid = context.auth?.uid;
  const userEmail = context.auth?.token?.email;

  if (!uid) throw new HttpsError("unauthenticated", "You must be logged in");

  // 1. Find invite doc (by inviteId if present, else by email)
  let inviteDocSnap: FirebaseFirestore.DocumentSnapshot | undefined;
  if (inviteId) {
    inviteDocSnap = await db.doc(`users/${inviteId}`).get();
  } else if (email || userEmail) {
    // fallback: find by email (case-insensitive)
    const snap = await db.collection("users")
      .where("email", "==", (email || userEmail).toLowerCase())
      .where("status", "==", "invited")
      .limit(1).get();
    if (!snap.empty) inviteDocSnap = snap.docs[0];
  }
  if (!inviteDocSnap || !inviteDocSnap.exists) {
    throw new HttpsError("not-found", "Invite not found.");
  }
  const inviteData = inviteDocSnap.data()!;
  const inviteDocId = inviteDocSnap.id;

  // 2. Create/update real user profile at users/{uid}
  const userDocRef = db.doc(`users/${uid}`);
  await userDocRef.set({
    ...inviteData,
    status: "active",
    disabled: false,
    email: userEmail || inviteData.email,
    authUid: uid,
    activatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // 3. Move any userTaskAssignments (newHireId or assignedTo == inviteDocId) to uid
  const assignmentSnap = await db.collection("userTaskAssignments")
    .where("newHireId", "==", inviteDocId).get();
  const batch = db.batch();
  assignmentSnap.forEach(docSnap => {
    batch.update(docSnap.ref, { newHireId: uid });
  });

  // Optionally: update any assignments where assignedTo is inviteDocId (rare but safe)
  const asg2 = await db.collection("userTaskAssignments")
    .where("assignedTo", "==", inviteDocId).get();
  asg2.forEach(docSnap => {
    batch.update(docSnap.ref, { assignedTo: uid });
  });

  // 4. Migrate userTaskProgress from old ID to new UID
  const companyId = inviteData.companyId;
  const oldProgressDoc = db.doc(`userTaskProgress/${companyId}_${inviteDocId}`);
  const newProgressDoc = db.doc(`userTaskProgress/${companyId}_${uid}`);
  const progressSnap = await oldProgressDoc.get();
  if (progressSnap.exists) {
    batch.set(newProgressDoc, progressSnap.data());
    batch.delete(oldProgressDoc);
  }

  // 5. Delete the old invite user doc
  batch.delete(inviteDocSnap.ref);

  await batch.commit();

  return { success: true };
});

// ------------- 5. (Future) Welcome/Password Reset Callables -------------
// TODO: Add welcome or password reset functions here as needed
