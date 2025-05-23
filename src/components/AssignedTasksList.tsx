"use client";

import { useEffect, useState } from "react";
import {
  getOnboardingTemplates,
  getTemplateTasks,
  getUserProgress,
  setUserTaskProgress,
} from "../lib/firestoreOnboarding";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { FileText, ClipboardCheck, PartyPopper } from "lucide-react";

type DocInfo = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  category: string;
};

type OnboardingTask = {
  id: string;
  title: string;
  description?: string;
  department?: string;
  defaultAssigneeRole?: string;
  dueOffsetDays?: number;
  documentId?: string;
  enabled?: boolean;
  [key: string]: any;
};

export default function AssignedTasksList({ companyId: propCompanyId }: { companyId?: string }) {
  const { user, companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !companyId) return;
    const fetchData = async () => {
      setLoading(true);
      // 1. Load all templates for the company
      const loadedTemplates = await getOnboardingTemplates(companyId);
      setTemplates(loadedTemplates);

      // 2. Fetch tasks for each template and filter for those assigned to this user
      let allTasks: OnboardingTask[] = [];
      for (const template of loadedTemplates) {
        const tasks = await getTemplateTasks(template.id);
        tasks.forEach((t: OnboardingTask) => {
          const isAssigned =
            (t.defaultAssigneeRole === "user" && user.status === "newHire") ||
            (t.defaultAssigneeRole === user.role) ||
            (t.defaultAssigneeRole && user?.role && t.defaultAssigneeRole.toLowerCase() === user.role.toLowerCase());
          if (isAssigned && t.enabled !== false) {
            allTasks.push({
              ...t,
              templateName: template.name,
              templateId: template.id,
              department: t.department || template.department || "General",
            });
          }
        });
      }
      setAssignedTasks(allTasks);

      // 3. Fetch user progress
      const progressData = await getUserProgress(user.uid, companyId);
      setProgress(progressData || {});

      // 4. Load docs
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

  // Progress calculation
  const totalTasks = assignedTasks.length;
  const completedTasks = assignedTasks.filter((t) => progress[t.id]).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Group by template and department
  const grouped = assignedTasks.reduce((acc: Record<string, Record<string, OnboardingTask[]>>, task) => {
    const tmpl = task.templateName || "General";
    const dept = task.department || "General";
    if (!acc[tmpl]) acc[tmpl] = {};
    if (!acc[tmpl][dept]) acc[tmpl][dept] = [];
    acc[tmpl][dept].push(task);
    return acc;
  }, {});

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center text-blue-600 py-12 animate-pulse">
        <ClipboardCheck className="w-8 h-8 mb-2" />
        Loading your assigned tasks...
      </div>
    );

  if (assignedTasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 flex flex-col items-center">
        <PartyPopper className="w-8 h-8 mb-2 text-green-400" />
        <div className="text-lg mt-2">You have no outstanding assigned onboarding tasks.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-blue-800 font-bold text-lg flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Assigned Tasks
          </span>
          <span className="text-sm font-semibold text-gray-700">{completedTasks} of {totalTasks} complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      {/* Group by template and department */}
      {Object.entries(grouped).map(([templateName, depts]) => (
        <div key={templateName} className="mb-5">
          <div className="font-bold text-blue-700 text-base mb-2 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-400" />
            {templateName}
          </div>
          {Object.entries(depts).map(([dept, tasks]) => (
            <div key={dept}>
              {Object.keys(depts).length > 1 && (
                <div className="font-semibold text-blue-500 text-sm mb-1">{dept}</div>
              )}
              <ul className="flex flex-col gap-3">
                {tasks.map((task) => {
                  const doc = task.documentId ? docs.find((d) => d.id === task.documentId) : null;
                  return (
                    <li
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded border transition-all duration-300
                        ${progress[task.id]
                          ? "bg-green-50 border-green-300 opacity-80"
                          : "bg-white border-gray-200"
                        }
                        hover:shadow`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 text-blue-600 accent-blue-600 transition"
                        checked={!!progress[task.id]}
                        onChange={(e) => toggleTask(task.id, e.target.checked)}
                        aria-label={`Mark ${task.title} as ${progress[task.id] ? "incomplete" : "complete"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold flex items-center gap-2 flex-wrap">
                          {task.title}
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
                        {task.defaultAssigneeRole && (
                          <div className="text-xs text-gray-400 mt-1">
                            Assigned to: {task.defaultAssigneeRole}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
