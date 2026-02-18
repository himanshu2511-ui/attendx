"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#00f5ff", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

/* ─────────────── Types ─────────────── */

interface SessionStudent {
    id: string;
    name: string;
    username: string;
    rollNo?: string;
    status: string;
}

interface SessionRecord {
    id: string;
    date: string;
    classroomId: string;
    classroomName: string;
    subject: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    students: SessionStudent[];
}

interface AttendanceRecord {
    id: string;
    markedAt: string;
    status: string;
    liveSession: {
        classroom: { subject: string; name: string };
    };
}

interface SubjectSummary {
    subject: string;
    percentage: number;
    present: number;
    total: number;
    classroomName: string;
}

/* ─────────────── Educator View ─────────────── */

function EducatorAttendanceView() {
    const { data, isLoading } = useQuery({
        queryKey: ["attendance"],
        queryFn: async () => (await fetch("/api/attendance")).json(),
    });

    const [expandedSession, setExpandedSession] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div>
                <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>
                    Class History
                </h1>
                <div style={{ display: "grid", gap: "16px" }}>
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "120px" }} />)}
                </div>
            </div>
        );
    }

    const sessionHistory: SessionRecord[] = data?.sessionHistory || [];
    const stats = data?.stats || { totalClasses: 0, totalClassrooms: 0 };

    return (
        <div>
            <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                Class History
            </h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
                Track past classes and student attendance records
            </p>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "40px" }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
                    <div className="stat-value" style={{ color: "var(--color-accent-cyan)" }}>{stats.totalClasses}</div>
                    <div className="stat-label">Total Classes Taken</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
                    <div className="stat-value" style={{ color: "var(--color-accent-purple)" }}>{stats.totalClassrooms}</div>
                    <div className="stat-label">Active Classrooms</div>
                </motion.div>
            </div>

            {sessionHistory.length === 0 ? (
                <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>No class history yet</h3>
                    <p style={{ color: "var(--color-text-secondary)" }}>
                        Completed live sessions will appear here with student attendance records
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                    {sessionHistory.map((session, i) => {
                        const isExpanded = expandedSession === session.id;
                        const attendancePct = session.totalStudents > 0
                            ? Math.round((session.presentCount / session.totalStudents) * 100)
                            : 0;

                        return (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="glass-card"
                                style={{ padding: "0", overflow: "hidden" }}
                            >
                                {/* Session header — clickable to expand */}
                                <div
                                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                                    style={{
                                        padding: "20px 24px", cursor: "pointer",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        transition: "background 0.2s",
                                    }}
                                >
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                                            <h4 style={{ fontSize: "15px", fontWeight: 600 }}>{session.classroomName}</h4>
                                            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", background: "var(--color-bg-glass)", padding: "2px 8px", borderRadius: "6px" }}>
                                                {session.subject}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                                            {new Date(session.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                            {" · "}
                                            {new Date(session.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                        <div style={{ textAlign: "right" }}>
                                            <span style={{
                                                fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-family-display)",
                                                color: attendancePct >= 75 ? "var(--color-accent-green)" : attendancePct >= 50 ? "var(--color-accent-orange)" : "var(--color-accent-red)",
                                            }}>
                                                {attendancePct}%
                                            </span>
                                            <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                                                {session.presentCount}/{session.totalStudents} present
                                            </p>
                                        </div>
                                        <motion.span
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            style={{ fontSize: "14px", color: "var(--color-text-muted)" }}
                                        >
                                            ▼
                                        </motion.span>
                                    </div>
                                </div>

                                {/* Expanded student list */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div style={{ padding: "0 24px 20px", borderTop: "1px solid var(--color-border)" }}>
                                                {/* Summary bar */}
                                                <div style={{ display: "flex", gap: "16px", padding: "16px 0 12px", fontSize: "13px" }}>
                                                    <span style={{ color: "var(--color-accent-green)" }}>✓ {session.presentCount} Present</span>
                                                    <span style={{ color: "var(--color-accent-red)" }}>✕ {session.absentCount} Absent</span>
                                                    <span style={{ color: "var(--color-text-muted)" }}>👥 {session.totalStudents} Total</span>
                                                </div>

                                                {/* Student list */}
                                                <div style={{ display: "grid", gap: "4px" }}>
                                                    {session.students.map((student) => (
                                                        <div
                                                            key={student.id}
                                                            style={{
                                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                                padding: "10px 14px", borderRadius: "8px",
                                                                background: student.status === "PRESENT" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.04)",
                                                                border: `1px solid ${student.status === "PRESENT" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.08)"}`,
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                <span style={{ fontWeight: 500, fontSize: "14px" }}>{student.name}</span>
                                                                {student.rollNo && (
                                                                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{student.rollNo}</span>
                                                                )}
                                                                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>@{student.username}</span>
                                                            </div>
                                                            <span className={`badge ${student.status === "PRESENT" ? "badge-green" : "badge-red"}`}>
                                                                {student.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─────────────── Student View ─────────────── */

function StudentAttendanceView() {
    const { data, isLoading } = useQuery({
        queryKey: ["attendance"],
        queryFn: async () => (await fetch("/api/attendance")).json(),
    });

    if (isLoading) {
        return (
            <div>
                <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>
                    Attendance Tracker
                </h1>
                <div style={{ display: "grid", gap: "16px" }}>
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "120px" }} />)}
                </div>
            </div>
        );
    }

    const summary: SubjectSummary[] = data?.summary || [];
    const overall = data?.overall || { total: 0, present: 0, percentage: 0 };
    const records: AttendanceRecord[] = data?.records || [];

    const pieData = [
        { name: "Present", value: overall.present },
        { name: "Absent", value: overall.total - overall.present },
    ];

    return (
        <div>
            <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                Attendance Tracker
            </h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
                Track your attendance across all subjects
            </p>

            {/* Overall stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "40px" }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
                    <div className="stat-value" style={{
                        color: overall.percentage >= 75 ? "var(--color-accent-green)" : overall.percentage >= 50 ? "var(--color-accent-orange)" : "var(--color-accent-red)",
                    }}>
                        {overall.percentage}%
                    </div>
                    <div className="stat-label">Overall Attendance</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
                    <div className="stat-value" style={{ color: "var(--color-accent-green)" }}>{overall.present}</div>
                    <div className="stat-label">Classes Attended</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
                    <div className="stat-value" style={{ color: "var(--color-accent-cyan)" }}>{overall.total}</div>
                    <div className="stat-label">Total Classes</div>
                </motion.div>
            </div>

            {summary.length === 0 ? (
                <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📈</div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>No attendance data yet</h3>
                    <p style={{ color: "var(--color-text-secondary)" }}>
                        Your attendance will appear here after you attend live sessions
                    </p>
                </div>
            ) : (
                <>
                    {/* Charts */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "40px" }}>
                        {/* Bar chart */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Per-Subject Attendance</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={summary}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="subject" tick={{ fill: "#8b8ba0", fontSize: 12 }} />
                                    <YAxis tick={{ fill: "#8b8ba0", fontSize: 12 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#12121a", border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "10px", color: "#e8e8f0",
                                        }}
                                    />
                                    <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                                        {summary.map((_: unknown, i: number) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Pie chart */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Overall Split</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "#12121a", border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "10px", color: "#e8e8f0",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
                                    Present
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                                    Absent
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Subject breakdown */}
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Subject Breakdown</h3>
                    <div style={{ display: "grid", gap: "12px", marginBottom: "40px" }}>
                        {summary.map((s, i) => (
                            <motion.div
                                key={s.subject}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card"
                                style={{ padding: "20px" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div>
                                        <h4 style={{ fontSize: "15px", fontWeight: 600 }}>{s.subject}</h4>
                                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{s.classroomName}</span>
                                    </div>
                                    <span style={{
                                        fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-family-display)",
                                        color: s.percentage >= 75 ? "var(--color-accent-green)" : s.percentage >= 50 ? "var(--color-accent-orange)" : "var(--color-accent-red)",
                                    }}>
                                        {s.percentage}%
                                    </span>
                                </div>
                                <div style={{ height: "6px", borderRadius: "3px", background: "var(--color-bg-glass)", overflow: "hidden" }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${s.percentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        style={{
                                            height: "100%", borderRadius: "3px",
                                            background: s.percentage >= 75 ? "var(--color-accent-green)" : s.percentage >= 50 ? "var(--color-accent-orange)" : "var(--color-accent-red)",
                                        }}
                                    />
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px" }}>
                                    {s.present} / {s.total} classes attended
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* History table */}
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Recent History</h3>
                    <div className="glass-card" style={{ overflow: "hidden" }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Subject</th>
                                    <th>Class</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.slice(0, 20).map((r) => (
                                    <tr key={r.id}>
                                        <td style={{ color: "var(--color-text-secondary)" }}>
                                            {new Date(r.markedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                        <td>{r.liveSession.classroom.subject}</td>
                                        <td style={{ color: "var(--color-text-secondary)" }}>{r.liveSession.classroom.name}</td>
                                        <td>
                                            <span className={`badge ${r.status === "PRESENT" ? "badge-green" : "badge-red"}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

/* ─────────────── Main Page ─────────────── */

export default function AttendancePage() {
    const { user } = useAuthStore();
    const isEducator = user?.role === "EDUCATOR";

    return isEducator ? <EducatorAttendanceView /> : <StudentAttendanceView />;
}
