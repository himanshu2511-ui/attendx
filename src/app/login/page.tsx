"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");
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
                position: "absolute", bottom: "-100px", left: "-100px", width: "400px", height: "400px",
                background: "radial-gradient(circle, rgba(0,245,255,0.1) 0%, transparent 70%)",
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
                        Welcome back
                    </h1>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "8px" }}>
                        Sign in to your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Email</label>
                        <input className="input-field" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px" }}>Password</label>
                        <input className="input-field" type="password" placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                            padding: "12px 16px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--color-accent-red)", fontSize: "13px",
                        }}>
                            {error}
                        </motion.div>
                    )}

                    <button type="submit" className="btn-glow" disabled={loading} style={{
                        width: "100%", marginTop: "8px", opacity: loading ? 0.7 : 1, fontSize: "15px", padding: "16px",
                    }}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" style={{ color: "var(--color-accent-cyan)", textDecoration: "none", fontWeight: 500 }}>
                        Create one
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
