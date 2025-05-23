"use client";

import { useEffect, useState } from "react";
import { getUserProgress, setUserTaskProgress, getOnboardingTemplates, getTemplateTasks } from "../lib/firestoreOnboarding";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  FileText,
  Lock,
  User,
  Users,
  Wrench,
  Laptop2,
  Building,
  PartyPopper,
  Paperclip,
  ClipboardList,
} from "lucide-react";

// Helper: Maps role to icon/pill (no emoji, just Lucide icons)
const ROLE_PILLS: Record<
  string,
  { label: string; Icon: React.ElementType; color: string }
> = {
  user: { label: "You", Icon: User, color: "bg-green-100 text-green-800" },
  manager: { label: "Manager", Icon: Users, color: "bg-blue-100 text-blue-800" },
  admin: { label: "HR", Icon: Wrench, color: "bg-pink-100 text-pink-700" },
  IT: { label: "IT", Icon: Laptop2, color: "bg-yellow-100 text-yellow-800" },
  undefined: { label: "Other", Icon: User, color: "bg-gray-100 text-gray-500" }
};

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

function groupByDepartment(tasks: any[]) {
  const grouped: Record<string, any[]> = {};
  tasks.forEach((task) => {
    const dept = task.department || "General";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(task);
  });
  return grouped;
}

// Mini Confetti Burst
function ConfettiBurst() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed top-20 left-1/2 z-50 pointer-events-none select-none" style={{ transform: "translateX(-50%)" }}>
      <div className="text-5xl animate-[wiggle_1s_ease-in-out]">
        <PartyPopper className="inline w-10 h-10 text-pink-500 mx-2" />
        <PartyPopper className="inline w-10 h-10 text-yellow-400 mx-2" />
        <PartyPopper className="inline w-10 h-10 text-green-400 mx-2" />
      </div>
    </div>
  );
}

export default function OnboardingChecklist({ companyId: propCompanyId }: OnboardingChecklistProps) {
  const { user, companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [tasks, setTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [template, setTemplate] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user || !companyId) return;
    const fetchData = async () => {
      setLoading(true);

      // 1. Find best template for user (dept/role/fallback)
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

      // 2. Fetch tasks for that template
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
          id: d.id
        }))
      );

      setLoading(false);
    };
    fetchData();
  }, [user, companyId]);

  // Handler with feedback: show confetti when last task marked complete
  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!user || !companyId) return;
    setProgress((prev) => ({ ...prev, [taskId]: completed }));

    await setUserTaskProgress(user.uid, taskId, completed, companyId);

    // Show confetti if ALL tasks are done!
    if (!progress[taskId] && completed) {
      const completedNow = tasks.filter((t) =>
        t.id === taskId ? true : progress[t.id]
      ).length;
      if (completedNow === tasks.length) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2500);
      }
    }
  };

  // Group tasks by department for UI
  const groupedTasks = groupByDepartment(tasks);

  // Progress calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => progress[t.id]).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  if (loading) return <div className="text-gray-600">Loading checklist...</div>;

  if (!template) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Building className="mx-auto w-10 h-10 text-gray-400" aria-hidden="true" />
        <div className="text-lg mt-2">No onboarding checklist found for your department/role yet.</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <ClipboardList className="mx-auto w-8 h-8 text-gray-400" aria-hidden="true" />
        <div className="text-lg mt-2">
          No onboarding steps have been added for your checklist: <b>{template.name}</b>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showConfetti && <ConfettiBurst />}
      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-1">
          <span className="text-brand-800 font-extrabold text-xl flex items-center gap-2">
            {template.name}
            {progressPercent === 100 && (
              <span className="ml-2 text-green-600 text-lg animate-bounce">✔️</span>
            )}
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {completedTasks} of {totalTasks} tasks complete
          </span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 via-blue-500 to-brand-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
          <div className="absolute right-2 top-0 h-4 flex items-center text-xs font-bold text-brand-700">
            {progressPercent}%
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {template.department && (
            <span className="ml-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center gap-1">
              <Building className="w-4 h-4" /> {template.department}
            </span>
          )}
          {template.role && (
            <span className="ml-2 text-xs bg-pink-100 text-pink-600 rounded-full px-2 font-semibold flex items-center gap-1">
              <Wrench className="w-4 h-4" /> {template.role}
            </span>
          )}
        </div>
        {template.description && (
          <div className="text-xs text-gray-500 mt-1">{template.description}</div>
        )}
      </div>

      {/* Department sections */}
      <div className="flex flex-col gap-6">
        {Object.entries(groupedTasks).map(([dept, deptTasks], i) => (
          <div key={dept} className="mb-2">
            {Object.keys(groupedTasks).length > 1 && (
              <div className="font-semibold text-blue-700 text-lg mb-3 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" /> {dept}
              </div>
            )}
            <ul className="flex flex-col gap-3">
              {deptTasks.map((task: any) => {
                const doc = task.documentId
                  ? docs.find((d) => d.id === task.documentId)
                  : null;
                const isSelfTask = !task.defaultAssigneeRole || task.defaultAssigneeRole === "user";
                const pill = ROLE_PILLS[task.defaultAssigneeRole || "user"] || ROLE_PILLS.undefined;
                const taskCompleted = !!progress[task.id];

                return (
                  <li
                    key={task.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 group shadow-sm
                      ${taskCompleted ? "bg-green-50 border-green-300 opacity-80" : "bg-white/90 border-gray-200"}
                      ${taskCompleted ? "line-through text-gray-400" : ""}
                      hover:shadow-md`}
                  >
                    {/* Checkbox: Disable for non-user tasks */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        className={`h-5 w-5 accent-blue-600 transition-transform duration-200 ${
                          !isSelfTask ? "cursor-not-allowed opacity-60" : ""
                        }`}
                        checked={taskCompleted}
                        onChange={
                          isSelfTask
                            ? (e) => toggleTask(task.id, e.target.checked)
                            : undefined
                        }
                        disabled={!isSelfTask}
                        aria-label={
                          isSelfTask
                            ? `Mark ${task.title} as ${taskCompleted ? "incomplete" : "complete"}`
                            : "This task is assigned to another role"
                        }
                        title={
                          isSelfTask
                            ? ""
                            : "This step is assigned to another role and can only be completed by them"
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2 flex-wrap">
                        {/* Task Title */}
                        <span
                          className={`transition-colors duration-200 ${
                            taskCompleted ? "line-through text-gray-400" : "text-brand-900"
                          }`}
                        >
                          {task.title}
                        </span>
                        {/* Role pill */}
                        <span
                          className={`ml-1 px-2 py-0.5 text-xs rounded-full font-semibold flex items-center gap-1 ${pill.color}`}
                          title={pill.label}
                        >
                          <pill.Icon className="w-4 h-4" />
                          {pill.label}
                        </span>
                        {/* Due date */}
                        {typeof task.dueOffsetDays === "number" && task.dueOffsetDays > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full font-medium">
                            Due +{task.dueOffsetDays}d
                          </span>
                        )}
                        {/* Doc link */}
                        {doc && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-700 underline ml-2 hover:text-accent-600"
                            title="View attachment"
                          >
                            <Paperclip className="w-4 h-4" />
                            <FileText className="w-4 h-4" />
                            {doc.title || "Document"}
                          </a>
                        )}
                        {/* Lock icon for non-user tasks */}
                        {!isSelfTask && (
                          <span className="ml-2 text-gray-400" title="This task is for another role">
                            <Lock className="inline w-4 h-4" />
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <div className={`text-xs mt-1 ${taskCompleted ? "text-gray-300" : "text-gray-600"}`}>
                          {task.description}
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

      {/* Final celebratory message */}
      {progressPercent === 100 && (
        <div className="mt-6 text-center text-green-700 font-bold text-lg flex flex-col items-center gap-2 animate-fade-in-up">
          <PartyPopper className="w-10 h-10 mx-auto mb-2 text-green-500" />
          <span>All tasks complete! Welcome to the team — you're officially onboarded!</span>
        </div>
      )}
    </div>
  );
}
