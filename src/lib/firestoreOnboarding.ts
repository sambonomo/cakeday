import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
  query,
  where,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

/** ------------------------------
 *   1. Onboarding Template Types
 *  ----------------------------- */
export type OnboardingTemplate = {
  id: string;
  name: string;           // e.g. "Sales Onboarding"
  description?: string;
  companyId: string;
  role?: string;          // If role-based (e.g. "engineer", "sales")
  department?: string;    // If department-based (optional)
  createdAt?: any;
};

export type OnboardingTask = {
  id: string;
  title: string;
  description?: string;
  order?: number;
  companyId: string;
  templateId?: string;
  department?: string;
  defaultAssigneeRole?: string; // "user", "manager", "admin", "IT", etc
  dueOffsetDays?: number;
  type?: "manual" | "auto-email" | "calendar" | "slack" | "teams" | "offboarding";
  autoMessageTemplate?: string;
  sendWhen?: "immediate" | "start_date" | "custom_date";
  targetEmail?: string;
  enabled?: boolean;
  documentId?: string;
};

export type UserTaskAssignment = {
  id: string;
  newHireId: string;
  taskId: string;
  templateId: string;
  companyId: string;
  assignedTo: string; // uid of assignee
  assignedToRole?: string;
  dueDate?: any;
  completed: boolean;
  completedAt?: any;
  title: string;
  description?: string;
  department?: string;
  order?: number;
};

/* --------------------------------------------------------
   ONBOARDING TEMPLATES
-------------------------------------------------------- */
/** Get all onboarding templates for a company */
export async function getOnboardingTemplates(companyId: string): Promise<OnboardingTemplate[]> {
  const q = query(collection(db, "onboardingTemplates"), where("companyId", "==", companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<OnboardingTemplate, "id">),
  }));
}

/** Create a new onboarding template */
export async function createOnboardingTemplate(
  template: Omit<OnboardingTemplate, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "onboardingTemplates"), {
    ...template,
    createdAt: new Date(),
  });
  return ref.id;
}

/** Update an existing onboarding template */
export async function updateOnboardingTemplate(
  id: string,
  updates: Partial<OnboardingTemplate>
): Promise<void> {
  await updateDoc(doc(db, "onboardingTemplates", id), updates);
}

/** Delete an onboarding template */
export async function deleteOnboardingTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, "onboardingTemplates", id));
}

/** Helper: get templates for a given department/role (future-proofing) */
export async function getTemplatesByDeptRole(
  companyId: string,
  department?: string,
  role?: string
): Promise<OnboardingTemplate[]> {
  let q = query(collection(db, "onboardingTemplates"), where("companyId", "==", companyId));
  // You can extend this with additional filters if needed.
  const snapshot = await getDocs(q);
  let templates = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<OnboardingTemplate, "id">),
  }));
  if (department) {
    templates = templates.filter(t => t.department?.toLowerCase() === department.toLowerCase());
  }
  if (role) {
    templates = templates.filter(t => t.role?.toLowerCase() === role.toLowerCase());
  }
  return templates;
}

/* --------------------------------------------------------
   ONBOARDING TASKS (Template Based)
-------------------------------------------------------- */
/** Get all tasks for a given template */
export async function getTemplateTasks(templateId: string): Promise<OnboardingTask[]> {
  const q = query(collection(db, "onboardingTasks"), where("templateId", "==", templateId));
  const snapshot = await getDocs(q);
  const tasks: OnboardingTask[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<OnboardingTask, "id">),
  }));
  tasks.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  return tasks;
}

/** Add a new task to a template */
export async function addOnboardingTaskToTemplate(
  task: Omit<OnboardingTask, "id" | "companyId">,
  companyId: string,
  templateId: string
): Promise<void> {
  const colRef = collection(db, "onboardingTasks");
  await addDoc(colRef, { ...task, companyId, templateId });
}

/** Update a task (template-based or legacy) */
export async function updateOnboardingTask(
  id: string,
  updates: Partial<Omit<OnboardingTask, "id" | "companyId">>,
  companyId: string
): Promise<void> {
  const taskRef = doc(db, "onboardingTasks", id);
  await setDoc(taskRef, { ...updates, companyId }, { merge: true });
}

/** Delete a task */
export async function deleteOnboardingTask(id: string, companyId: string): Promise<void> {
  const taskRef = doc(db, "onboardingTasks", id);
  await deleteDoc(taskRef);
}

/* Existing company-level tasks API (for backward compatibility) */
export async function getOnboardingTasks(companyId: string): Promise<OnboardingTask[]> {
  const q = query(collection(db, "onboardingTasks"), where("companyId", "==", companyId));
  const snapshot = await getDocs(q);
  const tasks: OnboardingTask[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    ...(doc.data() as Omit<OnboardingTask, "id">),
  }));
  tasks.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  return tasks;
}

export async function addOnboardingTask(
  task: Omit<OnboardingTask, "id" | "companyId">,
  companyId: string
): Promise<void> {
  const colRef = collection(db, "onboardingTasks");
  await addDoc(colRef, { ...task, companyId });
}

/* --------------------------------------------------------
   USER TASK ASSIGNMENTS (for new hires)
-------------------------------------------------------- */
/**
 * Assigns all tasks from a template to a new hire (and optionally, their department's managers etc)
 * - dueOffsetDays is used to calculate dueDate relative to hireStartDate (optional)
 */
export async function assignTemplateToNewHire(
  newHireId: string,
  templateId: string,
  companyId: string,
  hireStartDate: Date,
  newHireDepartment?: string
) {
  const templateTasks = await getTemplateTasks(templateId);
  const batchPromises = templateTasks.map(async (task) => {
    // Determine assignee
    let assignedTo = newHireId; // Default to the new hire themselves
    let assignedToRole = task.defaultAssigneeRole || "user";
    // (OPTIONAL: assign to a manager, IT, etc based on task.defaultAssigneeRole logic, if desired)
    // You can fetch users by role/department here if needed.

    let dueDate: Date | null = null;
    if (typeof task.dueOffsetDays === "number") {
      const baseDate = new Date(hireStartDate);
      baseDate.setDate(baseDate.getDate() + task.dueOffsetDays);
      dueDate = baseDate;
    }

    const assignment: Omit<UserTaskAssignment, "id"> = {
      newHireId,
      templateId,
      taskId: task.id,
      companyId,
      assignedTo,
      assignedToRole,
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : undefined,
      completed: false,
      title: task.title,
      description: task.description,
      department: task.department,
      order: task.order,
    };
    return addDoc(collection(db, "userTaskAssignments"), assignment);
  });
  await Promise.all(batchPromises);
}

/** Get all assigned onboarding tasks for a user (regardless of new hire or assignee role) */
export async function getAssignedTasksForUser(uid: string, companyId: string): Promise<UserTaskAssignment[]> {
  const q = query(collection(db, "userTaskAssignments"),
    where("companyId", "==", companyId),
    where("assignedTo", "==", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<UserTaskAssignment, "id">),
  }));
}

/** Get all onboarding assignments for a given new hire (could be multiple assignees per task) */
export async function getAssignmentsForNewHire(newHireId: string, companyId: string): Promise<UserTaskAssignment[]> {
  const q = query(collection(db, "userTaskAssignments"),
    where("companyId", "==", companyId),
    where("newHireId", "==", newHireId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<UserTaskAssignment, "id">),
  }));
}

/** Mark a user task assignment as complete */
export async function completeUserTaskAssignment(assignmentId: string): Promise<void> {
  await updateDoc(doc(db, "userTaskAssignments", assignmentId), {
    completed: true,
    completedAt: new Date(),
  });
}

/* --------------------------------------------------------
   LEGACY USER PROGRESS (for backward compatibility)
-------------------------------------------------------- */
export async function getUserProgress(
  uid: string,
  companyId: string
): Promise<Record<string, boolean>> {
  const docRef = doc(db, "userTaskProgress", `${companyId}_${uid}`);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as Record<string, boolean>) : {};
}

export async function setUserTaskProgress(
  uid: string,
  taskId: string,
  completed: boolean,
  companyId: string
): Promise<void> {
  const docRef = doc(db, "userTaskProgress", `${companyId}_${uid}`);
  await setDoc(docRef, { [taskId]: completed, companyId }, { merge: true });
}
