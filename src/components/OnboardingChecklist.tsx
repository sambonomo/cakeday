"use client";

import { useEffect, useState } from "react";
import { getUserProgress, setUserTaskProgress, getOnboardingTemplates, getTemplateTasks } from "../lib/firestoreOnboarding";
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

// Group tasks by department for display
function groupByDepartment(tasks: any[]) {
  const grouped: Record<string, any[]> = {};
  tasks.forEach((task) => {
    const dept = task.department || "General";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(task);
  });
  return grouped;
}

export default function OnboardingChecklist({ companyId: propCompanyId }: OnboardingChecklistProps) {
  const { user, companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [tasks, setTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    if (!user || !companyId) return;
    const fetchData = async () => {
      setLoading(true);

      // 1. Find the best template for this user (by dept, role, fallback to any)
      const templates = await getOnboardingTemplates(companyId);
      let found: any = null;
      if (user.department && user.role) {
        found = templates.find(
          (t) =>
            t.department?.toLowerCase() === user.department?.toLowerCase() &&
            t.role?.toLowerCase() === user.role?.toLowerCase()
        );
      }
      if (!found && user.department) {
        found = templates.find((t) => t.department?.toLowerCase() === user.department?.toLowerCase());
      }
      if (!found && user.role) {
        found = templates.find((t) => t.role?.toLowerCase() === user.role?.toLowerCase());
      }
      if (!found && templates.length > 0) {
        found = templates[0];
      }
      setTemplate(found);

      // 2. Fetch tasks for that template (or none if no template)
      let tasksData: any[] = [];
      if (found) {
        tasksData = await getTemplateTasks(found.id);
      }
      setTasks(tasksData);

      // 3. Fetch progress
      const progressData = await getUserProgress(user.uid, companyId);
      setProgress(progressData || {});

      // 4. Docs (for task.documentId)
      const docsSnap = await getDocs(
        query(collection(db, "documents"), where("companyId", "==", companyId))
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

  // Group tasks by department for UI
  const groupedTasks = groupByDepartment(tasks);

  // Progress calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => progress[t.id]).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  if (loading)
    return <div className="text-gray-600">Loading checklist...</div>;

  if (!template) {
    return (
      <div className="text-center text-gray-500 py-8">
        <span className="text-3xl">🤷‍♂️</span>
        <div className="text-lg mt-2">No onboarding checklist found for your department/role yet.</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <span className="text-2xl">📋</span>
        <div className="text-lg mt-2">
          No onboarding steps have been added for your checklist: <b>{template.name}</b>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-blue-800 font-bold text-lg">{template.name}</span>
          <span className="text-sm font-semibold text-gray-700">{completedTasks} of {totalTasks} tasks complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {template.department && (
          <span className="ml-1 text-sm px-2 py-1 rounded bg-blue-100 text-blue-600">{template.department}</span>
        )}
        {template.role && (
          <span className="ml-2 text-xs bg-pink-100 text-pink-600 rounded px-2">{template.role}</span>
        )}
        {template.description && (
          <div className="text-xs text-gray-500 mt-1">{template.description}</div>
        )}
      </div>
      {/* Department sections */}
      <ul className="flex flex-col gap-4">
        {Object.entries(groupedTasks).map(([dept, deptTasks]) => (
          <li key={dept} className="mb-2">
            {Object.keys(groupedTasks).length > 1 && (
              <div className="font-semibold text-blue-700 text-base mb-2">{dept}</div>
            )}
            <ul className="flex flex-col gap-3">
              {deptTasks.map((task: any) => {
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
                      aria-label={`Mark ${task.title} as ${progress[task.id] ? "incomplete" : "complete"}`}
                    />
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {task.title}
                        {task.defaultAssigneeRole && (
                          <span className="ml-1 px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded">{task.defaultAssigneeRole}</span>
                        )}
                        {typeof task.dueOffsetDays === "number" && task.dueOffsetDays > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded">
                            Due +{task.dueOffsetDays}d
                          </span>
                        )}
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
          </li>
        ))}
      </ul>
    </div>
  );
}
