"use client";

import { useState, useEffect } from "react";
import {
  addOnboardingTask,
  updateOnboardingTask,
  deleteOnboardingTask,
  OnboardingTask,
} from "../lib/firestoreOnboarding";
import { useAuth } from "../context/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Loader2, X, Edit, Trash2 } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Toast from "./Toast";

interface AdminOnboardingTasksProps {
  companyId?: string;
}

export default function AdminOnboardingTasks({ companyId: propCompanyId }: AdminOnboardingTasksProps) {
  const { companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Real-time Firestore subscription for onboarding tasks
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const q = query(
      collection(db, "onboardingTasks"),
      where("companyId", "==", companyId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as OnboardingTask[];
      setTasks(loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [companyId]);

  // Edit, cancel, form
  const startEdit = (task: OnboardingTask) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setSuccess(null);
    setError(null);
  };
  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setError(null);
    setSuccess(null);
  };

  // Add or update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!companyId) {
      setError("Company ID missing. Please log in again.");
      setLoading(false);
      return;
    }
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
        }, companyId);
        setSuccess("Task updated!");
      } else {
        const nextOrder = tasks.length + 1;
        await addOnboardingTask({
          title: title.trim(),
          description: description.trim(),
          order: nextOrder,
        }, companyId);
        setSuccess("Task added!");
      }
      setTitle("");
      setDescription("");
      setEditId(null);
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
      if (!companyId) throw new Error("Missing company ID.");
      await deleteOnboardingTask(id, companyId);
      setSuccess("Task deleted!");
    } catch (err: any) {
      setError(err.message || "Error deleting task.");
    }
    setLoading(false);
  };

  // Drag-and-drop reorder
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const newTasks = Array.from(tasks);
    const [moved] = newTasks.splice(result.source.index, 1);
    newTasks.splice(result.destination.index, 0, moved);

    // Update local state for instant feedback
    setTasks(newTasks);

    setLoading(true);
    try {
      await Promise.all(
        newTasks.map((task, idx) =>
          updateOnboardingTask(task.id, { order: idx + 1 }, companyId!)
        )
      );
      setSuccess("Order updated!");
    } catch (err: any) {
      setError("Failed to save new order. Please refresh.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-tr from-white via-blue-50 to-blue-100 rounded-3xl shadow-2xl p-8 w-full max-w-2xl mt-10">
      <div className="mb-6 flex flex-col items-center gap-2">
        <h2 className="text-3xl font-bold text-blue-800">Onboarding Builder</h2>
        <p className="text-gray-600 text-sm">✨ Drag, edit, and build a world-class onboarding journey.</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white/90 border border-blue-100 rounded-xl p-5 shadow mb-8"
      >
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Task Title"
            value={title}
            className="flex-1 p-3 border-2 border-blue-200 focus:border-blue-500 rounded-lg text-base transition"
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={60}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : editId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editId ? "Update" : "Add"}
          </button>
          {editId && (
            <button
              type="button"
              className="bg-gray-100 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 font-semibold ml-1 hover:bg-gray-200 transition"
              onClick={cancelEdit}
              aria-label="Cancel Edit"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <textarea
          placeholder="Description (optional)"
          value={description}
          className="p-3 border-2 border-gray-200 focus:border-blue-400 rounded-lg text-base transition"
          onChange={e => setDescription(e.target.value)}
          rows={2}
          maxLength={120}
        />
        {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
        {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}
      </form>
      <hr className="mb-6 border-blue-100" />
      <div>
        <h3 className="font-semibold mb-3 text-blue-700 flex items-center gap-1 text-lg">
          <GripVertical className="inline w-6 h-6 text-blue-300" />
          Drag to Reorder Steps
        </h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks-droppable">
            {(provided) => (
              <ul
                className="flex flex-col gap-4 min-h-[120px] mb-4"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {tasks.length === 0 && (
                  <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                    <span className="text-5xl mb-3">🤷‍♂️</span>
                    <div className="text-lg font-semibold">No onboarding steps yet.</div>
                    <div className="text-xs text-gray-500 mt-1">Add your first step above!</div>
                  </div>
                )}
                {tasks
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((task, idx) => (
                  <Draggable draggableId={task.id} index={idx} key={task.id}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all duration-200 p-4 border-2 rounded-2xl bg-white shadow-lg flex flex-col group
                          ${
                            snapshot.isDragging
                              ? "border-blue-400 shadow-2xl scale-[1.03] bg-blue-50"
                              : "border-gray-200"
                          }`}
                        style={{
                          boxShadow: snapshot.isDragging
                            ? "0 4px 24px 0 #93c5fd66"
                            : undefined,
                          ...provided.draggableProps.style,
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-6 h-6 text-blue-300" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-blue-900 truncate text-lg">{task.title}</div>
                            {task.description && (
                              <div className="text-gray-500 text-sm mt-1">{task.description}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                              onClick={() => startEdit(task)}
                              type="button"
                              aria-label="Edit"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                              onClick={() => handleDelete(task.id)}
                              type="button"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
