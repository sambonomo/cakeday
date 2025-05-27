"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Toast from "../../../components/Toast";

export default function IntegrationsAdminPage() {
  const { companyId, role } = useAuth();

  // Slack states
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [postKudosToSlack, setPostKudosToSlack] = useState(true);
  const [postBirthdaysToSlack, setPostBirthdaysToSlack] = useState(true);
  const [postNewHireToSlack, setPostNewHireToSlack] = useState(true);

  // Teams states
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState("");
  const [postKudosToTeams, setPostKudosToTeams] = useState(false);
  const [postBirthdaysToTeams, setPostBirthdaysToTeams] = useState(false);
  const [postNewHireToTeams, setPostNewHireToTeams] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    getDoc(doc(db, "companies", companyId))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() || {};
          setSlackWebhookUrl(data.slackWebhookUrl || "");
          setPostKudosToSlack(data.postKudosToSlack !== false);
          setPostBirthdaysToSlack(data.postBirthdaysToSlack !== false);
          setPostNewHireToSlack(data.postNewHireToSlack !== false);

          setTeamsWebhookUrl(data.teamsWebhookUrl || "");
          setPostKudosToTeams(data.postKudosToTeams === true);
          setPostBirthdaysToTeams(data.postBirthdaysToTeams === true);
          setPostNewHireToTeams(data.postNewHireToTeams === true);
        }
      })
      .catch(() => setError("Could not load integration settings."))
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      await setDoc(
        doc(db, "companies", companyId!),
        {
          slackWebhookUrl: slackWebhookUrl.trim(),
          postKudosToSlack,
          postBirthdaysToSlack,
          postNewHireToSlack,

          teamsWebhookUrl: teamsWebhookUrl.trim(),
          postKudosToTeams,
          postBirthdaysToTeams,
          postNewHireToTeams,
        },
        { merge: true }
      );
      setSuccess("Integration settings saved!");
    } catch (err) {
      setError("Could not save integration settings.");
    }
    setSaving(false);
  };

  // Guard for non-admin users
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-xl p-8 shadow text-center max-w-lg">
          <h2 className="text-2xl font-bold text-brand-700 mb-3">Integrations</h2>
          <p className="text-gray-500">Only admins can view and edit integration settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-4 py-8">
      <form
        onSubmit={handleSave}
        aria-label="Integration settings"
        className="
          w-full max-w-xl glass-card rounded-3xl shadow-2xl p-8 
          border border-brand-100 animate-fade-in
        "
      >
        <h1 className="text-3xl font-extrabold text-brand-700 mb-3 flex items-center gap-2">
          <span role="img" aria-label="plugin">🔌</span> Integrations
        </h1>
        <p className="mb-6 text-gray-600 text-sm">
          Connect Slack or Teams to broadcast Kudos, birthdays, and new hire announcements
          automatically to your team's channel.
        </p>

        {/* Loading spinner */}
        {loading && (
          <div className="mb-6 flex items-center gap-2 text-brand-600 animate-pulse">
            <span className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
            Loading integration settings...
          </div>
        )}

        {/* Slack Integration */}
        <fieldset className="mb-7" aria-labelledby="slack-integration-heading" disabled={loading || saving}>
          <legend
            id="slack-integration-heading"
            className="block text-base font-semibold mb-2 text-brand-700"
          >
            Slack Integration
          </legend>

          <label className="block font-medium mb-1" htmlFor="slack-webhook">
            Slack Webhook URL
          </label>
          <input
            id="slack-webhook"
            type="text"
            placeholder="Paste your Slack Webhook URL here"
            value={slackWebhookUrl}
            onChange={(e) => setSlackWebhookUrl(e.target.value)}
            className="
              w-full p-2 border border-brand-200 rounded mb-3
              focus:ring-2 focus:ring-brand-400
            "
            autoComplete="off"
            disabled={loading || saving}
          />

          <div className="flex flex-col gap-2 mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={postKudosToSlack}
                onChange={() => setPostKudosToSlack((v) => !v)}
                className="accent-brand-600 h-4 w-4"
                disabled={loading || saving}
              />
              Post Kudos to Slack
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={postBirthdaysToSlack}
                onChange={() => setPostBirthdaysToSlack((v) => !v)}
                className="accent-brand-600 h-4 w-4"
                disabled={loading || saving}
              />
              Post Birthdays & Anniversaries
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={postNewHireToSlack}
                onChange={() => setPostNewHireToSlack((v) => !v)}
                className="accent-brand-600 h-4 w-4"
                disabled={loading || saving}
              />
              Post New Hire Announcements
            </label>
          </div>
        </fieldset>

        {/* Teams Integration */}
        <fieldset className="mb-8" aria-labelledby="teams-integration-heading" disabled={loading || saving}>
          <legend
            id="teams-integration-heading"
            className="block text-base font-semibold mb-2 text-brand-700"
          >
            Microsoft Teams Integration
          </legend>

          <label className="block font-medium mb-1" htmlFor="teams-webhook">
            Teams Webhook URL
          </label>
          <input
            id="teams-webhook"
            type="text"
            placeholder="Paste your Teams Webhook URL here"
            value={teamsWebhookUrl}
            onChange={(e) => setTeamsWebhookUrl(e.target.value)}
            className="
              w-full p-2 border border-brand-200 rounded mb-3
              focus:ring-2 focus:ring-brand-400
            "
            autoComplete="off"
            disabled={loading || saving}
          />

          <div className="flex flex-col gap-2 mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={postKudosToTeams}
                onChange={() => setPostKudosToTeams((v) => !v)}
                className="accent-brand-600 h-4 w-4"
                disabled={loading || saving}
              />
              Post Kudos to Teams
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={postBirthdaysToTeams}
                onChange={() => setPostBirthdaysToTeams((v) => !v)}
                className="accent-brand-600 h-4 w-4"
                disabled={loading || saving}
              />
              Post Birthdays & Anniversaries
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={postNewHireToTeams}
                onChange={() => setPostNewHireToTeams((v) => !v)}
                className="accent-brand-600 h-4 w-4"
                disabled={loading || saving}
              />
              Post New Hire Announcements
            </label>
          </div>
        </fieldset>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving || loading}
          className="bg-brand-600 text-white rounded px-5 py-2 font-bold hover:bg-brand-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {/* Toast notifications */}
        {success && (
          <Toast
            message={success}
            type="success"
            onClose={() => setSuccess(null)}
          />
        )}
        {error && (
          <Toast
            message={error}
            type="error"
            onClose={() => setError(null)}
          />
        )}
      </form>
    </div>
  );
}
