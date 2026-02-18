"use client";

import { useAuthStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuthStore();

    const { data: classroomsData } = useQuery({
        queryKey: ["classrooms"],
        queryFn: async () => {
            const res = await fetch("/api/classrooms");
            return res.json();
        },
    });

    const { data: sessionsData } = useQuery({
        queryKey: ["live-sessions"],
        queryFn: async () => {
            const res = await fetch("/api/live");
            return res.json();
        },
    });

    const isEducator = user?.role === "EDUCATOR";

    const classCount = classroomsData?.classrooms?.length || 0;
    const activeSessions = sessionsData?.sessions?.filter((s: { status: string }) => s.status === "LIVE")?.length || 0;

    return (
        <div>
            <div style={{ marginBottom: "32px" }}>
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontFamily: "var(--font-family-display)", fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}
                >
                    Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
                </motion.h1>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "15px" }}>
                    {isEducator ? "Manage your classrooms and sessions" : "Stay on top of your classes and attendance"}
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                {[
                    { label: isEducator ? "Classrooms" : "Enrolled", value: classCount, color: "var(--color-accent-cyan)", icon: "🏫" },
                    { label: "Live Now", value: activeSessions, color: "var(--color-accent-green)", icon: "📡" },
                    { label: isEducator ? "Students" : "Attendance", value: "—", color: "var(--color-accent-purple)", icon: isEducator ? "👥" : "📊" },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="stat-card"
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                            <span style={{ fontSize: "28px" }}>{stat.icon}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <h2 style={{ fontFamily: "var(--font-family-display)", fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>
                Quick Actions
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                {isEducator ? (
                    <>
                        <Link href="/dashboard/create-class" style={{ textDecoration: "none" }}>
                            <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "24px", cursor: "pointer" }}>
                                <span style={{ fontSize: "32px" }}>➕</span>
                                <h3 style={{ marginTop: "12px", fontSize: "16px", fontWeight: 600 }}>Create Classroom</h3>
                                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                                    Set up a new class with auto-generated codes
                                </p>
                            </motion.div>
                        </Link>
                        <Link href="/dashboard/live" style={{ textDecoration: "none" }}>
                            <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "24px", cursor: "pointer" }}>
                                <span style={{ fontSize: "32px" }}>📡</span>
                                <h3 style={{ marginTop: "12px", fontSize: "16px", fontWeight: 600 }}>Start Live Session</h3>
                                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                                    Begin a live attendance session
                                </p>
                            </motion.div>
                        </Link>
                        <Link href="/dashboard/timetable" style={{ textDecoration: "none" }}>
                            <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "24px", cursor: "pointer" }}>
                                <span style={{ fontSize: "32px" }}>📅</span>
                                <h3 style={{ marginTop: "12px", fontSize: "16px", fontWeight: 600 }}>Manage Timetable</h3>
                                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                                    Set up your weekly schedule
                                </p>
                            </motion.div>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link href="/dashboard/join-class" style={{ textDecoration: "none" }}>
                            <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "24px", cursor: "pointer" }}>
                                <span style={{ fontSize: "32px" }}>🔍</span>
                                <h3 style={{ marginTop: "12px", fontSize: "16px", fontWeight: 600 }}>Join a Class</h3>
                                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                                    Search and join a classroom by code
                                </p>
                            </motion.div>
                        </Link>
                        <Link href="/dashboard/live" style={{ textDecoration: "none" }}>
                            <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "24px", cursor: "pointer" }}>
                                <span style={{ fontSize: "32px" }}>📡</span>
                                <h3 style={{ marginTop: "12px", fontSize: "16px", fontWeight: 600 }}>Live Sessions</h3>
                                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                                    View and join active sessions
                                </p>
                            </motion.div>
                        </Link>
                        <Link href="/dashboard/attendance" style={{ textDecoration: "none" }}>
                            <motion.div whileHover={{ scale: 1.02 }} className="glass-card" style={{ padding: "24px", cursor: "pointer" }}>
                                <span style={{ fontSize: "32px" }}>📈</span>
                                <h3 style={{ marginTop: "12px", fontSize: "16px", fontWeight: 600 }}>Attendance Tracker</h3>
                                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                                    View your attendance stats and history
                                </p>
                            </motion.div>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
