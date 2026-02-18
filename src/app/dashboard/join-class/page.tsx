"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function JoinClassPage() {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Array<{
        id: string; name: string; subject: string; classCode: string;
        educator: { name: string }; _count: { students: number };
    }>>([]);
    const [searching, setSearching] = useState(false);
    const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

    const search = async () => {
        if (query.length < 2) return;
        setSearching(true);
        try {
            const res = await fetch(`/api/classrooms/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data.classrooms || []);
        } catch { /* ignore */ }
        setSearching(false);
    };

    const joinMutation = useMutation({
        mutationFn: async (classroomId: string) => {
            const res = await fetch(`/api/classrooms/${classroomId}`, {
                method: "POST",
            });
            if (!res.ok) throw new Error((await res.json()).error);
            return { classroomId };
        },
        onSuccess: (data) => {
            setJoinedIds((prev) => new Set(prev).add(data.classroomId));
            queryClient.invalidateQueries({ queryKey: ["classrooms"] });
        },
    });

    return (
        <div>
            <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                Join a Class
            </h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
                Search by class code, name, or subject
            </p>

            <div style={{ display: "flex", gap: "12px", marginBottom: "32px", maxWidth: "500px" }}>
                <input
                    className="input-field"
                    placeholder="Enter class code or name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search()}
                />
                <button className="btn-glow" onClick={search} disabled={searching} style={{ whiteSpace: "nowrap" }}>
                    {searching ? "..." : "Search"}
                </button>
            </div>

            {results.length > 0 ? (
                <div style={{ display: "grid", gap: "16px", maxWidth: "600px" }}>
                    {results.map((c, i) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card"
                            style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{c.name}</h3>
                                <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>{c.subject}</p>
                                <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
                                    <span>By {c.educator.name}</span>
                                    <span>Code: <span style={{ color: "var(--color-accent-cyan)" }}>{c.classCode}</span></span>
                                    <span>👥 {c._count.students}</span>
                                </div>
                            </div>
                            {joinedIds.has(c.id) ? (
                                <span className="badge badge-orange">Requested</span>
                            ) : (
                                <button
                                    className="btn-glow"
                                    style={{ padding: "10px 20px", fontSize: "13px" }}
                                    onClick={() => joinMutation.mutate(c.id)}
                                    disabled={joinMutation.isPending}
                                >
                                    Join
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : query && !searching ? (
                <div className="glass-card" style={{ padding: "40px", textAlign: "center", maxWidth: "500px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
                    <p style={{ color: "var(--color-text-secondary)" }}>No classrooms found. Try a different search term.</p>
                </div>
            ) : null}

            {joinMutation.isError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                    marginTop: "16px", padding: "12px 16px", borderRadius: "10px",
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                    color: "var(--color-accent-red)", fontSize: "13px", maxWidth: "500px",
                }}>
                    {(joinMutation.error as Error).message}
                </motion.div>
            )}
        </div>
    );
}
