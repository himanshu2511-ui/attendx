"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

function PortalTimer({ closeTime }: { closeTime: string }) {
    const [remaining, setRemaining] = useState(0);

    useEffect(() => {
        const update = () => {
            const diff = Math.max(0, new Date(closeTime).getTime() - Date.now());
            setRemaining(Math.ceil(diff / 1000));
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [closeTime]);

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const progress = remaining > 0 ? 1 : 0;

    return (
        <div style={{ textAlign: "center" }}>
            <motion.div
                className="portal-timer"
                style={{
                    color: remaining > 60 ? "var(--color-accent-green)" : remaining > 30 ? "var(--color-accent-orange)" : "var(--color-accent-red)",
                }}
                animate={{ scale: remaining <= 10 && remaining > 0 ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: remaining <= 10 ? Infinity : 0, duration: 1 }}
            >
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </motion.div>
            <div style={{
                height: "4px", borderRadius: "2px", marginTop: "12px",
                background: "var(--color-bg-glass)", overflow: "hidden",
            }}>
                <motion.div
                    style={{
                        height: "100%", borderRadius: "2px",
                        background: remaining > 60 ? "var(--color-accent-green)" : remaining > 30 ? "var(--color-accent-orange)" : "var(--color-accent-red)",
                    }}
                    animate={{ width: progress > 0 ? "100%" : "0%" }}
                    transition={{ duration: remaining, ease: "linear" }}
                />
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px" }}>
                {remaining > 0 ? "Portal is open — students can call attendance" : "Portal has closed"}
            </p>
        </div>
    );
}

export default function LivePage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const isEducator = user?.role === "EDUCATOR";
    const [selectedClassroom, setSelectedClassroom] = useState(searchParams.get("classroom") || "");
    const [portalDuration, setPortalDuration] = useState(5);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const { data: classroomData } = useQuery({
        queryKey: ["classrooms"],
        queryFn: async () => (await fetch("/api/classrooms")).json(),
    });

    const { data: sessionsData, refetch: refetchSessions } = useQuery({
        queryKey: ["live-sessions"],
        queryFn: async () => (await fetch("/api/live")).json(),
        refetchInterval: 5000,
    });

    const { data: sessionDetail, refetch: refetchDetail } = useQuery({
        queryKey: ["session-detail", activeSessionId],
        queryFn: async () => {
            if (!activeSessionId) return null;
            return (await fetch(`/api/live/${activeSessionId}`)).json();
        },
        enabled: !!activeSessionId,
        refetchInterval: 3000,
    });

    const startMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/live", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classroomId: selectedClassroom, portalDuration }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            return res.json();
        },
        onSuccess: (data) => {
            setActiveSessionId(data.session.id);
            refetchSessions();
        },
    });

    const actionMutation = useMutation({
        mutationFn: async ({ action, studentId, pd }: { action: string; studentId?: string; pd?: number }) => {
            const res = await fetch(`/api/live/${activeSessionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, studentId, portalDuration: pd }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            return res.json();
        },
        onSuccess: () => {
            refetchDetail();
            refetchSessions();
        },
    });

    const doAction = useCallback(
        (action: string, studentId?: string) => actionMutation.mutate({ action, studentId }),
        [actionMutation]
    );

    const session = sessionDetail?.session;
    const activeSessions = sessionsData?.sessions?.filter((s: { status: string }) => s.status === "LIVE") || [];

    // Get classrooms list for educator dropdown
    const classrooms = isEducator
        ? (classroomData?.classrooms || [])
        : (classroomData?.classrooms?.map((e: { classroom: unknown }) => e.classroom).filter(Boolean) || []);

    return (
        <div>
            <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                Live Sessions
            </h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
                {isEducator ? "Start and manage live attendance sessions" : "Join active sessions and mark attendance"}
            </p>

            {/* Active session detail */}
            {activeSessionId && session ? (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: "32px", marginBottom: "32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                        <div>
                            <h2 style={{ fontFamily: "var(--font-family-display)", fontSize: "22px", fontWeight: 700 }}>
                                {session.classroom.name}
                            </h2>
                            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>{session.classroom.subject}</p>
                        </div>
                        <span className={`badge ${session.status === "LIVE" ? "badge-green" : session.status === "ENDED" ? "badge-red" : "badge-orange"}`}>
                            {session.status}
                        </span>
                    </div>

                    {/* Portal timer */}
                    {session.portalOpen && session.portalCloseTime && (
                        <div style={{ marginBottom: "24px" }}>
                            <PortalTimer closeTime={session.portalCloseTime} />
                        </div>
                    )}

                    {/* Educator controls */}
                    {isEducator && session.status === "LIVE" && (
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
                            {!session.portalOpen ? (
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <select
                                        value={portalDuration}
                                        onChange={(e) => setPortalDuration(Number(e.target.value))}
                                        className="input-field"
                                        style={{ width: "auto", padding: "10px 16px" }}
                                    >
                                        <option value={3}>3 min</option>
                                        <option value={5}>5 min</option>
                                        <option value={7}>7 min</option>
                                        <option value={10}>10 min</option>
                                    </select>
                                    <button className="btn-glow" onClick={() => actionMutation.mutate({ action: "open-portal", pd: portalDuration })}>
                                        🚪 Open Portal
                                    </button>
                                </div>
                            ) : (
                                <button className="btn-danger" onClick={() => doAction("close-portal")}>
                                    Close Portal
                                </button>
                            )}
                            <button className="btn-success" onClick={() => doAction("admit", "all")}>
                                ✓ Admit All
                            </button>
                            <button className="btn-danger" onClick={() => doAction("end")}>
                                End Session
                            </button>
                            <button className="btn-secondary" onClick={() => doAction("cancel")}>
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Student controls */}
                    {!isEducator && session.status === "LIVE" && (() => {
                        const myAttendee = session.attendees?.find((a: { student: { id: string } }) => a.student.id === user?.id);
                        const hasEntered = !!myAttendee;
                        const isAdmitted = !!myAttendee?.admittedAt;
                        const hasCalledAttendance = myAttendee?.attendanceCalled;

                        return (
                            <div style={{ marginBottom: "24px" }}>
                                {!hasEntered ? (
                                    <button className="btn-glow" onClick={() => doAction("join")}>
                                        🙋 Enter Session
                                    </button>
                                ) : !isAdmitted ? (
                                    <div style={{
                                        padding: "16px 20px", borderRadius: "12px",
                                        background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)",
                                        color: "var(--color-accent-orange)", fontSize: "14px",
                                        display: "flex", alignItems: "center", gap: "10px",
                                    }}>
                                        <motion.span
                                            animate={{ opacity: [1, 0.4, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            style={{ fontSize: "18px" }}
                                        >⏳</motion.span>
                                        Waiting for educator to admit you...
                                    </div>
                                ) : hasCalledAttendance ? (
                                    <div style={{
                                        padding: "16px 20px", borderRadius: "12px",
                                        background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)",
                                        color: "var(--color-accent-green)", fontSize: "14px",
                                        display: "flex", alignItems: "center", gap: "10px",
                                    }}>
                                        ✅ Attendance marked — you are PRESENT
                                    </div>
                                ) : session.portalOpen ? (
                                    <motion.button
                                        className="btn-success"
                                        onClick={() => doAction("call-attendance")}
                                        animate={{ boxShadow: ["0 0 10px rgba(16,185,129,0.3)", "0 0 30px rgba(16,185,129,0.6)", "0 0 10px rgba(16,185,129,0.3)"] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        style={{ fontSize: "16px", padding: "14px 28px" }}
                                    >
                                        📢 Call Attendance
                                    </motion.button>
                                ) : (
                                    <div style={{
                                        padding: "16px 20px", borderRadius: "12px",
                                        background: "var(--color-bg-glass)", border: "1px solid var(--color-border)",
                                        color: "var(--color-text-secondary)", fontSize: "14px",
                                        display: "flex", alignItems: "center", gap: "10px",
                                    }}>
                                        ✓ Admitted — waiting for educator to open the attendance portal
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {actionMutation.isError && (
                        <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--color-accent-red)", fontSize: "13px", marginBottom: "16px" }}>
                            {(actionMutation.error as Error).message}
                        </div>
                    )}

                    {/* Attendees list (educator view) */}
                    {isEducator && session.attendees && session.attendees.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
                                Students ({session.attendees.length})
                            </h3>
                            <div style={{ display: "grid", gap: "8px" }}>
                                {session.attendees.map((a: { id: string; admittedAt: string | null; attendanceStatus: string; student: { name: string; rollNo?: string; id: string } }) => (
                                    <div
                                        key={a.id}
                                        style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "12px 16px", borderRadius: "10px",
                                            background: a.attendanceStatus === "PRESENT" ? "rgba(16,185,129,0.08)" : "var(--color-bg-glass)",
                                            border: `1px solid ${a.attendanceStatus === "PRESENT" ? "rgba(16,185,129,0.2)" : "var(--color-border)"}`,
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontWeight: 500 }}>{a.student.name}</span>
                                            {a.student.rollNo && <span style={{ color: "var(--color-text-muted)", marginLeft: "8px", fontSize: "12px" }}>{a.student.rollNo}</span>}
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <span className={`badge ${a.attendanceStatus === "PRESENT" ? "badge-green" : a.attendanceStatus === "ABSENT" ? "badge-red" : "badge-orange"}`}>
                                                {a.attendanceStatus}
                                            </span>
                                            {!a.admittedAt && (
                                                <button className="btn-success" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => doAction("admit", a.student.id)}>
                                                    Admit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button className="btn-secondary" onClick={() => setActiveSessionId(null)} style={{ marginTop: "24px" }}>
                        ← Back to Sessions
                    </button>
                </motion.div>
            ) : (
                <>
                    {/* Start new session (educator) */}
                    {isEducator && (
                        <div className="glass-card" style={{ padding: "24px", marginBottom: "32px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Start New Session</h3>
                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: "200px" }}>
                                    <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "6px" }}>Classroom</label>
                                    <select className="input-field" value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)}>
                                        <option value="">Select classroom...</option>
                                        {classrooms.map((c: { id: string; name: string; subject: string }) => (
                                            <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
                                        ))}
                                    </select>
                                </div>
                                <button className="btn-glow" disabled={!selectedClassroom || startMutation.isPending} onClick={() => startMutation.mutate()}>
                                    {startMutation.isPending ? "Starting..." : "📡 Go Live"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active sessions list */}
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                        {activeSessions.length > 0 ? "Active Sessions" : "No Active Sessions"}
                    </h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                        {activeSessions.map((s: { id: string; classroom: { name: string; subject: string }; status: string; _count: { attendees: number } }, i: number) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card"
                                style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                                onClick={() => setActiveSessionId(s.id)}
                            >
                                <div>
                                    <h4 style={{ fontWeight: 600 }}>{s.classroom.name}</h4>
                                    <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{s.classroom.subject}</p>
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>👥 {s._count.attendees}</span>
                                    <motion.span
                                        className="badge badge-green"
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                        LIVE
                                    </motion.span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
