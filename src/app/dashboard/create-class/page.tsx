"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CreateClassPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [form, setForm] = useState({ name: "", subject: "" });
    const [created, setCreated] = useState<{
        id: string; name: string; subject: string; classCode: string; joinLink: string; qrCodeUrl: string | null;
    } | null>(null);

    const mutation = useMutation({
        mutationFn: async (data: { name: string; subject: string }) => {
            const res = await fetch("/api/classrooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            return res.json();
        },
        onSuccess: (data) => {
            setCreated(data.classroom);
            queryClient.invalidateQueries({ queryKey: ["classrooms"] });
        },
    });

    if (created) {
        return (
            <div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ maxWidth: "500px", margin: "0 auto", padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
                    <h2 style={{ fontFamily: "var(--font-family-display)", fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>
                        Classroom Created!
                    </h2>
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
                        {created.name} — {created.subject}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "left" }}>
                        <div className="glass-card" style={{ padding: "20px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                                Class Code
                            </div>
                            <div style={{
                                fontSize: "32px", fontWeight: 800, letterSpacing: "6px",
                                color: "var(--color-accent-cyan)", fontFamily: "var(--font-family-display)",
                            }}>
                                {created.classCode}
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: "20px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
                                Join Link
                            </div>
                            <div style={{ fontSize: "14px", color: "var(--color-accent-purple)", wordBreak: "break-all" }}>
                                {typeof window !== "undefined" ? window.location.origin : ""}{created.joinLink}
                            </div>
                        </div>

                        {created.qrCodeUrl && (
                            <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "12px", textTransform: "uppercase" }}>
                                    QR Code
                                </div>
                                <div className="qr-container">
                                    <img src={created.qrCodeUrl} alt="QR Code" style={{ width: "200px", height: "200px", borderRadius: "8px" }} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "32px", justifyContent: "center" }}>
                        <button className="btn-glow" onClick={() => router.push("/dashboard/classrooms")}>
                            View Classrooms
                        </button>
                        <button className="btn-secondary" onClick={() => { setCreated(null); setForm({ name: "", subject: "" }); }}>
                            Create Another
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
                Create Classroom
            </h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
                Set up a new classroom with auto-generated codes and QR
            </p>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ maxWidth: "500px", padding: "32px" }}>
                <form
                    onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
                    style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                >
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                            Classroom Name
                        </label>
                        <input className="input-field" placeholder="e.g. CS 201 — Section A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                            Subject
                        </label>
                        <input className="input-field" placeholder="e.g. Data Structures" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                    </div>

                    {mutation.isError && (
                        <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--color-accent-red)", fontSize: "13px" }}>
                            {(mutation.error as Error).message}
                        </div>
                    )}

                    <button type="submit" className="btn-glow" disabled={mutation.isPending} style={{ width: "100%", opacity: mutation.isPending ? 0.7 : 1 }}>
                        {mutation.isPending ? "Creating..." : "Create Classroom"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
