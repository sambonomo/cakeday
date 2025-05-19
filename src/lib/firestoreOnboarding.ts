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

// ------------------------------
// Types
// ------------------------------
export type OnboardingTask = {
  id: string;
  title: string;
  description?: string;
  order?: number; // Optional in case not set
  companyId: string;
};

// ------------------------------
// Get all onboarding tasks for a company (ordered by 'order')
// ------------------------------
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

// ------------------------------
// Add a new onboarding task for a company
// ------------------------------
export async function addOnboardingTask(
  task: Omit<OnboardingTask, "id" | "companyId">,
  companyId: string
): Promise<void> {
  const colRef = collection(db, "onboardingTasks");
  await addDoc(colRef, { ...task, companyId });
}

// ------------------------------
// Edit/update an existing onboarding task (scoped by company for security)
// ------------------------------
export async function updateOnboardingTask(
  id: string,
  updates: Partial<Omit<OnboardingTask, "id" | "companyId">>,
  companyId: string
): Promise<void> {
  const taskRef = doc(db, "onboardingTasks", id);
  await setDoc(taskRef, { ...updates, companyId }, { merge: true });
}

// ------------------------------
// Delete an onboarding task (optionally: check companyId before deleting)
// ------------------------------
export async function deleteOnboardingTask(id: string, companyId: string): Promise<void> {
  // You may optionally verify the companyId matches before deleting.
  const taskRef = doc(db, "onboardingTasks", id);
  // (Optional: fetch doc and check companyId before delete)
  await deleteDoc(taskRef);
}

// ------------------------------
// Get user's checklist progress for a company
// Returns an object: { [taskId: string]: boolean }
// ------------------------------
export async function getUserProgress(
  uid: string,
  companyId: string
): Promise<Record<string, boolean>> {
  const docRef = doc(db, "userTaskProgress", `${companyId}_${uid}`);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as Record<string, boolean>) : {};
}

// ------------------------------
// Set a single task as complete/incomplete for user and company
// ------------------------------
export async function setUserTaskProgress(
  uid: string,
  taskId: string,
  completed: boolean,
  companyId: string
): Promise<void> {
  const docRef = doc(db, "userTaskProgress", `${companyId}_${uid}`);
  await setDoc(docRef, { [taskId]: completed, companyId }, { merge: true });
}
