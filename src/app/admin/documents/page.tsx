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
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("onboarding");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [sendTo, setSendTo] = useState<{ [docId: string]: string }>({}); // {docId: selectedUserUid}

  // Load all documents and users for this company
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      getDocs(
        query(
          collection(db, "documents"),
          where("companyId", "==", companyId),
          orderBy("createdAt", "desc")
        )
      ),
      getDocs(
        query(
          collection(db, "users"),
          where("companyId", "==", companyId)
        )
      )
    ]).then(([docSnap, userSnap]) => {
      setDocs(docSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setUsers(userSnap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [companyId, uploading, success]);

  if (role !== "admin") {
    return (
      <div className="text-red-500 font-bold mt-16 text-center">
        Admin Only – You do not have access to this page.
      </div>
    );
  }

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
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storagePath = `documents/${companyId}/${safeName}`;
      const storageRefObj = storageRef(storage, storagePath);

      await uploadBytes(storageRefObj, file);
      const url = await getDownloadURL(storageRefObj);

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
      if (storageUrl) {
        const url = new URL(storageUrl);
        const path = decodeURIComponent(url.pathname.replace(/^\/v0\/b\/[^/]+\/o\//, "")).replaceAll("%2F", "/");
        const storageRefObj = storageRef(storage, path);
        await deleteObject(storageRefObj);
      }
      await deleteDoc(doc(db, "documents", docId));
      setSuccess("Document deleted.");
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      setError(err.message || "Delete failed.");
    }
    setLoading(false);
  }

  // Copy document link to clipboard
  function handleCopy(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedDocId(id);
    setTimeout(() => setCopiedDocId(null), 1200);
  }

  // Send document to user: Creates a notification doc in Firestore
  async function handleSendToUser(docMeta: any, uid: string) {
    if (!uid) return;
    setSuccess(null);
    setError(null);
    try {
      const recipient = users.find(u => u.uid === uid);
      if (!recipient) throw new Error("User not found");
      await addDoc(collection(db, "notifications"), {
        toUid: uid,
        toEmail: recipient.email,
        companyId,
        type: "document",
        docId: docMeta.id,
        docTitle: docMeta.title,
        docUrl: docMeta.url,
        message: `You have received a document: ${docMeta.title}`,
        sentAt: new Date(),
        read: false,
      });
      setSuccess(`Sent to ${recipient.fullName || recipient.email}`);
    } catch (err: any) {
      setError(err.message || "Could not send document.");
    }
  }

  // Filter docs
  const filteredDocs = docs.filter(
    (d) =>
      d.title?.toLowerCase().includes(filter.toLowerCase()) ||
      d.description?.toLowerCase().includes(filter.toLowerCase()) ||
      d.category?.toLowerCase().includes(filter.toLowerCase()) ||
      d.fileName?.toLowerCase().includes(filter.toLowerCase())
  );

  // Inline PDF preview (for .pdf only) with accessible close
  function renderPreview(url: string) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-3xl w-full relative animate-fade-in">
          <button
            onClick={() => setPreviewDoc(null)}
            className="absolute top-2 right-2 bg-gray-200 rounded-full px-3 py-1 text-gray-700 font-bold hover:bg-gray-300 focus:outline-none"
            aria-label="Close document preview"
            tabIndex={0}
          >
            Close
          </button>
          <iframe
            src={url}
            className="w-full h-[500px] rounded-lg border"
            title="Document Preview"
            aria-label="PDF Preview"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 mb-10 bg-white p-8 rounded-3xl shadow-2xl">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        <span>📄</span> Company Documents
      </h1>
      <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 mb-8" aria-label="Upload new document">
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Title (e.g. 'Employee Handbook')"
            className="p-3 border rounded-lg"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={100}
            disabled={uploading}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            className="p-3 border rounded-lg"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={160}
            disabled={uploading}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="p-3 border rounded-lg"
            disabled={uploading}
            aria-label="Document category"
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
            disabled={uploading}
            aria-label="Select file"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 mt-2 transition disabled:opacity-60"
            disabled={uploading || !file || !title.trim()}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
      <div className="flex mb-4">
        <input
          type="text"
          className="p-2 border rounded-lg flex-1"
          placeholder="Search documents (title, desc, file, tag)..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Filter documents"
        />
      </div>
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

      <h2 className="text-xl font-semibold mb-3 mt-6">All Documents</h2>
      {loading ? (
        <div className="text-gray-600">Loading documents...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-gray-400 italic">No documents uploaded yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3">Title &amp; Description</th>
                <th className="py-2 px-3">File</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Uploaded</th>
                <th className="py-2 px-3">Send To</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="py-2 px-3 font-semibold">
                    {d.title}
                    {d.description && (
                      <div className="text-xs text-gray-500">{d.description}</div>
                    )}
                  </td>
                  <td className="py-2 px-3 flex flex-col gap-1">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline"
                    >
                      {d.fileName}
                    </a>
                    {d.fileName && d.fileName.toLowerCase().endsWith(".pdf") && (
                      <button
                        className="text-xs text-blue-500 underline ml-1"
                        onClick={() => setPreviewDoc(d.url)}
                        aria-label={`Preview PDF ${d.title}`}
                      >
                        Preview
                      </button>
                    )}
                    <button
                      className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 mt-1"
                      onClick={() => handleCopy(d.url, d.id)}
                      aria-label={`Copy link for ${d.title}`}
                    >
                      {copiedDocId === d.id ? "Link Copied!" : "Copy Link"}
                    </button>
                  </td>
                  <td className="py-2 px-3 capitalize">{d.category}</td>
                  <td className="py-2 px-3 text-xs">{d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : ""}</td>
                  <td className="py-2 px-3">
                    <select
                      className="p-1 border rounded text-xs"
                      value={sendTo[d.id] || ""}
                      onChange={e => setSendTo({ ...sendTo, [d.id]: e.target.value })}
                      aria-label={`Select recipient for ${d.title}`}
                      disabled={uploading}
                    >
                      <option value="">Send to...</option>
                      {users.map(u => (
                        <option key={u.uid} value={u.uid}>
                          {u.fullName || u.email}
                        </option>
                      ))}
                    </select>
                    <button
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 mt-1 transition disabled:opacity-60"
                      disabled={!sendTo[d.id] || uploading}
                      onClick={() => handleSendToUser(d, sendTo[d.id])}
                      aria-label={`Send ${d.title} to user`}
                    >
                      Send
                    </button>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => handleDelete(d.id, d.url)}
                      className="text-red-500 hover:underline text-xs"
                      disabled={uploading}
                      aria-label={`Delete ${d.title}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {previewDoc && renderPreview(previewDoc)}
    </div>
  );
}
