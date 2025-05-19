"use client";

import { useEffect, useState } from "react";
import { fetchRecentKudos } from "../lib/firestoreRecognition";

export default function RecognitionFeed() {
  const [kudos, setKudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKudos = async () => {
      setLoading(true);
      const result = await fetchRecentKudos();
      setKudos(result);
      setLoading(false);
    };
    fetchKudos();
    // (Optional) Add polling for live updates or use Firestore onSnapshot for true real-time
  }, []);

  if (loading) return <div className="text-gray-600">Loading recognition feed...</div>;
  if (kudos.length === 0) return <div className="text-gray-500">No kudos given yet.</div>;

  return (
    <ul className="flex flex-col gap-3">
      {kudos.map((kudo) => (
        <li key={kudo.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-semibold text-blue-700">
            {kudo.fromEmail}
          </span>
          <span>gave kudos to</span>
          <span className="font-semibold text-green-700">{kudo.toEmail}</span>
          <span className="italic text-gray-700">“{kudo.message}”</span>
          <span className="ml-auto text-xs text-gray-400">
            {kudo.createdAt?.seconds
              ? new Date(kudo.createdAt.seconds * 1000).toLocaleString()
              : "just now"}
          </span>
        </li>
      ))}
    </ul>
  );
}
