"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ClassroomsPage() {
    const { user } = useAuthStore();
    const isEducator = user?.role === "EDUCATOR";

    const { data, isLoading } = useQuery({
        queryKey: ["classrooms"],
        queryFn: async () => {
            const res = await fetch("/api/classrooms");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div>
                <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>
                    {isEducator ? "My Classrooms" : "My Classes"}
                </h1>
                <div style={{ display: "grid", gap: "16px" }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton" style={{ height: "120px" }} />
                    ))}
                </div>
            </div>
        );
    }

    const classrooms = data?.classrooms || [];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800 }}>
                    {isEducator ? "My Classrooms" : "My Classes"}
                </h1>
                {isEducator && (
                    <Link href="/dashboard/create-class">
                        <button className="btn-glow">+ New Class</button>
                    </Link>
                )}
            </div>

            {classrooms.length === 0 ? (
                <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏫</div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                        {isEducator ? "No classrooms yet" : "Not enrolled in any class"}
                    </h3>
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>
                        {isEducator ? "Create your first classroom to get started" : "Search and join a classroom"}
                    </p>
                    <Link href={isEducator ? "/dashboard/create-class" : "/dashboard/join-class"}>
                        <button className="btn-glow">{isEducator ? "Create Classroom" : "Join a Class"}</button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                    {classrooms.map((item: Record<string, unknown>, i: number) => {
                        const c = isEducator ? item : (item as Record<string, unknown>)?.classroom as Record<string, unknown> | undefined;
                        if (!c) return null;
                        const classroom = c as { id: string; name: string; subject: string; classCode: string; studentCount?: number; students?: { status: string; student: { name: string; id: string; rollNo?: string; username: string } }[]; educator?: { name: string }; _count?: { students: number } };
                        const enrollmentStatus = !isEducator ? (item as { status?: string }).status || null : null;

                        return (
                            <motion.div
                                key={classroom.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card"
                                style={{ padding: "24px" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{classroom.name}</h3>
                                        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>{classroom.subject}</p>
                                    </div>
                                    {enrollmentStatus && (
                                        <span className={`badge ${enrollmentStatus === "APPROVED" ? "badge-green" : enrollmentStatus === "PENDING" ? "badge-orange" : "badge-red"}`}>
                                            {enrollmentStatus}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
                                    <span>Code: <span style={{ color: "var(--color-accent-cyan)", fontWeight: 600 }}>{classroom.classCode}</span></span>
                                    <span>👥 {classroom.studentCount ?? classroom._count?.students ?? 0}</span>
                                </div>

                                {isEducator && classroom.students && classroom.students.length > 0 && (
                                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
                                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                                            Enrolled Students ({classroom.students.length})
                                        </div>
                                        {classroom.students
                                            .slice(0, 5)
                                            .map((s: { student: { name: string; id: string; rollNo?: string; username: string } }) => (
                                                <div key={s.student.id} style={{
                                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                                    padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                                                }}>
                                                    <div>
                                                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{s.student.name}</span>
                                                        {s.student.rollNo && (
                                                            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "8px" }}>
                                                                {s.student.rollNo}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>@{s.student.username}</span>
                                                </div>
                                            ))}
                                        {classroom.students.length > 5 && (
                                            <div style={{ fontSize: "12px", color: "var(--color-accent-cyan)", marginTop: "8px", textAlign: "center" }}>
                                                +{classroom.students.length - 5} more students
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isEducator && (
                                    <Link href={`/dashboard/live?classroom=${classroom.id}`} style={{ textDecoration: "none" }}>
                                        <button className="btn-secondary" style={{ width: "100%", marginTop: "12px" }}>
                                            📡 Start Live Session
                                        </button>
                                    </Link>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
