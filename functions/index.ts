import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

admin.initializeApp();

sgMail.setApiKey(functions.config().sendgrid.key);

// Production/Dev frontend URL - adjust for your environment!
const APP_BASE_URL = functions.config().app && functions.config().app.base_url
  ? functions.config().app.base_url
  : "https://yourdomain.com"; // fallback

export const sendInviteEmail = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const user = snap.data();

    // Only send for invited users (can expand to "newHire" if you want both)
    if (user.status !== "invited" || !user.email) {
      return null;
    }

    // Generate a secure activation link
    const activationUrl = `${APP_BASE_URL}/activate?email=${encodeURIComponent(user.email)}`;

    const msg = {
      to: user.email,
      from: {
        email: "noreply@yourdomain.com",
        name: "Cakeday HR",
      },
      subject: "You're Invited to Join Cakeday HR!",
      html: `
        <h2>Welcome to the Team, ${user.fullName || user.email}!</h2>
        <p>You've been invited to join Cakeday HR. Click below to activate your account and start onboarding:</p>
        <p>
          <a href="${activationUrl}" style="background:#2563eb;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;">Activate My Account</a>
        </p>
        <p>If you did not expect this invitation, you can ignore this email.</p>
        <br>
        <small>This invite is valid for 7 days.</small>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log("Invite email sent to", user.email);
      return snap.ref.update({ inviteSentAt: admin.firestore.FieldValue.serverTimestamp() });
    } catch (err: any) {
      console.error("SendGrid error:", err);
      return snap.ref.update({ inviteError: err.message });
    }
  });
