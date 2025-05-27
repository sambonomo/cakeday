"use client";

import { useState, useEffect, useRef } from "react";
import {
  getOnboardingTemplates,
  createOnboardingTemplate,
  updateOnboardingTemplate,
  deleteOnboardingTemplate,
  getTemplateTasks,
  addOnboardingTaskToTemplate,
  updateOnboardingTask,
  deleteOnboardingTask,
  OnboardingTask as OnboardingTaskType,
  OnboardingTemplate,
} from "../lib/firestoreOnboarding";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Toast from "./Toast";

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
  { value: "start_date", label: "On Start Date" },
  { value: "custom_date", label: "Custom Date" },
];

// Who is expected to do the task
const ASSIGNEE_ROLE_OPTIONS = [
  { value: "user", label: "New Hire" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin/HR" },
  { value: "IT", label: "IT" },
];

export default function AdminOnboardingTasks({ companyId: propCompanyId }: { companyId?: string }) {
  const { companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  // --- Template state ---
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateRole, setTemplateRole] = useState("");
  const [templateDept, setTemplateDept] = useState("");
  const [templateEditId, setTemplateEditId] = useState<string | null>(null);

  // --- Task builder state ---
  const [tasks, setTasks] = useState<OnboardingTaskType[]>([]);
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<OnboardingTaskType["type"]>("manual");
  const [autoMessageTemplate, setAutoMessageTemplate] = useState("");
  const [sendWhen, setSendWhen] = useState<OnboardingTaskType["sendWhen"]>("immediate");
  const [targetEmail, setTargetEmail] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [attachedDocId, setAttachedDocId] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [defaultAssigneeRole, setDefaultAssigneeRole] = useState("user");
  const [dueOffsetDays, setDueOffsetDays] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Fetch templates
  useEffect(() => {
    if (!companyId) return;
    getOnboardingTemplates(companyId).then(setTemplates);
  }, [companyId, success]);

  // Fetch tasks for selected template
  useEffect(() => {
    if (!companyId) return;
    if (!selectedTemplateId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    getTemplateTasks(selectedTemplateId).then((loaded) => {
      setTasks(loaded);
      setLoading(false);
    });
  }, [companyId, selectedTemplateId, success]);

  // Fetch docs for attachment
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
          .filter((d) => d.category === "onboarding" || d.category === "general")
      );
    });
  }, [companyId]);

  // --- Template CRUD ---
  function resetTemplateFields() {
    setTemplateName("");
    setTemplateDesc("");
    setTemplateRole("");
    setTemplateDept("");
    setTemplateEditId(null);
  }

  async function handleTemplateSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Prevent duplicate names
    if (
      templates.some(
        (t) =>
          t.name.trim().toLowerCase() === templateName.trim().toLowerCase() &&
          (templateEditId === null || t.id !== templateEditId)
      )
    ) {
      setError("A template with that name already exists.");
      setLoading(false);
      return;
    }

    try {
      if (templateEditId) {
        await updateOnboardingTemplate(templateEditId, {
          name: templateName,
          description: templateDesc,
          role: templateRole,
          department: templateDept,
        });
        setSuccess("Template updated!");
        setSelectedTemplateId(templateEditId);
      } else {
        const newId = await createOnboardingTemplate({
          name: templateName,
          description: templateDesc,
          role: templateRole,
          department: templateDept,
          companyId: companyId!,
        });
        setSuccess("Template created!");
        setSelectedTemplateId(newId); // Select new template right away
      }
      resetTemplateFields();
    } catch (err: any) {
      setError(err.message || "Error saving template.");
    }
    setLoading(false);
  }

  function handleTemplateSelect(id: string) {
    setSelectedTemplateId(id);
    resetTaskFields();
    setError(null);
    setSuccess(null);
  }

  function handleTemplateEdit(t: OnboardingTemplate) {
    setTemplateName(t.name);
    setTemplateDesc(t.description || "");
    setTemplateRole(t.role || "");
    setTemplateDept(t.department || "");
    setTemplateEditId(t.id);
    setSelectedTemplateId(t.id);
    setTimeout(() => formRef.current?.focus(), 50);
  }

  async function handleTemplateDelete(id: string) {
    if (!window.confirm("Delete this template and all its tasks?")) return;
    setLoading(true);
    try {
      await deleteOnboardingTemplate(id);
      setSuccess("Template deleted!");
      setSelectedTemplateId(null);
    } catch (err: any) {
      setError(err.message || "Error deleting template.");
    }
    setLoading(false);
  }

  // --- Task CRUD ---
  function resetTaskFields() {
    setTitle("");
    setDescription("");
    setType("manual");
    setAutoMessageTemplate("");
    setSendWhen("immediate");
    setTargetEmail("");
    setEnabled(true);
    setAttachedDocId("");
    setDepartment("");
    setDefaultAssigneeRole("user");
    setDueOffsetDays(0);
    setEditId(null);
    setTimeout(() => formRef.current?.focus(), 50);
  }

  const startEdit = (task: OnboardingTaskType) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setType(task.type || "manual");
    setAutoMessageTemplate(task.autoMessageTemplate || "");
    setSendWhen(task.sendWhen || "immediate");
    setTargetEmail(task.targetEmail || "");
    setEnabled(task.enabled !== false);
    setAttachedDocId(task.documentId || "");
    setDepartment(task.department || "");
    setDefaultAssigneeRole(task.defaultAssigneeRole || "user");
    setDueOffsetDays(Number(task.dueOffsetDays) || 0);
    setSuccess(null);
    setError(null);
    setTimeout(() => formRef.current?.focus(), 50);
  };

  // Add/update task for template
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!companyId || !selectedTemplateId) {
      setError("Missing company or template. Please select a template.");
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
      department: department || undefined,
      defaultAssigneeRole: defaultAssigneeRole || "user",
      dueOffsetDays: Number.isNaN(Number(dueOffsetDays)) ? 0 : Number(dueOffsetDays),
    };
    try {
      if (editId) {
        await updateOnboardingTask(editId, base, companyId);
        setSuccess("Task updated!");
      } else {
        const nextOrder = tasks.length + 1;
        await addOnboardingTaskToTemplate(
          { ...base, order: nextOrder },
          companyId,
          selectedTemplateId
        );
        setSuccess("Task added!");
      }
      resetTaskFields();
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
      await deleteOnboardingTask(id, companyId!);
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
    <div className="bg-gradient-to-tr from-white via-blue-50 to-blue-100 rounded-3xl shadow-2xl p-8 w-full max-w-3xl mt-10">
      {/* Toasts */}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

      {/* --- Template Picker --- */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Onboarding Templates</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {templates.map((t) => (
            <button
              key={t.id}
              className={`rounded-lg px-4 py-2 font-semibold border transition outline-none
                ${selectedTemplateId === t.id ? "bg-blue-600 text-white border-blue-700 shadow" : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"}`}
              onClick={() => handleTemplateSelect(t.id)}
              title={t.description || ""}
            >
              {t.name} {t.department && `(${t.department})`}
              <span
                className="ml-2 text-xs text-gray-400 hover:underline"
                onClick={e => {
                  e.stopPropagation();
                  handleTemplateEdit(t);
                }}
                style={{ cursor: "pointer" }}
                title="Edit Template"
              >
                ✏️
              </span>
            </button>
          ))}
          <button
            className="rounded-lg px-3 py-2 font-bold border border-blue-200 text-blue-500 hover:bg-blue-100"
            onClick={resetTemplateFields}
            title="Create new template"
          >
            + New Template
          </button>
        </div>
        {(templateEditId !== null || !selectedTemplateId) && (
          <form onSubmit={handleTemplateSave} className="bg-white p-4 rounded-xl shadow flex gap-3 flex-wrap mb-4 border" ref={formRef} tabIndex={-1}>
            <input
              type="text"
              className="p-2 border rounded w-52"
              placeholder="Template Name"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              required
              maxLength={40}
            />
            <input
              type="text"
              className="p-2 border rounded w-52"
              placeholder="Department/Team"
              value={templateDept}
              onChange={e => setTemplateDept(e.target.value)}
              maxLength={40}
            />
            <input
              type="text"
              className="p-2 border rounded w-44"
              placeholder="Role (optional)"
              value={templateRole}
              onChange={e => setTemplateRole(e.target.value)}
              maxLength={30}
            />
            <input
              type="text"
              className="p-2 border rounded flex-1"
              placeholder="Description"
              value={templateDesc}
              onChange={e => setTemplateDesc(e.target.value)}
              maxLength={60}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700" disabled={loading || !templateName.trim()}>
              {templateEditId ? "Update Template" : "Create Template"}
            </button>
            {templateEditId && (
              <button
                type="button"
                onClick={resetTemplateFields}
                className="border px-3 py-2 rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </form>
        )}
        {selectedTemplateId && (
          <button
            className="text-xs text-red-500 ml-2 hover:underline"
            onClick={() => handleTemplateDelete(selectedTemplateId)}
            disabled={loading}
          >
            Delete this template
          </button>
        )}
      </section>

      {/* --- Tasks for selected template --- */}
      {selectedTemplateId ? (
        <>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 bg-white/90 border border-blue-100 rounded-xl p-5 shadow mb-8"
            ref={formRef}
            tabIndex={-1}
          >
            <legend className="text-lg font-bold text-blue-700 mb-1">
              {editId ? "Edit Step" : "Add a New Onboarding Step"}
            </legend>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <input
                type="text"
                placeholder="Task Title"
                value={title}
                className="flex-1 p-3 border-2 border-blue-200 focus:border-blue-500 rounded-lg text-base transition"
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={60}
                autoFocus
                aria-label="Task title"
              />
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="border border-blue-200 rounded-lg p-2 bg-blue-50 font-semibold text-blue-700"
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
                className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading || !title.trim()}
                aria-label={editId ? "Update step" : "Add step"}
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : editId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editId ? "Update" : "Add"}
              </button>
              {editId && (
                <button
                  type="button"
                  className="bg-gray-100 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 font-semibold ml-1 hover:bg-gray-200 transition"
                  onClick={resetTaskFields}
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
              aria-label="Task description"
            />
            <div className="flex flex-wrap gap-4 items-center">
              <label className="font-medium">
                Department/Team (optional):{" "}
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="p-2 border border-blue-200 rounded w-36 ml-1"
                  maxLength={40}
                  placeholder="e.g. Sales"
                />
              </label>
              <label className="font-medium">
                Assignee:{" "}
                <select
                  value={defaultAssigneeRole}
                  onChange={e => setDefaultAssigneeRole(e.target.value)}
                  className="p-2 border border-blue-200 rounded ml-1"
                >
                  {ASSIGNEE_ROLE_OPTIONS.map(opt => (
                    <option value={opt.value} key={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="font-medium">
                Due (days after start):{" "}
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={dueOffsetDays}
                  onChange={e => setDueOffsetDays(Number(e.target.value))}
                  className="p-2 border border-blue-200 rounded w-20 ml-1"
                  placeholder="0"
                />
              </label>
            </div>
            {/* Attach document */}
            <div>
              <label className="font-medium">
                Attach Document (optional):{" "}
                <select
                  value={attachedDocId}
                  onChange={e => setAttachedDocId(e.target.value)}
                  className="p-2 border border-blue-200 rounded ml-2 bg-white min-w-[150px]"
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
                    className="text-blue-600 underline"
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
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mt-2 flex flex-col gap-2">
                <label className="font-medium">
                  Message Template
                  <textarea
                    placeholder="What message/email should be sent for this step? You can use {name}, {startDate} etc."
                    value={autoMessageTemplate}
                    className="p-2 border border-blue-200 rounded mt-1 w-full text-sm"
                    onChange={e => setAutoMessageTemplate(e.target.value)}
                    rows={2}
                    maxLength={200}
                  />
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="font-medium">
                    Send When:
                    <select
                      value={sendWhen}
                      onChange={e => setSendWhen(e.target.value as any)}
                      className="p-2 border border-blue-200 rounded ml-2 bg-white"
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
                        className="p-2 border border-blue-200 rounded ml-2"
                        onChange={e => setTargetEmail(e.target.value)}
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
                  className="accent-blue-600"
                />
                <span className="text-sm">Step Enabled</span>
              </label>
            </div>
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
                                  <div className="font-bold text-blue-900 truncate text-lg flex items-center gap-2">
                                    {task.title}
                                    {!task.enabled && (
                                      <span className="inline-block ml-2 px-2 py-0.5 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded">
                                        Disabled
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-blue-500 font-medium capitalize mb-1 flex items-center gap-1">
                                    {TASK_TYPE_OPTIONS.find(o => o.value === task.type)?.icon}
                                    {TASK_TYPE_OPTIONS.find(o => o.value === task.type)?.label || "Manual"}
                                    {task.department && (
                                      <span className="ml-3 text-xs text-pink-500 bg-pink-50 rounded px-2">{task.department}</span>
                                    )}
                                    <span className="ml-3 text-xs text-gray-500">
                                      Assignee: {ASSIGNEE_ROLE_OPTIONS.find(r => r.value === task.defaultAssigneeRole)?.label || "New Hire"}
                                    </span>
                                    {typeof task.dueOffsetDays === "number" && (
                                      <span className="ml-3 text-xs text-gray-400">Due +{task.dueOffsetDays} days</span>
                                    )}
                                  </div>
                                  {task.description && (
                                    <div className="text-gray-500 text-sm mt-1">{task.description}</div>
                                  )}
                                  {/* Show automation preview if not manual */}
                                  {task.type && task.type !== "manual" && (
                                    <div className="mt-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded p-2">
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
                                    <div className="flex items-center mt-2 text-blue-700 gap-1">
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
        </>
      ) : (
        <div className="text-gray-500 text-center p-8">
          <div className="text-lg font-semibold mb-3">No template selected</div>
          <div className="text-sm">Select or create an onboarding template to start adding tasks by department, role, or custom workflow.</div>
        </div>
      )}
    </div>
  );
}
