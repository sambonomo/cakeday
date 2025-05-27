"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  GripVertical,
  Plus,
  Loader2,
  X,
  Edit,
  Trash2,
  Mail,
  Slack,
  Calendar,
  Sparkles,
} from "lucide-react";
import Toast from "../../../components/Toast";

// Step type options (expand as needed)
const TASK_TYPE_OPTIONS = [
  { value: "manual", label: "Manual Task", icon: <Sparkles className="w-4 h-4 mr-1" /> },
  { value: "auto-email", label: "Auto Email", icon: <Mail className="w-4 h-4 mr-1" /> },
  { value: "calendar", label: "Calendar Event", icon: <Calendar className="w-4 h-4 mr-1" /> },
  { value: "slack", label: "Slack Message", icon: <Slack className="w-4 h-4 mr-1" /> },
  { value: "teams", label: "Teams Message", icon: <Slack className="w-4 h-4 mr-1 rotate-90" /> },
];

const SEND_WHEN_OPTIONS = [
  { value: "immediate", label: "Immediately" },
  { value: "last_day", label: "On Last Day" },
  { value: "custom_date", label: "Custom Date" },
];

export type OffboardingTask = {
  id: string;
  title: string;
  description?: string;
  type?: string;
  autoMessageTemplate?: string;
  sendWhen?: string;
  targetEmail?: string;
  order?: number;
  enabled?: boolean;
  companyId: string;
};

export default function AdminOffboardingPage() {
  const { companyId, role } = useAuth();

  const [tasks, setTasks] = useState<OffboardingTask[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<OffboardingTask["type"]>("manual");
  const [autoMessageTemplate, setAutoMessageTemplate] = useState("");
  const [sendWhen, setSendWhen] = useState<OffboardingTask["sendWhen"]>("immediate");
  const [targetEmail, setTargetEmail] = useState("");
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Real-time sync
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const q = query(
      collection(db, "offboardingTasks"),
      where("companyId", "==", companyId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OffboardingTask[];
      setTasks(
        loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, [companyId]);

  // Edit / cancel
  const startEdit = (task: OffboardingTask) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setType(task.type || "manual");
    setAutoMessageTemplate(task.autoMessageTemplate || "");
    setSendWhen(task.sendWhen || "immediate");
    setTargetEmail(task.targetEmail || "");
    setEnabled(task.enabled !== false);
    setSuccess(null);
    setError(null);
  };
  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setType("manual");
    setAutoMessageTemplate("");
    setSendWhen("immediate");
    setTargetEmail("");
    setEnabled(true);
    setError(null);
    setSuccess(null);
  };

  // Add / update
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
    const base = {
      title: title.trim(),
      description: description.trim(),
      type,
      autoMessageTemplate: type !== "manual" ? autoMessageTemplate : "",
      sendWhen: type !== "manual" ? sendWhen : undefined,
      targetEmail: type === "auto-email" ? targetEmail : undefined,
      enabled,
      companyId,
    };
    try {
      if (editId) {
        await setDoc(doc(db, "offboardingTasks", editId), base, { merge: true });
        setSuccess("Offboarding step updated!");
      } else {
        const nextOrder = tasks.length + 1;
        await addDoc(collection(db, "offboardingTasks"), {
          ...base,
          order: nextOrder,
        });
        setSuccess("Offboarding step added!");
      }
      cancelEdit();
    } catch (err: any) {
      setError(err.message || "Error saving task.");
    }
    setLoading(false);
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this offboarding step?")) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (!companyId) throw new Error("Missing company ID.");
      await deleteDoc(doc(db, "offboardingTasks", id));
      setSuccess("Offboarding step deleted!");
    } catch (err: any) {
      setError(err.message || "Error deleting step.");
    }
    setLoading(false);
  };

  // Drag-and-drop reorder
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const newTasks = Array.from(tasks);
    const [moved] = newTasks.splice(result.source.index, 1);
    newTasks.splice(result.destination.index, 0, moved);
    setTasks(newTasks);

    setLoading(true);
    try {
      await Promise.all(
        newTasks.map((task, idx) =>
          setDoc(
            doc(db, "offboardingTasks", task.id),
            { order: idx + 1 },
            { merge: true }
          )
        )
      );
      setSuccess("Order updated!");
    } catch (err: any) {
      setError("Failed to save new order. Please refresh.");
    }
    setLoading(false);
  };

  // Permission guard
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl p-8 shadow text-center max-w-lg">
          <h2 className="text-2xl font-bold text-brand-700 mb-3">
            Offboarding Steps
          </h2>
          <p className="text-gray-500">
            Only admins can view and edit offboarding steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        bg-gradient-to-tr from-white via-brand-50 to-accent-50
        rounded-3xl shadow-2xl p-8 w-full max-w-2xl mt-10 mx-auto
      "
    >
      <div className="mb-6 flex flex-col items-center gap-2">
        <h2 className="text-3xl font-bold text-accent-800">Offboarding Builder</h2>
        <p className="text-gray-600 text-sm">
          Farewell checklist, asset return, IT, messaging, and more. Automate your offboarding!
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white/90 border border-accent-100 rounded-xl p-5 shadow mb-8"
        aria-label="Offboarding step editor"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Step Title */}
          <input
            type="text"
            placeholder="Step Title"
            value={title}
            className="
              flex-1 p-3 border-2 border-accent-200
              focus:border-accent-500 rounded-lg text-base transition
            "
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={60}
            disabled={loading}
            aria-label="Step Title"
          />

          {/* Step Type */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="
              border border-accent-200 rounded-lg p-2
              bg-accent-50 font-semibold text-accent-700
            "
            disabled={loading}
            aria-label="Task Type"
          >
            {TASK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Add/Update Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-accent-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-semibold shadow hover:bg-accent-700 transition disabled:opacity-50"
            aria-disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : editId ? (
              <Edit className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {editId ? "Update" : "Add"}
          </button>

          {/* Cancel Edit Button (if editing) */}
          {editId && (
            <button
              type="button"
              className="
                bg-gray-100 border border-gray-300 text-gray-700
                rounded-lg px-4 py-2 font-semibold ml-1 hover:bg-gray-200
                transition
              "
              onClick={cancelEdit}
              aria-label="Cancel Edit"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Description */}
        <textarea
          placeholder="Description (optional)"
          value={description}
          className="
            p-3 border-2 border-gray-200 focus:border-accent-400
            rounded-lg text-base transition
          "
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={120}
          disabled={loading}
          aria-label="Description"
        />

        {/* Automation fields */}
        {type !== "manual" && (
          <div className="bg-accent-50 border border-accent-100 p-3 rounded-xl mt-2 flex flex-col gap-2">
            <label className="font-medium">
              Message Template
              <textarea
                placeholder="What message/email should be sent for this step? You can use {name}, {lastDay}, etc."
                value={autoMessageTemplate}
                className="
                  p-2 border border-accent-200 rounded mt-1
                  w-full text-sm
                "
                onChange={(e) => setAutoMessageTemplate(e.target.value)}
                rows={2}
                maxLength={200}
                disabled={loading}
                aria-label="Automation Message Template"
              />
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="font-medium">
                Send When:
                <select
                  value={sendWhen}
                  onChange={(e) => setSendWhen(e.target.value as any)}
                  className="
                    p-2 border border-accent-200 rounded ml-2
                    bg-white
                  "
                  disabled={loading}
                  aria-label="Automation Send When"
                >
                  {SEND_WHEN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              {type === "auto-email" && (
                <label className="font-medium flex-1">
                  Recipient Email (optional)
                  <input
                    type="email"
                    placeholder="e.g. it@company.com"
                    value={targetEmail}
                    className="
                      p-2 border border-accent-200 rounded ml-2
                      w-full
                    "
                    onChange={(e) => setTargetEmail(e.target.value)}
                    disabled={loading}
                    aria-label="Automation Recipient Email"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Enabled Checkbox */}
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => setEnabled((v) => !v)}
              className="accent-accent-600 h-4 w-4"
              disabled={loading}
              aria-label="Step Enabled"
            />
            <span className="text-sm">Step Enabled</span>
          </label>
        </div>

        {/* Toasts */}
        {error && (
          <Toast
            message={error}
            type="error"
            onClose={() => setError(null)}
          />
        )}
        {success && (
          <Toast
            message={success}
            type="success"
            onClose={() => setSuccess(null)}
          />
        )}
      </form>

      <hr className="mb-6 border-accent-100" />

      {/* Reorderable List */}
      <div>
        <h3 className="font-semibold mb-3 text-accent-700 flex items-center gap-1 text-lg">
          <GripVertical className="inline w-6 h-6 text-accent-300" />
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
                    <span className="text-5xl mb-3">👋</span>
                    <div className="text-lg font-semibold">
                      No offboarding steps yet.
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Add your first step above!
                    </div>
                  </div>
                )}
                {tasks
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((task, idx) => (
                    <Draggable
                      draggableId={task.id}
                      index={idx}
                      key={task.id}
                    >
                      {(provided, snapshot) => {
                        const isDragging = snapshot.isDragging;
                        return (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              transition-all duration-200 p-4 border-2 rounded-2xl bg-white
                              shadow-lg flex flex-col group
                              ${isDragging
                                ? "border-accent-400 shadow-2xl scale-[1.03] bg-accent-50"
                                : "border-gray-200"}
                            `}
                            style={{
                              boxShadow: isDragging
                                ? "0 4px 24px 0 #fbcfe888"
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
                                <GripVertical className="w-6 h-6 text-accent-300" />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-accent-900 truncate text-lg">
                                  {task.title}
                                </div>
                                <div className="text-xs text-accent-500 font-medium capitalize mb-1">
                                  {TASK_TYPE_OPTIONS.find(
                                    (o) => o.value === task.type
                                  )?.label || "Manual"}
                                </div>
                                {task.description && (
                                  <div className="text-gray-500 text-sm mt-1">
                                    {task.description}
                                  </div>
                                )}
                                {/* Automation info */}
                                {task.type && task.type !== "manual" && (
                                  <div
                                    className="
                                      mt-1 text-xs text-accent-600
                                      bg-accent-50 border border-accent-100
                                      rounded p-2
                                    "
                                  >
                                    <div>
                                      <b>Message:</b>{" "}
                                      {task.autoMessageTemplate || (
                                        <span className="text-gray-400">
                                          None set
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <b>When:</b>{" "}
                                      {
                                        SEND_WHEN_OPTIONS.find(
                                          (s) => s.value === task.sendWhen
                                        )?.label || "Immediately"
                                      }
                                    </div>
                                    {task.type === "auto-email" &&
                                      task.targetEmail && (
                                        <div>
                                          <b>Recipient:</b>{" "}
                                          {task.targetEmail}
                                        </div>
                                      )}
                                  </div>
                                )}
                                {/* Disabled label */}
                                {!task.enabled && (
                                  <span className="inline-block mt-1 text-xs font-bold text-red-500">
                                    Disabled
                                  </span>
                                )}
                              </div>
                              {/* Edit / Delete buttons */}
                              <div className="flex gap-2">
                                <button
                                  className="
                                    p-2 rounded-lg text-accent-600
                                    hover:bg-accent-50 transition
                                  "
                                  onClick={() => startEdit(task)}
                                  type="button"
                                  aria-label="Edit"
                                  disabled={loading}
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  className="
                                    p-2 rounded-lg text-red-600
                                    hover:bg-red-50 transition
                                  "
                                  onClick={() => handleDelete(task.id)}
                                  type="button"
                                  aria-label="Delete"
                                  disabled={loading}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      }}
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
