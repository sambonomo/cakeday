"use client";

import { useEffect, useState } from "react";
import { getOnboardingTasks, getUserProgress, setUserTaskProgress } from "../lib/firestoreOnboarding";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { FileText } from "lucide-react";

interface OnboardingChecklistProps {
  companyId?: string;
}

type DocInfo = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  category: string;
};

export default function OnboardingChecklist({ companyId: propCompanyId }: OnboardingChecklistProps) {
  const { user, companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [tasks, setTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocInfo[]>([]);

  useEffect(() => {
    if (!user || !companyId) return;
    const fetchData = async () => {
      setLoading(true);
      // Fetch tasks and user progress
      const [tasksData, progressData] = await Promise.all([
        getOnboardingTasks(companyId),
        getUserProgress(user.uid, companyId),
      ]);
      setTasks(tasksData);
      setProgress(progressData || {});

      // Fetch all onboarding/general docs for this company (to resolve task.documentId)
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
    fetchData();
  }, [user, companyId]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!user || !companyId) return;
    setProgress((prev) => ({ ...prev, [taskId]: completed }));
    await setUserTaskProgress(user.uid, taskId, completed, companyId);
  };

  if (loading) return <div className="text-gray-600">Loading checklist...</div>;
  if (tasks.length === 0) return <div>No onboarding steps have been added yet.</div>;

  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => {
        const doc = task.documentId
          ? docs.find((d) => d.id === task.documentId)
          : null;
        return (
          <li
            key={task.id}
            className={`flex items-start gap-3 p-3 rounded border ${
              progress[task.id]
                ? "bg-green-50 border-green-300"
                : "bg-white border-gray-200"
            }`}
          >
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 text-blue-600"
              checked={!!progress[task.id]}
              onChange={(e) => toggleTask(task.id, e.target.checked)}
            />
            <div>
              <div className="font-semibold flex items-center gap-2">
                {task.title}
                {doc && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline flex items-center gap-1 text-xs ml-2"
                  >
                    <FileText className="w-4 h-4 mr-0.5 inline" />
                    {doc.title || "Document"}
                  </a>
                )}
              </div>
              {task.description && (
                <div className="text-sm text-gray-500">{task.description}</div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
