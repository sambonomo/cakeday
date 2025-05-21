// src/lib/integrations/slack.ts

/**
 * Send a message to a Slack channel using an Incoming Webhook URL.
 * @param webhookUrl The Slack webhook URL (per company, stored securely)
 * @param text The plain text message to post (can be markdown)
 * @returns Promise<boolean> (true if sent, false if failed)
 */
export async function sendSlackMessage({
  webhookUrl,
  text,
}: {
  webhookUrl: string;
  text: string;
}): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      console.error("[Slack] Failed to send message:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Slack] Error sending message:", err);
    return false;
  }
}

/**
 * Example usage (will not actually run on client for security reasons):
 * 
 * import { sendSlackMessage } from "./integrations/slack";
 * 
 * await sendSlackMessage({
 *   webhookUrl: "https://hooks.slack.com/services/XXX/YYY/ZZZ",
 *   text: "🎉 Someone just received Kudos in Cakeday!"
 * });
 * 
 * // For more advanced use, you can pass a `blocks` array (see Slack docs)
 */

