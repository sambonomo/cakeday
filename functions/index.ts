import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2/options";
import * as sgMail from "@sendgrid/mail";
import { buildInviteEmail } from "./emailTemplates";

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

  // Compose activation URL
  const activationUrl = `${APP_BASE_URL}/activate?email=${encodeURIComponent(user.email)}`;

  // Use centralized template
  const msg = buildInviteEmail({
    to: user.email,
    fullName: user.fullName,
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

// TODO: Next steps — Add callable functions for password reset and welcome emails

