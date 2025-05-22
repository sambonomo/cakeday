"use client";

import React, { useEffect, useState } from "react";
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
import { FileText, CheckCircle2, Clock8, Users2 } from "lucide-react";

// --- Utility Types ---
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
      // SAFEST: Omit 'id' if present in Firestore data (shouldn't be, but prevents warning)
      const assignments = snap.docs.map((d) => {
        const data = d.data() as Omit<UserTaskAssignment, "id"> & { id?: string };
        // Remove any id property from Firestore data, then set the correct id from Firestore doc id
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
          // Defensive: Remove any id field from Firestore data, then set id from doc
          const { id: _, ...rest } = data;
          return { ...rest, id: d.id };
        })
      );

      setAssignments(assignments);
      setUsers(users);
      setLoading(false);
    };
    fetchData();
  }, [user, companyId, toast]);

  // Mark task complete
  async function markComplete(assignmentId: string) {
    setLoading(true);
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
    setLoading(false);
  }

  // Group tasks by new hire (for managers/IT, grouped by person they help onboard)
  const grouped: Record<string, UserTaskAssignment[]> = {};
  assignments.forEach((a) => {
    if (!grouped[a.newHireId]) grouped[a.newHireId] = [];
    grouped[a.newHireId].push(a);
  });

  if (loading) {
    return (
      <div className="text-blue-600 text-center py-12 animate-pulse">
        Loading assigned onboarding tasks...
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <span className="text-3xl">👍</span>
        <div className="text-lg mt-2">No onboarding tasks assigned to you yet!</div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-brand-100 p-6 mb-8">
      <h2 className="text-2xl font-bold mb-2 text-brand-800 flex items-center gap-2">
        <Users2 className="w-6 h-6" />
        My Assigned Onboarding Tasks
      </h2>
      <div className="text-sm text-gray-500 mb-6">
        These are onboarding steps you are responsible for (as manager, IT, or assignee).
      </div>

      {Object.entries(grouped).map(([newHireId, tasks]) => {
        const newHire =
          users.find((u) => u.uid === newHireId) || { fullName: "Unknown", email: "" };
        const completedCount = tasks.filter((t) => t.completed).length;

        return (
          <div
            key={newHireId}
            className="mb-7 p-4 rounded-xl bg-blue-50 border border-blue-100 shadow"
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
                  return (
                    <li
                      key={t.id}
                      className={`flex flex-col md:flex-row md:items-center gap-3 p-3 rounded border ${
                        t.completed
                          ? "bg-green-50 border-green-300"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold flex items-center gap-2">
                          {t.completed ? (
                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                          ) : (
                            <Clock8 className="text-yellow-400 w-5 h-5" />
                          )}
                          {t.title}
                          {t.department && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                              {t.department}
                            </span>
                          )}
                          {typeof t.dueDate === "object" && t.dueDate?.toDate && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded">
                              Due: {t.dueDate.toDate().toLocaleDateString()}
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
                          >
                            Mark Complete
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
      {toast && (
        <Toast
          message={toast}
          type="success"
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
