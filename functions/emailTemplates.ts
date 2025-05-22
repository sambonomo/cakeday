// functions/emailTemplates.ts

type BuildInviteEmailArgs = {
  to: string;
  fullName?: string;
  activationUrl: string;
  from: { email: string; name: string };
};

export function buildInviteEmail({
  to,
  fullName,
  activationUrl,
  from,
}: BuildInviteEmailArgs) {
  return {
    to,
    from,
    subject: "You're Invited to Join Cakeday HR!",
    html: `
      <h2>Welcome to the Team, ${fullName || to}!</h2>
      <p>You've been invited to join Cakeday HR. Click below to activate your account and start onboarding:</p>
      <p>
        <a href="${activationUrl}" style="background:#2563eb;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;">Activate My Account</a>
      </p>
      <p>If you did not expect this invitation, you can ignore this email.</p>
      <br>
      <small>This invite is valid for 7 days.</small>
    `,
  };
}

// Add more builders for password reset, welcome, etc. as you go!
