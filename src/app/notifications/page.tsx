"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import {
  Bell,
  Sparkles,
  FileText,
  Gift,
  CheckCircle2,
  Ban,
  Hourglass,
} from "lucide-react";

type Notification = {
  id: string;
  toUid: string;
  toEmail: string;
  type: string;
  message: string;
  sentAt: any;
  read: boolean;
  // optional:
  rewardName?: string;
  docTitle?: string;
  docUrl?: string;
  status?: string; // e.g., approved/denied/fulfilled
  pointsCost?: number;
};

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setNotifLoading(true);
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid),
      orderBy("sentAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Notification, "id">),
        }))
      );
      setNotifLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  async function markAsRead(id: string) {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await updateDoc(doc(db, "notifications", id), { read: true });
  }

  async function markAllAsRead() {
    await Promise.all(
      notifs.filter((n) => !n.read).map((n) => markAsRead(n.id))
    );
  }

  if (loading || notifLoading) {
    return <div className="mt-10 text-blue-600 animate-pulse text-center">Loading notifications...</div>;
  }

  // Helper to choose the correct icon per notification type
  function getNotifIcon(type: string) {
    if (type === "kudos") return <Sparkles className="w-5 h-5 text-green-400" aria-label="Kudos" />;
    if (type === "document") return <FileText className="w-5 h-5 text-blue-400" aria-label="Document" />;
    if (type === "redemption") return <Gift className="w-5 h-5 text-pink-400" aria-label="Reward" />;
    return <Bell className="w-5 h-5 text-blue-300" aria-label="Notification" />;
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 mb-10 bg-white p-8 rounded-3xl shadow-2xl">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        <Bell className="w-7 h-7 text-yellow-400" /> Your Notifications
      </h1>
      <div className="mb-6 flex justify-end">
        <button
          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-semibold"
          onClick={markAllAsRead}
          disabled={notifs.every((n) => n.read)}
        >
          Mark all as read
        </button>
      </div>
      {notifs.length === 0 ? (
        <div className="text-gray-400 italic flex items-center gap-2">
          <Bell className="w-5 h-5" /> No notifications yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {notifs.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border-2 p-4 shadow flex flex-col gap-2 ${
                n.read ? "bg-gray-50" : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block mr-2"></span>
                )}
                {getNotifIcon(n.type)}
                <span className="font-semibold">
                  {n.type === "kudos" && "Kudos Received"}
                  {n.type === "document" && "Document Sent"}
                  {n.type === "redemption" && "Reward Redemption"}
                  {!["kudos", "document", "redemption"].includes(n.type) && n.type}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {n.sentAt?.toDate ? n.sentAt.toDate().toLocaleString() : ""}
                </span>
              </div>
              <div>
                {n.type === "kudos" && <span>{n.message}</span>}
                {n.type === "document" && (
                  <div>
                    {n.docTitle && (
                      <span>
                        <b>Document:</b> {n.docTitle}
                      </span>
                    )}
                    {n.docUrl && (
                      <div>
                        <a
                          href={n.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-xs ml-1"
                        >
                          Download/Preview
                        </a>
                      </div>
                    )}
                    {n.message && <div>{n.message}</div>}
                  </div>
                )}
                {n.type === "redemption" && (
                  <div>
                    <div>
                      <b>Reward:</b> {n.rewardName} ({n.pointsCost} pts)
                    </div>
                    {n.status && (
                      <div className="flex items-center gap-1">
                        <b>Status:</b>
                        <span
                          className={
                            n.status === "approved"
                              ? "text-blue-600"
                              : n.status === "fulfilled"
                              ? "text-green-600"
                              : n.status === "denied"
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                        </span>
                        {n.status === "fulfilled" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {n.status === "denied" && <Ban className="w-4 h-4 text-red-600" />}
                        {n.status === "approved" && <Hourglass className="w-4 h-4 text-blue-400" />}
                      </div>
                    )}
                    {n.message && <div>{n.message}</div>}
                  </div>
                )}
                {!["kudos", "document", "redemption"].includes(n.type) && n.message}
              </div>
              {!n.read && (
                <div className="mt-2">
                  <button
                    className="text-xs px-3 py-1 rounded bg-blue-600 text-white font-bold hover:bg-blue-700"
                    onClick={() => markAsRead(n.id)}
                  >
                    Mark as read
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
