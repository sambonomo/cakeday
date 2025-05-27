"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  GripVertical,
  Plus,
  Loader2,
  X,
  Edit,
  Trash2,
  Sparkles,
  Calendar,
  Mail,
  Slack,
  FileText,
  ClipboardCheck,
  PartyPopper,
  Download,
} from "lucide-react";
import Toast from "./Toast";

type OffboardingTask = {
  id: string;
  title: string;
  description?: string;
  order?: number;
  companyId: string;
  type?: "manual" | "auto-email" | "calendar" | "slack" | "teams";
  autoMessageTemplate?: string;
  sendWhen?: "immediate" | "last_day" | "custom_date";
  targetEmail?: string;
  enabled?: boolean;
  documentId?: string;
};

type DocInfo = {
  id: string;
  title: string;
  fileName: string;
  url: string;
  category: string;
};

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

export default function AdminOffboardingTasks({ companyId: propCompanyId }: { companyId?: string }) {
  const { companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [tasks, setTasks] = useState<OffboardingTask[]>([]);
  const [docs, setDocs] = useState<DocInfo[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<OffboardingTask["type"]>("manual");
  const [autoMessageTemplate, setAutoMessageTemplate] = useState("");
  const [sendWhen, setSendWhen] = useState<OffboardingTask["sendWhen"]>("immediate");
  const [targetEmail, setTargetEmail] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [attachedDocId, setAttachedDocId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form focus for accessibility/edit
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch company docs (offboarding/general)
  useEffect(() => {
    if (!companyId) return;
    getDocs(
      query(
        collection(db, "documents"),
        where("companyId", "==", companyId)
      )
    ).then(snap => {
      setDocs(
        snap.docs
          .map((d) => ({
            ...(d.data() as DocInfo),
            id: d.id,
          }))
          .filter((d) => d.category === "offboarding" || d.category === "general")
      );
    });
  }, [companyId]);

  // Real-time Firestore subscription for offboarding tasks
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const q = query(
      collection(db, "offboardingTasks"),
      where("companyId", "==", companyId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        ...(doc.data() as OffboardingTask),
        id: doc.id,
      }));
      setTasks(loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [companyId]);

  // Edit, cancel, form
  const startEdit = (task: OffboardingTask) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setType(task.type || "manual");
    setAutoMessageTemplate(task.autoMessageTemplate || "");
    setSendWhen(task.sendWhen || "immediate");
    setTargetEmail(task.targetEmail || "");
    setEnabled(task.enabled !== false);
    setAttachedDocId(task.documentId || "");
    setSuccess(null);
    setError(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      formRef.current?.focus();
    }, 50);
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
    setAttachedDocId("");
    setError(null);
    setSuccess(null);
    setTimeout(() => {
      formRef.current?.focus();
    }, 50);
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
    const base = {
      title: title.trim(),
      description: description.trim(),
      type,
      autoMessageTemplate: type !== "manual" ? autoMessageTemplate : "",
      sendWhen: type !== "manual" ? sendWhen : undefined,
      targetEmail: type === "auto-email" ? targetEmail : undefined,
      enabled,
      documentId: attachedDocId || undefined,
    };
    try {
      if (editId) {
        await updateDoc(doc(db, "offboardingTasks", editId), base);
        setSuccess("Task updated!");
      } else {
        const nextOrder = tasks.length + 1;
        await addDoc(collection(db, "offboardingTasks"), {
          ...base,
          order: nextOrder,
          companyId,
        });
        setSuccess("Task added!");
      }
      cancelEdit();
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
      await deleteDoc(doc(db, "offboardingTasks", id));
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

    setTasks(newTasks);

    setLoading(true);
    try {
      await Promise.all(
        newTasks.map((task, idx) =>
          updateDoc(doc(db, "offboardingTasks", task.id), { order: idx + 1 })
        )
      );
      setSuccess("Order updated!");
    } catch (err: any) {
      setError("Failed to save new order. Please refresh.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-tr from-white via-pink-50 to-pink-100 rounded-3xl shadow-2xl p-8 w-full max-w-2xl mt-10">
      {/* Success/Error toasts */}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

      <div className="mb-6 flex flex-col items-center gap-2">
        <h2 className="text-3xl font-bold text-pink-800 flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-pink-400" />
          Offboarding Builder
        </h2>
        <p className="text-gray-600 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          Drag, edit, and automate offboarding. You can attach important docs!
        </p>
        {/* Optional "import steps" future feature */}
        {/* <button className="flex items-center gap-2 text-xs text-pink-600 font-semibold hover:underline mt-2">
          <Download className="w-4 h-4" /> Import Standard Offboarding Steps
        </button> */}
      </div>
      <section>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-white/90 border border-pink-100 rounded-xl p-5 shadow mb-8"
          ref={formRef}
          tabIndex={-1}
        >
          <legend className="text-lg font-bold text-pink-700 mb-1">
            {editId ? "Edit Step" : "Add a New Offboarding Step"}
          </legend>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <input
              type="text"
              placeholder="Task Title"
              value={title}
              className="flex-1 p-3 border-2 border-pink-200 focus:border-pink-500 rounded-lg text-base transition"
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={60}
              autoFocus
              aria-label="Task title"
            />
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="border border-pink-200 rounded-lg p-2 bg-pink-50 font-semibold text-pink-700"
              aria-label="Task type"
            >
              {TASK_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-pink-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-semibold shadow hover:bg-pink-700 transition disabled:opacity-50"
              disabled={loading}
              aria-label={editId ? "Update step" : "Add step"}
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
            className="p-3 border-2 border-gray-200 focus:border-pink-400 rounded-lg text-base transition"
            onChange={e => setDescription(e.target.value)}
            rows={2}
            maxLength={120}
            aria-label="Task description"
          />
          {/* Attach document */}
          <div>
            <label className="font-medium">
              Attach Document (optional):{" "}
              <select
                value={attachedDocId}
                onChange={e => setAttachedDocId(e.target.value)}
                className="p-2 border border-pink-200 rounded ml-2 bg-white min-w-[150px]"
                aria-label="Attach document"
              >
                <option value="">-- None --</option>
                {docs.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.title} ({d.fileName})
                  </option>
                ))}
              </select>
            </label>
            {attachedDocId && (
              <div className="text-xs mt-1">
                <a
                  href={docs.find((d) => d.id === attachedDocId)?.url}
                  className="text-pink-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Preview Document
                </a>
              </div>
            )}
          </div>
          {/* Automation fields */}
          {type !== "manual" && (
            <div className="bg-pink-50 border border-pink-100 p-3 rounded-xl mt-2 flex flex-col gap-2">
              <label className="font-medium">
                Message Template
                <textarea
                  placeholder="What message/email should be sent for this step?"
                  value={autoMessageTemplate}
                  className="p-2 border border-pink-200 rounded mt-1 w-full text-sm"
                  onChange={e => setAutoMessageTemplate(e.target.value)}
                  rows={2}
                  maxLength={200}
                  aria-label="Message template"
                />
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="font-medium">
                  Send When:
                  <select
                    value={sendWhen}
                    onChange={e => setSendWhen(e.target.value as any)}
                    className="p-2 border border-pink-200 rounded ml-2 bg-white"
                    aria-label="Send when"
                  >
                    {SEND_WHEN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                {type === "auto-email" && (
                  <label className="font-medium flex-1">
                    Recipient Email (optional)
                    <input
                      type="email"
                      placeholder="e.g. manager@company.com"
                      value={targetEmail}
                      className="p-2 border border-pink-200 rounded ml-2"
                      onChange={e => setTargetEmail(e.target.value)}
                      aria-label="Recipient email"
                    />
                  </label>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => setEnabled(v => !v)}
                className="accent-pink-600"
                aria-checked={enabled}
              />
              <span className="text-sm">Step Enabled</span>
            </label>
          </div>
        </form>
      </section>
      <hr className="mb-6 border-pink-100" />
      <section>
        <h3 className="font-semibold mb-3 text-pink-700 flex items-center gap-1 text-lg">
          <GripVertical className="inline w-6 h-6 text-pink-300" />
          All Offboarding Steps (Drag to Reorder)
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
                    <PartyPopper className="w-10 h-10 mb-2 text-pink-400" />
                    <div className="text-lg font-semibold">No offboarding steps yet.</div>
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
                                ? "border-pink-400 shadow-2xl scale-[1.03] bg-pink-50"
                                : "border-gray-200"
                            }`}
                          style={{
                            boxShadow: snapshot.isDragging
                              ? "0 4px 24px 0 #fbcfe866"
                              : undefined,
                            ...provided.draggableProps.style,
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                              aria-label="Drag to reorder"
                            >
                              <GripVertical className="w-6 h-6 text-pink-300" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-pink-900 truncate text-lg flex items-center gap-2">
                                {task.title}
                                {!task.enabled && (
                                  <span className="inline-block ml-2 px-2 py-0.5 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded">
                                    Disabled
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-pink-500 font-medium capitalize mb-1 flex items-center gap-1">
                                {TASK_TYPE_OPTIONS.find(o => o.value === task.type)?.icon}
                                {TASK_TYPE_OPTIONS.find(o => o.value === task.type)?.label || "Manual"}
                              </div>
                              {task.description && (
                                <div className="text-gray-500 text-sm mt-1">{task.description}</div>
                              )}
                              {task.type && task.type !== "manual" && (
                                <div className="mt-1 text-xs text-pink-600 bg-pink-50 border border-pink-100 rounded p-2">
                                  <div>
                                    <b>Message:</b> {task.autoMessageTemplate || <span className="text-gray-400">None set</span>}
                                  </div>
                                  <div>
                                    <b>When:</b> {SEND_WHEN_OPTIONS.find(s => s.value === task.sendWhen)?.label || "Immediately"}
                                  </div>
                                  {task.type === "auto-email" && task.targetEmail && (
                                    <div>
                                      <b>Recipient:</b> {task.targetEmail}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Show attached doc, if any */}
                              {task.documentId && (
                                <div className="flex items-center mt-2 text-pink-700 gap-1">
                                  <FileText className="inline w-4 h-4 mr-1" />
                                  <a
                                    href={docs.find(d => d.id === task.documentId)?.url}
                                    className="underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {docs.find(d => d.id === task.documentId)?.title || "Document"}
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="p-2 rounded-lg text-pink-600 hover:bg-pink-50 transition"
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
      </section>
    </div>
  );
}
