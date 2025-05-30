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
  XCircle,
  FileText,
} from "lucide-react";

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
  documentId?: string;
};

type DocInfo = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  category: string;
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
  const { companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [tasks, setTasks] = useState<OffboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocInfo[]>([]);

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

      // Fetch all offboarding/general docs for this company
      const docsSnap = await getDocs(
        query(
          collection(db, "documents"),
          where("companyId", "==", companyId)
        )
      );
      setDocs(
        docsSnap.docs.map((d) => ({
          ...(d.data() as DocInfo),
          id: d.id,
        }))
      );

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
        {tasks.map((task) => {
          const doc = task.documentId
            ? docs.find((d) => d.id === task.documentId)
            : null;
          const type = task.type || "manual";
          const isAutomated = type !== "manual";
          return (
            <li
              key={task.id}
              className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center gap-2 bg-white/90 shadow-md
                ${
                  task.enabled === false
                    ? "opacity-50 border-gray-200"
                    : isAutomated
                    ? "border-pink-300"
                    : "border-pink-200"
                }
                focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400
              `}
              tabIndex={0}
              aria-disabled={task.enabled === false}
            >
              <span className="flex items-center gap-2 min-w-[200px]">
                {TYPE_ICONS[type] || TYPE_ICONS["manual"]}
                <span className="font-semibold text-pink-900">{task.title}</span>
                {doc && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-700 underline flex items-center gap-1 text-xs ml-2"
                  >
                    <FileText className="w-4 h-4 mr-0.5 inline" />
                    {doc.title || "Document"}
                  </a>
                )}
                {task.enabled === false && (
                  <span className="text-xs font-bold text-red-500 ml-2">
                    <XCircle className="w-4 h-4 inline mb-0.5" /> Disabled
                  </span>
                )}
              </span>
              <span className="ml-0 sm:ml-auto text-xs text-gray-400">
                {isAutomated
                  ? `Automated (${type.replace("-", " ")})`
                  : "Manual"}
              </span>
              {task.description && (
                <div className="text-gray-600 text-sm mt-1">{task.description}</div>
              )}
              {isAutomated && task.autoMessageTemplate && (
                <div className="mt-1 text-xs text-pink-600 bg-pink-50 border border-pink-100 rounded p-2">
                  <b>Message:</b> {task.autoMessageTemplate}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-8 text-xs text-gray-400 text-center">
        If you have questions about your offboarding steps, contact HR or your team lead.
      </div>
    </div>
  );
}
