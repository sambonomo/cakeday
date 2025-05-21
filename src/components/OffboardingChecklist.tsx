"use client";

import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  Mail,
  Slack,
  Calendar,
  UserX2,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Define the model (match your Firestore)
export type OffboardingTask = {
  id: string;
  title: string;
  description?: string;
  type?: string;
  autoMessageTemplate?: string;
  sendWhen?: string;
  targetEmail?: string;
  order?: number;
  enabled?: boolean;
  companyId: string;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  manual: <Sparkles className="inline w-5 h-5 mr-1 text-blue-500" />,
  "auto-email": <Mail className="inline w-5 h-5 mr-1 text-pink-500" />,
  calendar: <Calendar className="inline w-5 h-5 mr-1 text-yellow-400" />,
  slack: <Slack className="inline w-5 h-5 mr-1 text-blue-700" />,
  teams: <Slack className="inline w-5 h-5 mr-1 rotate-90 text-blue-400" />,
};

export default function OffboardingChecklist({
  companyId: propCompanyId,
}: {
  companyId?: string;
}) {
  const { companyId: contextCompanyId, role } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [tasks, setTasks] = useState<OffboardingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const fetchTasks = async () => {
      const q = query(
        collection(db, "offboardingTasks"),
        where("companyId", "==", companyId)
      );
      const snap = await getDocs(q);
      const list: OffboardingTask[] = snap.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })
      ) as OffboardingTask[];
      setTasks(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setLoading(false);
    };
    fetchTasks();
  }, [companyId]);

  if (loading)
    return (
      <div className="text-blue-700 flex items-center gap-2 animate-pulse">
        <UserX2 className="w-5 h-5" />
        Loading offboarding checklist...
      </div>
    );

  if (tasks.length === 0)
    return (
      <div className="text-gray-500 text-center">
        No offboarding steps defined for your company yet.
      </div>
    );

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-pink-100 p-8 mt-6 glass-card">
      <h2 className="text-2xl font-bold text-pink-700 mb-5 flex items-center gap-2">
        <UserX2 className="w-7 h-7 text-pink-400" /> Offboarding Checklist
      </h2>
      <ul className="flex flex-col gap-4">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center gap-2 bg-white/90 shadow-md
            ${
              task.enabled === false
                ? "opacity-50 border-gray-200"
                : "border-pink-200"
            }`}
          >
            <span className="flex items-center gap-2">
              {TYPE_ICONS[task.type ?? "manual"] || TYPE_ICONS["manual"]}
              <span className="font-semibold text-pink-900">{task.title}</span>
              {task.enabled === false && (
                <span className="text-xs font-bold text-red-500 ml-2">
                  <XCircle className="w-4 h-4 inline mb-0.5" /> Disabled
                </span>
              )}
            </span>
            <span className="ml-0 sm:ml-auto text-xs text-gray-400">
              {task.type && task.type !== "manual"
                ? `Automated (${task.type.replace("-", " ")})`
                : "Manual"}
            </span>
            {task.description && (
              <div className="text-gray-600 text-sm mt-1">{task.description}</div>
            )}
            {task.type && task.type !== "manual" && task.autoMessageTemplate && (
              <div className="mt-1 text-xs text-pink-600 bg-pink-50 border border-pink-100 rounded p-2">
                <b>Message:</b> {task.autoMessageTemplate}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-8 text-xs text-gray-400 text-center">
        If you have questions about your offboarding steps, contact HR or your team lead.
      </div>
    </div>
  );
}
