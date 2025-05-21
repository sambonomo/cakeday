// src/lib/integrations/teams.ts

/**
 * Send a message to a Microsoft Teams channel using an Incoming Webhook URL.
 * @param webhookUrl The Teams webhook URL (per company, stored securely)
 * @param text The message to post (plain text, can use some Markdown)
 * @returns Promise<boolean> (true if sent, false if failed)
 */
export async function sendTeamsMessage({
  webhookUrl,
  text,
}: {
  webhookUrl: string;
  text: string;
}): Promise<boolean> {
  try {
    // Teams expects a JSON payload with a "text" property.
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      console.error("[Teams] Failed to send message:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Teams] Error sending message:", err);
    return false;
  }
}

/**
 * Example usage (run on backend or server-side only!):
 *
 * import { sendTeamsMessage } from "./integrations/teams";
 *
 * await sendTeamsMessage({
 *   webhookUrl: "https://outlook.office.com/webhook/....",
 *   text: "🎉 A new team member just joined Cakeday!"
 * });
 */
