"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
  fetchAllUsers,
  updateUserProfile,
  UserProfile,
} from "../lib/firestoreUsers";
import {
  getOnboardingTemplates,
  assignTemplateToNewHire,
} from "../lib/firestoreOnboarding";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import UserAvatar from "./UserAvatar";
import InviteNewHireModal from "./InviteNewHireModal";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import {
  doc,
  runTransaction,
  collection,
  addDoc,
  updateDoc,
} from "firebase/firestore";

const ROLES = ["user", "admin", "manager"];

type FormState = {
  fullName: string;
  phone: string;
  birthday: string;
  anniversary: string;
  role: string;
  email: string;
  photoURL?: string;
  disabled?: boolean;
  gender?: string;
  department?: string;
  status?: string;
  points?: number;
  onboardingTemplateId?: string;
  hireStartDate?: string;
};

export default function AdminUserEditor(): React.ReactElement {
  const { companyId, user: adminUser, role: adminRole } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    birthday: "",
    anniversary: "",
    role: "user",
    email: "",
    photoURL: "",
    disabled: false,
    gender: "",
    department: "",
    status: "",
    points: 0,
    onboardingTemplateId: "",
    hireStartDate: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [pointsEdit, setPointsEdit] = useState<string>("");

  // Onboarding template state
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateLoading, setTemplateLoading] = useState<boolean>(false);
  const [assigned, setAssigned] = useState<boolean>(false);

  // New Hire Modal state
  const [inviteOpen, setInviteOpen] = useState<boolean>(false);

  // Impersonation state
  const [impersonateEmail, setImpersonateEmail] = useState<string | null>(null);

  // Fetch all users
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetchAllUsers(companyId)
      .then((users) => {
        setUsers(users);
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching users.");
        setLoading(false);
      });
  }, [companyId, success, inviteOpen]); // refresh users on invite

  // Fetch templates for onboarding assignment
  useEffect(() => {
    if (!companyId) return;
    setTemplateLoading(true);
    getOnboardingTemplates(companyId)
      .then((t) => setTemplates(t))
      .finally(() => setTemplateLoading(false));
  }, [companyId]);

  // Populate form on user select
  useEffect(() => {
    if (!selectedUserId) return;
    const user = users.find((u) => u.uid === selectedUserId);
    if (user) {
      setForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        birthday: user.birthday || "",
        anniversary: user.anniversary || "",
        role: user.role || "user",
        email: user.email || "",
        photoURL: typeof user.photoURL === "string" ? user.photoURL : "",
        disabled: !!user.disabled,
        gender: user.gender || "",
        department: user.department || "",
        status: user.status || "",
        points: user.points || 0,
        onboardingTemplateId: (user as any).onboardingTemplateId || "",
        hireStartDate: (user as any).hireStartDate || "",
      });
      setPointsEdit((user.points ?? 0).toString());
      setSuccess(null);
      setError(null);
      setAssigned(!!(user as any).onboardingTemplateId);
    }
  }, [selectedUserId, users]);

  // Form change handler
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // If admin selects template or date, clear "assigned" so the button appears
    if (["onboardingTemplateId", "hireStartDate"].includes(name)) {
      setAssigned(false);
    }
  }

  // Save handler
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUserId) return;
    setSaving(true);
    setSuccess(null);
    setError(null);

    const updates: any = {
      fullName: form.fullName,
      phone: form.phone,
      birthday: form.birthday,
      anniversary: form.anniversary,
      role: form.role,
      photoURL: form.photoURL,
      disabled: !!form.disabled,
      gender: form.gender,
      department: form.department,
      status: form.status,
      onboardingTemplateId: form.onboardingTemplateId || "",
      hireStartDate: form.hireStartDate || "",
    };
    try {
      await updateUserProfile(selectedUserId, updates);
      setSuccess("User profile updated!");
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUserId ? { ...u, ...updates } : u
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating user.");
    }
    setSaving(false);
  }

  // Assign onboarding tasks to new hire (+ relevant assignees)
  async function handleAssignOnboarding() {
    if (!selectedUserId || !companyId) return;
    if (!form.onboardingTemplateId) {
      setError("Please select an onboarding template.");
      return;
    }
    if (!form.hireStartDate) {
      setError("Please enter a start date.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await assignTemplateToNewHire(
        selectedUserId,
        form.onboardingTemplateId,
        companyId,
        new Date(form.hireStartDate),
        form.department || undefined
      );
      // Also update the user doc for quick reference
      await updateDoc(doc(db, "users", selectedUserId), {
        onboardingTemplateId: form.onboardingTemplateId,
        hireStartDate: form.hireStartDate,
        status: "newHire",
      });
      setSuccess("Onboarding checklist assigned!");
      setAssigned(true);
    } catch (err: any) {
      setError(err.message || "Could not assign onboarding.");
    }
    setSaving(false);
  }

  // Points assignment logic (for admin/manager, can't assign to self)
  async function handleAssignPoints(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || adminUser?.uid === selectedUserId) return;
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", selectedUserId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User does not exist.");
        const oldPoints = userSnap.data().points || 0;
        const newPoints = Number(pointsEdit);
        if (isNaN(newPoints) || newPoints < 0)
          throw new Error("Invalid points value.");

        transaction.update(userRef, { points: newPoints });

        // Optionally log to notifications/points log
        await addDoc(collection(db, "notifications"), {
          toUid: selectedUserId,
          toEmail: form.email,
          companyId,
          type: "points",
          message: `Your points were updated: ${oldPoints} → ${newPoints} by ${adminUser?.email}`,
          sentAt: new Date(),
          read: false,
        });
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUserId
            ? { ...u, points: Number(pointsEdit) }
            : u
        )
      );
      setForm((prev) => ({ ...prev, points: Number(pointsEdit) }));
      setSuccess("Points updated!");
    } catch (err: any) {
      setError(err.message || "Could not update points.");
    }
    setSaving(false);
  }

  // Disable/enable user handler
  async function handleToggleDisable() {
    if (!selectedUserId) return;
    const newDisabled = !form.disabled;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      await updateUserProfile(selectedUserId, { disabled: newDisabled });
      setForm((prev) => ({ ...prev, disabled: newDisabled }));
      setSuccess(
        newDisabled
          ? "User disabled. They will not be able to log in."
          : "User re-enabled."
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUserId ? { ...u, disabled: newDisabled } : u
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error updating user status."
      );
    }
    setSaving(false);
  }

  // Reset password (send email)
  async function handleResetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent to " + email);
    } catch (err: any) {
      setError("Error sending reset email: " + (err.message || "Error"));
    }
  }

  // Impersonate user: Demo only
  function handleImpersonate(email: string) {
    setImpersonateEmail(email);
    setTimeout(() => setImpersonateEmail(null), 2500);
  }

  // Filter/search logic
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(filter.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(filter.toLowerCase())) ||
      (u.role && u.role.toLowerCase().includes(filter.toLowerCase()))
  );

  if (!companyId) {
    return <div className="text-gray-500 mt-8">Loading admin info...</div>;
  }

  if (loading) return <div className="text-gray-600">Loading users...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Invite New Hire Button and Modal */}
      <InviteNewHireModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => setInviteOpen(false)}
      />
      <div className="w-full mb-4 flex justify-between items-end">
        <h2 className="text-xl font-semibold text-blue-700">All Users</h2>
        <button
          className="bg-green-600 text-white font-bold px-4 py-2 rounded-xl shadow hover:bg-green-700 transition"
          onClick={() => setInviteOpen(true)}
        >
          + Invite New Hire
        </button>
      </div>

      {/* User List */}
      <div className="w-full md:w-1/2">
        <input
          type="text"
          placeholder="Search by name, email, or role"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-3 w-full p-2 border border-gray-300 rounded"
        />
        <ul className="bg-white rounded shadow divide-y border max-h-[70vh] overflow-y-auto">
          {filteredUsers.length === 0 && (
            <li className="p-3 text-gray-400 italic">No users found.</li>
          )}
          {filteredUsers.map((u) => (
            <li
              key={u.uid}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-50 ${
                selectedUserId === u.uid ? "bg-blue-100 font-semibold" : ""
              } ${u.disabled ? "opacity-50" : ""}`}
              onClick={() => setSelectedUserId(u.uid)}
              aria-selected={selectedUserId === u.uid}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  setSelectedUserId(u.uid);
              }}
            >
              <UserAvatar
                nameOrEmail={u.fullName || u.email}
                photoURL={
                  typeof u.photoURL === "string" ? u.photoURL : undefined
                }
                size={36}
              />
              <div className="flex-1">
                <div>
                  {u.fullName || "(No name)"}{" "}
                  <span className="text-xs text-gray-500">({u.email})</span>
                  {u.disabled && (
                    <span className="ml-2 text-xs font-bold text-red-500">
                      (Disabled)
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{u.role || "user"}</div>
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetPassword(u.email);
                  }}
                  title="Send password reset email"
                >
                  Reset PW
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded bg-pink-100 text-pink-700 hover:bg-pink-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImpersonate(u.email);
                  }}
                  title="Impersonate (demo)"
                >
                  View As
                </button>
              </div>
            </li>
          ))}
        </ul>
        {impersonateEmail && (
          <div className="mt-3 text-sm text-pink-700">
            Impersonation is just a demo: Would open session as{" "}
            <b>{impersonateEmail}</b>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="w-full md:w-1/2">
        {selectedUserId ? (
          <form
            onSubmit={handleSave}
            className="flex flex-col gap-4 bg-white border rounded-lg p-4 w-full max-w-md shadow"
            autoComplete="off"
          >
            <h3 className="text-lg font-medium text-blue-700 mb-2">
              Edit User Profile
            </h3>
            {form.photoURL && (
              <div className="flex justify-center">
                <UserAvatar
                  nameOrEmail={form.fullName || form.email}
                  photoURL={form.photoURL}
                  size={64}
                />
              </div>
            )}
            <label className="font-medium">
              Full Name
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                placeholder="Full Name"
                required
              />
            </label>
            <label className="font-medium">
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                className="p-2 border border-gray-200 rounded w-full mt-1 bg-gray-100"
                disabled
                readOnly
              />
            </label>
            <label className="font-medium">
              Phone Number
              <input
                type="tel"
                name="phone"
                value={form.phone}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                placeholder="e.g. (555) 123-4567"
              />
            </label>
            <label className="font-medium">
              Birthday
              <input
                type="date"
                name="birthday"
                value={form.birthday}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </label>
            <label className="font-medium">
              Work Anniversary
              <input
                type="date"
                name="anniversary"
                value={form.anniversary}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </label>
            <label className="font-medium">
              Role
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded w-full mt-1"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-medium">
              Department
              <input
                type="text"
                name="department"
                value={form.department}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                placeholder="Department"
              />
            </label>
            <label className="font-medium">
              Gender
              <input
                type="text"
                name="gender"
                value={form.gender}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                placeholder="Gender"
              />
            </label>
            <label className="font-medium">
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded w-full mt-1"
              >
                <option value="">Active</option>
                <option value="newHire">New Hire</option>
                <option value="exiting">Exiting</option>
              </select>
            </label>

            {/* Assign Onboarding Template & Start Date */}
            {form.status === "newHire" && (
              <>
                <label className="font-medium">
                  Onboarding Template
                  <select
                    name="onboardingTemplateId"
                    value={form.onboardingTemplateId || ""}
                    onChange={handleChange}
                    className="p-2 border border-blue-300 rounded w-full mt-1"
                    required
                  >
                    <option value="">-- Select Template --</option>
                    {templates.map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.name}
                        {t.department ? ` (${t.department})` : ""}
                        {t.role ? ` (${t.role})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="font-medium">
                  Start Date
                  <input
                    type="date"
                    name="hireStartDate"
                    value={form.hireStartDate || ""}
                    onChange={handleChange}
                    className="p-2 border border-blue-300 rounded w-full mt-1"
                    required
                  />
                </label>
                {!assigned && (
                  <button
                    type="button"
                    onClick={handleAssignOnboarding}
                    className="bg-green-600 text-white rounded px-4 py-2 mt-2 font-bold hover:bg-green-700"
                    disabled={saving || !form.onboardingTemplateId || !form.hireStartDate}
                  >
                    {saving ? "Assigning..." : "Assign Onboarding Checklist"}
                  </button>
                )}
                {assigned && (
                  <div className="mt-2 text-green-700 text-sm font-semibold">
                    Onboarding checklist assigned!
                  </div>
                )}
              </>
            )}

            {/* Points assign (only for admin/manager, not to self) */}
            {adminUser?.uid !== selectedUserId &&
              (adminRole === "admin" || adminRole === "manager") && (
                <form
                  onSubmit={handleAssignPoints}
                  className="mt-3 bg-blue-50 rounded-xl p-3 flex flex-col gap-2"
                >
                  <label className="font-medium">
                    Points
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={pointsEdit}
                      onChange={(e) => setPointsEdit(e.target.value)}
                      className="p-2 border border-gray-300 rounded w-full mt-1"
                    />
                    <span className="text-xs text-gray-500 ml-2">
                      Old: <b>{form.points ?? 0}</b>
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded mt-1 font-bold hover:bg-green-700"
                    disabled={saving || pointsEdit === String(form.points ?? 0)}
                  >
                    {saving ? "Saving..." : "Set Points"}
                  </button>
                </form>
              )}

            {/* Disable/Enable button */}
            <button
              type="button"
              className={`mt-2 px-4 py-2 rounded ${
                form.disabled
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-500 hover:bg-gray-700"
              } text-white transition`}
              onClick={handleToggleDisable}
              disabled={saving}
            >
              {form.disabled ? "Re-enable User" : "Disable User"}
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition disabled:opacity-60 mt-2"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {success && (
              <Toast
                message={success}
                type="success"
                onClose={() => setSuccess(null)}
              />
            )}
            {error && (
              <Toast
                message={error}
                type="error"
                onClose={() => setError(null)}
              />
            )}
          </form>
        ) : (
          <div className="text-gray-500 mt-8">
            Select a user to edit their profile.
          </div>
        )}
      </div>
    </div>
  );
}
