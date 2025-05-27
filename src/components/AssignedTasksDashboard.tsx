"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import Toast from "./Toast";
import {
  FileText,
  CheckCircle2,
  Clock8,
  Users2,
  PartyPopper,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";

type UserTaskAssignment = {
  id: string;
  newHireId: string;
  taskId: string;
  templateId: string;
  companyId: string;
  assignedTo: string;
  assignedToRole?: string;
  dueDate?: any;
  completed: boolean;
  completedAt?: any;
  title: string;
  description?: string;
  department?: string;
  order?: number;
  documentId?: string;
};

type UserProfile = {
  uid: string;
  fullName?: string;
  email: string;
  department?: string;
  status?: string;
  role?: string;
};

type DocInfo = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  category: string;
};

export default function AssignedTasksDashboard() {
  const { user, companyId } = useAuth();

  const [assignments, setAssignments] = useState<UserTaskAssignment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // For live toast location at top center
  const toastAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !companyId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch tasks assigned to this user (from any new hire)
      const q = query(
        collection(db, "userTaskAssignments"),
        where("companyId", "==", companyId),
        where("assignedTo", "==", user.uid)
      );
      const snap = await getDocs(q);
      const assignments = snap.docs.map((d) => {
        const data = d.data() as Omit<UserTaskAssignment, "id"> & { id?: string };
        const { id: _, ...rest } = data;
        return { ...rest, id: d.id };
      });

      // Fetch all company users for mapping newHireId to names
      const userQ = query(
        collection(db, "users"),
        where("companyId", "==", companyId)
      );
      const userSnap = await getDocs(userQ);
      const users = userSnap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<UserProfile, "uid">),
      }));

      // Docs (for task attachments)
      const docsSnap = await getDocs(
        query(collection(db, "documents"), where("companyId", "==", companyId))
      );
      setDocs(
        docsSnap.docs.map((d) => {
          const data = d.data() as Omit<DocInfo, "id"> & { id?: string };
          const { id: _, ...rest } = data;
          return { ...rest, id: d.id };
        })
      );

      setAssignments(assignments);
      setUsers(users);
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line
  }, [user, companyId]);

  // Mark task complete
  async function markComplete(assignmentId: string) {
    setMarkingId(assignmentId);
    try {
      await updateDoc(doc(db, "userTaskAssignments", assignmentId), {
        completed: true,
        completedAt: new Date(),
      });
      setToast("Task marked complete!");
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, completed: true, completedAt: new Date() }
            : a
        )
      );
    } catch (err: any) {
      setToast(err.message || "Could not update task.");
    }
    setMarkingId(null);
  }

  // Group tasks by new hire
  const grouped: Record<string, UserTaskAssignment[]> = {};
  assignments.forEach((a) => {
    if (!grouped[a.newHireId]) grouped[a.newHireId] = [];
    grouped[a.newHireId].push(a);
  });

  // Helper for overdue detection
  const isOverdue = (t: UserTaskAssignment) => {
    if (!t.dueDate || t.completed) return false;
    // Firestore Timestamp or JS Date or string
    let due: Date | null = null;
    if (typeof t.dueDate?.toDate === "function") {
      due = t.dueDate.toDate();
    } else if (typeof t.dueDate === "string" || t.dueDate instanceof Date) {
      due = new Date(t.dueDate);
    }
    if (!due) return false;
    const now = new Date();
    now.setHours(0,0,0,0);
    due.setHours(0,0,0,0);
    return due < now;
  };

  const totalAssigned = assignments.length;
  const totalCompleted = assignments.filter(t => t.completed).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-blue-600 animate-pulse">
        <ClipboardCheck className="w-8 h-8 mb-2" />
        Loading assigned onboarding tasks...
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8 flex flex-col items-center">
        <PartyPopper className="w-8 h-8 mb-2 text-green-400" />
        <div className="text-lg mt-2">No onboarding tasks assigned to you yet!</div>
      </div>
    );
  }

  return (
    <div className="relative bg-white/90 rounded-2xl shadow-xl border border-brand-100 p-6 mb-8">
      {/* Toast anchor */}
      <div ref={toastAnchor} className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        {toast && (
          <Toast
            message={toast}
            type="success"
            onClose={() => setToast(null)}
          />
        )}
      </div>
      <h2 className="text-2xl font-bold mb-2 text-brand-800 flex items-center gap-2">
        <Users2 className="w-6 h-6" />
        My Assigned Onboarding Tasks
      </h2>
      <div className="text-sm text-gray-500 mb-6">
        These are onboarding steps you are responsible for (as manager, IT, or assignee).
      </div>

      {totalAssigned === totalCompleted && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200 text-green-700 font-semibold shadow">
          <CheckCircle2 className="w-5 h-5" />
          🎉 All assigned onboarding tasks are complete!
        </div>
      )}

      {Object.entries(grouped).map(([newHireId, tasks]) => {
        const newHire =
          users.find((u) => u.uid === newHireId) || { fullName: "Unknown", email: "" };
        const completedCount = tasks.filter((t) => t.completed).length;
        const allComplete = tasks.length > 0 && completedCount === tasks.length;
        const anyOverdue = tasks.some(isOverdue);

        return (
          <div
            key={newHireId}
            className={`mb-7 p-4 rounded-xl border ${
              allComplete
                ? "bg-green-50 border-green-200"
                : anyOverdue
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-100"
            } shadow`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-blue-700 text-lg">
                {newHire.fullName || newHire.email}
              </span>
              {newHire.email && (
                <span className="ml-2 text-xs bg-gray-200 rounded px-2">
                  {newHire.email}
                </span>
              )}
              {allComplete && (
                <span className="ml-2 text-green-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Done
                </span>
              )}
              {anyOverdue && !allComplete && (
                <span className="ml-2 text-red-600 text-xs font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Overdue
                </span>
              )}
              <span className="ml-auto text-xs text-gray-400">
                {completedCount}/{tasks.length} done
              </span>
            </div>
            <ul className="flex flex-col gap-2 mt-2">
              {tasks
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((t) => {
                  const docLink = t.documentId
                    ? docs.find((d) => d.id === t.documentId)
                    : null;
                  const overdue = isOverdue(t);
                  return (
                    <li
                      key={t.id}
                      className={`flex flex-col md:flex-row md:items-center gap-3 p-3 rounded border ${
                        t.completed
                          ? "bg-green-50 border-green-300 opacity-80"
                          : overdue
                          ? "bg-red-100 border-red-300 animate-pulse"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold flex items-center gap-2">
                          {t.completed ? (
                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                          ) : overdue ? (
                            <AlertTriangle className="text-red-500 w-5 h-5" />
                          ) : (
                            <Clock8 className="text-yellow-400 w-5 h-5" />
                          )}
                          {t.title}
                          {t.department && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                              {t.department}
                            </span>
                          )}
                          {t.dueDate && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded
                              ${overdue
                                ? "bg-red-200 text-red-700 font-bold"
                                : "bg-yellow-50 text-yellow-700"}`}>
                              {overdue
                                ? "Overdue"
                                : (() => {
                                    if (typeof t.dueDate?.toDate === "function") {
                                      return `Due: ${t.dueDate.toDate().toLocaleDateString()}`;
                                    }
                                    if (typeof t.dueDate === "string" || t.dueDate instanceof Date) {
                                      return `Due: ${new Date(t.dueDate).toLocaleDateString()}`;
                                    }
                                    return "";
                                  })()
                              }
                            </span>
                          )}
                          {docLink && (
                            <a
                              href={docLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 underline flex items-center gap-1 text-xs ml-2"
                            >
                              <FileText className="w-4 h-4 mr-0.5 inline" />
                              {docLink.title || "Document"}
                            </a>
                          )}
                        </div>
                        {t.description && (
                          <div className="text-xs text-gray-600 mt-1">{t.description}</div>
                        )}
                      </div>
                      <div>
                        {!t.completed && (
                          <button
                            className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition text-xs"
                            onClick={() => markComplete(t.id)}
                            disabled={!!markingId}
                            aria-disabled={!!markingId}
                          >
                            {markingId === t.id ? "Marking..." : "Mark Complete"}
                          </button>
                        )}
                        {t.completed && t.completedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            Completed:{" "}
                            {typeof t.completedAt === "object" && t.completedAt.toDate
                              ? t.completedAt.toDate().toLocaleDateString()
                              : ""}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
