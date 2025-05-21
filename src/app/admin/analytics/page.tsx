"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#fbbf24", "#10b981", "#f472b6", "#6366f1", "#f87171", "#06b6d4", "#84cc16"];

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function downloadCSV(filename: string, rows: any[]) {
  if (!rows.length) return;
  const csv =
    Object.keys(rows[0]).join(",") +
    "\n" +
    rows.map(row => Object.values(row).map(x => `"${x}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const { companyId, role } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [kudos, setKudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState<any[]>([]);

  // Fetch users and kudos
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      getDocs(query(collection(db, "users"), where("companyId", "==", companyId))),
      getDocs(query(collection(db, "kudos"), where("companyId", "==", companyId), orderBy("createdAt", "desc")))
    ]).then(([userSnap, kudosSnap]) => {
      setUsers(userSnap.docs.map(d => ({ uid: d.id, ...d.data() })));
      setKudos(kudosSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [companyId]);

  // Calculate points by month (given/redeemed)
  const pointsByMonth: Record<string, number> = {};
  const kudosByUser: Record<string, number> = {};
  const kudosReceivedByUser: Record<string, number> = {};
  const pointsLeaderboard: { uid: string, points: number }[] = [];
  const recognizedLeaderboard: { uid: string, count: number }[] = [];
  const receivedLeaderboard: { uid: string, count: number }[] = [];

  users.forEach(u => {
    pointsLeaderboard.push({ uid: u.uid, points: u.points || 0 });
  });

  kudos.forEach(k => {
    if (k.createdAt?.toDate) {
      const month = formatMonth(k.createdAt.toDate());
      pointsByMonth[month] = (pointsByMonth[month] || 0) + (k.points || 1);
    }
    if (k.fromUid) kudosByUser[k.fromUid] = (kudosByUser[k.fromUid] || 0) + 1;
    if (k.toUid) kudosReceivedByUser[k.toUid] = (kudosReceivedByUser[k.toUid] || 0) + 1;
  });

  pointsLeaderboard.sort((a, b) => b.points - a.points);
  Object.entries(kudosByUser).forEach(([uid, count]) => recognizedLeaderboard.push({ uid, count }));
  recognizedLeaderboard.sort((a, b) => b.count - a.count);
  Object.entries(kudosReceivedByUser).forEach(([uid, count]) => receivedLeaderboard.push({ uid, count }));
  receivedLeaderboard.sort((a, b) => b.count - a.count);

  const chartData = Object.entries(pointsByMonth)
    .map(([month, points]) => ({ month, points }))
    .sort((a, b) => a.month.localeCompare(b.month));

  useEffect(() => {
    const rows = kudos.map(k => ({
      date: k.createdAt?.toDate ? k.createdAt.toDate().toLocaleDateString() : "",
      from: users.find(u => u.uid === k.fromUid)?.fullName || k.fromEmail || k.fromUid,
      to: users.find(u => u.uid === k.toUid)?.fullName || k.toEmail || k.toUid,
      points: k.points || 1,
      message: k.message || "",
      badge: k.badge || "",
    }));
    setCsvData(rows);
  }, [kudos, users]);

  if (role !== "admin") {
    return (
      <div className="text-red-500 font-bold mt-16 text-center">
        Admin Only – You do not have access to this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-lg text-blue-600 animate-pulse">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 mb-10 bg-white p-8 rounded-3xl shadow-2xl">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        <span role="img" aria-label="chart">📊</span> Points &amp; Recognition Analytics
      </h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Points Given Per Month</h2>
        {chartData.length === 0 ? (
          <div className="text-gray-400">No data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="points" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Most Points (All Time)</h2>
          <ol className="list-decimal ml-6 text-base">
            {pointsLeaderboard.slice(0, 10).map((u, i) => (
              <li key={u.uid}>
                {users.find(us => us.uid === u.uid)?.fullName || u.uid} – <span className="font-bold">{u.points}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Most Kudos Given</h2>
          <ol className="list-decimal ml-6 text-base">
            {recognizedLeaderboard.slice(0, 10).map((u, i) => (
              <li key={u.uid}>
                {users.find(us => us.uid === u.uid)?.fullName || u.uid} – <span className="font-bold">{u.count}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Most Kudos Received</h2>
          <ol className="list-decimal ml-6 text-base">
            {receivedLeaderboard.slice(0, 10).map((u, i) => (
              <li key={u.uid}>
                {users.find(us => us.uid === u.uid)?.fullName || u.uid} – <span className="font-bold">{u.count}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Points by User (Pie)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pointsLeaderboard.slice(0, 8)}
                dataKey="points"
                nameKey="uid"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ percent, index }: { percent: number; index: number }) =>
                  `${users.find(us => us.uid === pointsLeaderboard[index].uid)?.fullName || pointsLeaderboard[index].uid
                  }: ${Math.round(percent * 100)}%`
                }
              >
                {pointsLeaderboard.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) =>
                  [`${value} points`, "Points"]
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8">
        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700"
          onClick={() => downloadCSV("kudos_analytics.csv", csvData)}
          disabled={csvData.length === 0}
        >
          Export All Kudos as CSV
        </button>
      </div>
    </div>
  );
}
