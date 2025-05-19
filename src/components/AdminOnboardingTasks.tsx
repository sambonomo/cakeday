"use client";

import { useState, useEffect } from "react";
import {
  addOnboardingTask,
  getOnboardingTasks,
  updateOnboardingTask,
  deleteOnboardingTask,
  OnboardingTask,
} from "../lib/firestoreOnboarding";

export default function AdminOnboardingTasks() {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTasks = async () => {
    const loadedTasks = await getOnboardingTasks();
    setTasks(loadedTasks);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Start editing a task
  const startEdit = (task: OnboardingTask) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setOrder(task.order ?? 1);
    setSuccess(null);
    setError(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setOrder(1);
    setError(null);
    setSuccess(null);
  };

  // Add or update a task
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!title.trim()) {
      setError("Title is required.");
      setLoading(false);
      return;
    }

    try {
      if (editId) {
        await updateOnboardingTask(editId, {
          title: title.trim(),
          description: description.trim(),
          order,
        });
        setSuccess("Task updated!");
      } else {
        await addOnboardingTask({
          title: title.trim(),
          description: description.trim(),
          order,
        });
        setSuccess("Task added!");
      }
      setTitle("");
      setDescription("");
      setOrder(1);
      setEditId(null);
      fetchTasks();
    } catch (err: any) {
      setError(err.message || "Error saving task.");
    }
    setLoading(false);
  };

  // Delete a task
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await deleteOnboardingTask(id);
      setSuccess("Task deleted!");
      fetchTasks();
    } catch (err: any) {
      setError(err.message || "Error deleting task.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full max-w-xl mt-8">
      <h2 className="text-xl font-semibold mb-4 text-blue-700">
        Admin: Add / Edit Onboarding Task
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          className="p-2 border border-gray-300 rounded"
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          className="p-2 border border-gray-300 rounded"
          onChange={e => setDescription(e.target.value)}
          rows={2}
        />
        <input
          type="number"
          placeholder="Order (e.g., 1, 2, 3...)"
          value={order}
          className="p-2 border border-gray-300 rounded w-32"
          min={1}
          onChange={e => setOrder(Number(e.target.value))}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? (editId ? "Updating..." : "Adding...") : editId ? "Update Task" : "Add Task"}
          </button>
          {editId && (
            <button
              type="button"
              className="bg-gray-300 text-gray-800 rounded px-4 py-2 hover:bg-gray-400 transition"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
      </form>
      <hr className="mb-6" />
      <div>
        <h3 className="font-semibold mb-2 text-blue-600">
          Current Onboarding Tasks
        </h3>
        {tasks.length === 0 && (
          <div className="text-gray-500">No tasks found yet.</div>
        )}
        <ul className="flex flex-col gap-2">
          {tasks.map(task => (
            <li
              key={task.id}
              className="p-2 border rounded flex flex-col bg-gray-50 border-gray-200"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {task.order}. {task.title}
                </span>
                <div className="flex gap-2">
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => startEdit(task)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline text-sm"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {task.description && (
                <span className="text-gray-500 text-sm">{task.description}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
