"use client";

import { useState, useEffect } from "react";
import {
  addOnboardingTask,
  getOnboardingTasks,
  updateOnboardingTask,
  deleteOnboardingTask,
  OnboardingTask,
} from "../lib/firestoreOnboarding";
import { useAuth } from "../context/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react"; // Optional: use your own icon or unicode "☰"

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

  const fetchTasks = async () => {
    if (!companyId) return;
    const loadedTasks = await getOnboardingTasks(companyId);
    setTasks(loadedTasks);
  };

  useEffect(() => {
    fetchTasks();
    // Only fetch tasks when companyId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Start editing a task
  const startEdit = (task: OnboardingTask) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setSuccess(null);
    setError(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setError(null);
    setSuccess(null);
  };

  // Add or update a task
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
        // Add to end of list
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
      if (!companyId) throw new Error("Missing company ID.");
      await deleteOnboardingTask(id, companyId);
      setSuccess("Task deleted!");
      fetchTasks();
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

    // Update local state for immediate UI feedback
    setTasks(newTasks);

    // Save new order to Firestore
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
      fetchTasks();
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
          Drag to Reorder Onboarding Tasks
        </h3>
        {tasks.length === 0 && (
          <div className="text-gray-500">No tasks found yet.</div>
        )}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks-droppable">
            {(provided) => (
              <ul
                className="flex flex-col gap-2"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {tasks
                  .slice() // ensure sorted by order
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((task, idx) => (
                  <Draggable draggableId={task.id} index={idx} key={task.id}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-2 border rounded flex flex-col bg-gray-50 border-gray-200 shadow-sm transition 
                          ${snapshot.isDragging ? "bg-yellow-100 border-yellow-400" : ""}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing mr-1"
                              title="Drag to reorder"
                            >
                              {/* Use a drag icon or unicode bar */}
                              <GripVertical className="w-5 h-5 text-gray-400 inline" />
                            </span>
                            <span className="font-semibold">{task.title}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="text-blue-600 hover:underline text-sm"
                              onClick={() => startEdit(task)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:underline text-sm"
                              onClick={() => handleDelete(task.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <span className="text-gray-500 text-sm">{task.description}</span>
                        )}
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
