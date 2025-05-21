"use client";
import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db, storage } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import Toast from "../../../components/Toast";

const CATEGORIES = [
  { label: "Onboarding", value: "onboarding" },
  { label: "Offboarding", value: "offboarding" },
  { label: "General", value: "general" },
];

export default function AdminDocumentsPage() {
  const { user, role, companyId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("onboarding");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load all documents for this company
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    getDocs(
      query(
        collection(db, "documents"),
        where("companyId", "==", companyId),
        orderBy("createdAt", "desc")
      )
    ).then((snap) => {
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [companyId, uploading, success]);

  // Restrict access to admins only
  if (role !== "admin") {
    return (
      <div className="text-red-500 font-bold mt-16 text-center">
        Admin Only – You do not have access to this page.
      </div>
    );
  }

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  // Handle upload
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUploading(true);

    if (!file || !title.trim()) {
      setError("Please select a file and enter a title.");
      setUploading(false);
      return;
    }
    try {
      // Upload file to Firebase Storage
      const ext = file.name.split(".").pop();
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storagePath = `documents/${companyId}/${safeName}`;
      const storageRefObj = storageRef(storage, storagePath);

      await uploadBytes(storageRefObj, file);
      const url = await getDownloadURL(storageRefObj);

      // Save document metadata to Firestore
      await addDoc(collection(db, "documents"), {
        companyId,
        title: title.trim(),
        description: desc.trim(),
        category,
        fileName: file.name,
        url,
        uploadedBy: user?.uid || "",
        createdAt: new Date(),
      });

      setTitle("");
      setDesc("");
      setCategory("onboarding");
      setFile(null);
      setSuccess("Document uploaded!");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    }
    setUploading(false);
  }

  // Handle document deletion
  async function handleDelete(docId: string, storageUrl: string) {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      // Delete file from storage
      if (storageUrl) {
        const url = new URL(storageUrl);
        const path = decodeURIComponent(url.pathname.replace(/^\/v0\/b\/[^/]+\/o\//, "")).replaceAll("%2F", "/");
        const storageRefObj = storageRef(storage, path);
        await deleteObject(storageRefObj);
      }
      // Delete metadata from Firestore
      await deleteDoc(doc(db, "documents", docId));
      setSuccess("Document deleted.");
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      setError(err.message || "Delete failed.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 mb-10 bg-white p-8 rounded-3xl shadow-2xl">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        <span>📄</span> Company Documents
      </h1>
      <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Title (e.g. 'Employee Handbook')"
            className="p-3 border rounded-lg"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={100}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            className="p-3 border rounded-lg"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={160}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="p-3 border rounded-lg"
          >
            {CATEGORIES.map(c => (
              <option value={c.value} key={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 md:w-64">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className="p-1"
            onChange={handleFileChange}
            ref={fileInputRef}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 mt-2"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

      <h2 className="text-xl font-semibold mb-3 mt-6">All Documents</h2>
      {loading ? (
        <div className="text-gray-600">Loading documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-gray-400 italic">No documents uploaded yet.</div>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3">File</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3">Uploaded</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="py-2 px-3 font-semibold">{d.title}</td>
                <td className="py-2 px-3">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    {d.fileName}
                  </a>
                  {d.description && (
                    <div className="text-xs text-gray-500">{d.description}</div>
                  )}
                </td>
                <td className="py-2 px-3 capitalize">{d.category}</td>
                <td className="py-2 px-3 text-xs">{d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : ""}</td>
                <td className="py-2 px-3">
                  <button
                    onClick={() => handleDelete(d.id, d.url)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
