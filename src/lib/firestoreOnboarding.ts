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
} from "firebase/firestore";

/**
 * Onboarding/Offboarding Task type — enhanced for automations!
 */
export type OnboardingTask = {
  id: string;
  title: string;
  description?: string;
  order?: number;
  companyId: string;
  // --- Automation fields ---
  type?: "manual" | "auto-email" | "calendar" | "slack" | "teams" | "offboarding";
  autoMessageTemplate?: string;      // Message for auto-email, slack, etc.
  sendWhen?: "immediate" | "start_date" | "custom_date"; // When to trigger
  targetEmail?: string;              // If auto-email, who to send (optional)
  enabled?: boolean;                 // Easy way to toggle on/off a step
  documentId?: string;               // <-- Added! Document attachment support
};

/**
 * Fetch all onboarding tasks for a company (ordered by order, with all new fields).
 */
export async function getOnboardingTasks(companyId: string): Promise<OnboardingTask[]> {
  const colRef = collection(db, "onboardingTasks");
  const q = query(colRef, where("companyId", "==", companyId));
  const snapshot = await getDocs(q);

  const tasks: OnboardingTask[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    ...(doc.data() as Omit<OnboardingTask, "id">),
  }));

  tasks.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  return tasks;
}

/**
 * Add a new onboarding task for a company (with new fields supported)
 */
export async function addOnboardingTask(
  task: Omit<OnboardingTask, "id" | "companyId">,
  companyId: string
): Promise<void> {
  const colRef = collection(db, "onboardingTasks");
  await addDoc(colRef, { ...task, companyId });
}

/**
 * Update an existing onboarding task (all new fields supported)
 */
export async function updateOnboardingTask(
  id: string,
  updates: Partial<Omit<OnboardingTask, "id" | "companyId">>,
  companyId: string
): Promise<void> {
  const taskRef = doc(db, "onboardingTasks", id);
  await setDoc(taskRef, { ...updates, companyId }, { merge: true });
}

/**
 * Delete an onboarding task
 */
export async function deleteOnboardingTask(id: string, companyId: string): Promise<void> {
  const taskRef = doc(db, "onboardingTasks", id);
  await deleteDoc(taskRef);
}

/**
 * Get user's checklist progress for a company
 */
export async function getUserProgress(
  uid: string,
  companyId: string
): Promise<Record<string, boolean>> {
  const docRef = doc(db, "userTaskProgress", `${companyId}_${uid}`);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as Record<string, boolean>) : {};
}

/**
 * Set a single task as complete/incomplete for user and company
 */
export async function setUserTaskProgress(
  uid: string,
  taskId: string,
  completed: boolean,
  companyId: string
): Promise<void> {
  const docRef = doc(db, "userTaskProgress", `${companyId}_${uid}`);
  await setDoc(docRef, { [taskId]: completed, companyId }, { merge: true });
}
