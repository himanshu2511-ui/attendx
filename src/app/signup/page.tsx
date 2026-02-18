"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";

export default function SignupPage() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [form, setForm] = useState({
        name: "", username: "", email: "", password: "", role: "STUDENT" as "STUDENT" | "EDUCATOR", rollNo: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Signup failed");
            setUser(data.user);
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            position: "relative",
        }}>
            <div style={{
                position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px",
                background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
                borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{ width: "100%", maxWidth: "460px", padding: "40px" }}
            >
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        <span className="gradient-text" style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800 }}>
                            AttendX
                        </span>
                    </Link>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, marginTop: "12px", fontFamily: "var(--font-family-display)" }}>
                        Create your account
                    </h1>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "8px" }}>
                        Join the smart attendance platform
                    </p>
                </div>

                {/* Role selector */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                    {(["STUDENT", "EDUCATOR"] as const).map((role) => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => setForm({ ...form, role })}
                            style={{
                                padding: "14px",
                                borderRadius: "12px",
                                border: `1px solid ${form.role === role ? "var(--color-accent-cyan)" : "var(--color-border)"}`,
                                background: form.role === role ? "rgba(0, 245, 255, 0.08)" : "var(--color-bg-glass)",
                                color: form.role === role ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "14px",
                                transition: "all 0.2s",
                            }}
                        >
                            {role === "STUDENT" ? "🎓 Student" : "👨‍🏫 Educator"}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Full Name</label>
                        <input className="input-field" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Username</label>
                        <input className="input-field" placeholder="johndoe" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} pattern="[a-zA-Z0-9_]{3,}" title="At least 3 characters: letters, numbers, and underscores only" required />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Email</label>
                        <input className="input-field" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Password</label>
                        <input className="input-field" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    {form.role === "STUDENT" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Roll Number</label>
                            <input className="input-field" placeholder="e.g. CS2024001" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
                        </motion.div>
                    )}

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                            padding: "12px 16px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--color-accent-red)", fontSize: "13px",
                        }}>
                            {error}
                        </motion.div>
                    )}

                    <button type="submit" className="btn-glow" disabled={loading} style={{
                        width: "100%", marginTop: "8px", opacity: loading ? 0.7 : 1, fontSize: "15px", padding: "16px"
                    }}>
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "var(--color-accent-cyan)", textDecoration: "none", fontWeight: 500 }}>
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
