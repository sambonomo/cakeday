"use client";

import { useEffect, useState } from "react";
import { getOnboardingTasks, getUserProgress, setUserTaskProgress } from "../lib/firestoreOnboarding";
import { useAuth } from "../context/AuthContext";

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [tasksData, progressData] = await Promise.all([
        getOnboardingTasks(),
        getUserProgress(user.uid),
      ]);
      setTasks(tasksData);
      setProgress(progressData || {});
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!user) return;
    setProgress((prev) => ({ ...prev, [taskId]: completed }));
    await setUserTaskProgress(user.uid, taskId, completed);
  };

  if (loading) return <div className="text-gray-600">Loading checklist...</div>;

  if (tasks.length === 0) return <div>No onboarding steps have been added yet.</div>;

  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={`flex items-start gap-3 p-3 rounded border ${progress[task.id] ? "bg-green-50 border-green-300" : "bg-white border-gray-200"}`}
        >
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 text-blue-600"
            checked={!!progress[task.id]}
            onChange={(e) => toggleTask(task.id, e.target.checked)}
          />
          <div>
            <div className="font-semibold">{task.title}</div>
            {task.description && (
              <div className="text-sm text-gray-500">{task.description}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
