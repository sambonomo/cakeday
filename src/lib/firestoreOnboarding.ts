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
} from "firebase/firestore";

// ------------------------------
// Types
// ------------------------------
export type OnboardingTask = {
  id: string;
  title: string;
  description?: string;
  order?: number; // Optional in case not set
};

// ------------------------------
// Get all onboarding tasks (ordered by 'order')
// ------------------------------
export async function getOnboardingTasks(): Promise<OnboardingTask[]> {
  const colRef = collection(db, "onboardingTasks");
  const snapshot = await getDocs(colRef);

  const tasks: OnboardingTask[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    ...(doc.data() as Omit<OnboardingTask, "id">),
  }));

  tasks.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  return tasks;
}

// ------------------------------
// Add a new onboarding task
// ------------------------------
export async function addOnboardingTask(
  task: Omit<OnboardingTask, "id">
): Promise<void> {
  const colRef = collection(db, "onboardingTasks");
  await addDoc(colRef, task);
}

// ------------------------------
// Edit/update an existing onboarding task
// ------------------------------
export async function updateOnboardingTask(
  id: string,
  updates: Partial<Omit<OnboardingTask, "id">>
): Promise<void> {
  const taskRef = doc(db, "onboardingTasks", id);
  await setDoc(taskRef, updates, { merge: true });
}

// ------------------------------
// Delete an onboarding task
// ------------------------------
export async function deleteOnboardingTask(id: string): Promise<void> {
  const taskRef = doc(db, "onboardingTasks", id);
  await deleteDoc(taskRef);
}

// ------------------------------
// Get user's checklist progress
// Returns an object: { [taskId: string]: boolean }
// ------------------------------
export async function getUserProgress(
  uid: string
): Promise<Record<string, boolean>> {
  const docRef = doc(db, "userTaskProgress", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as Record<string, boolean>) : {};
}

// ------------------------------
// Set a single task as complete/incomplete for user
// ------------------------------
export async function setUserTaskProgress(
  uid: string,
  taskId: string,
  completed: boolean
): Promise<void> {
  const docRef = doc(db, "userTaskProgress", uid);
  await setDoc(docRef, { [taskId]: completed }, { merge: true });
}
