"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "24px",
    }}>
      {/* Background effects */}
      <div style={{
        position: "absolute",
        top: "-200px",
        left: "-200px",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-200px",
        right: "-200px",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ textAlign: "center", maxWidth: "720px", position: "relative", zIndex: 1 }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ marginBottom: "24px" }}
        >
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 20px",
            borderRadius: "40px",
            background: "rgba(0, 245, 255, 0.06)",
            border: "1px solid rgba(0, 245, 255, 0.15)",
          }}>
            <span style={{ fontSize: "24px" }}>⚡</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-accent-cyan)", letterSpacing: "2px", textTransform: "uppercase" }}>
              AttendX
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            fontFamily: "var(--font-family-display)",
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "20px",
          }}
        >
          <span className="gradient-text">Smart Attendance</span>
          <br />
          <span style={{ color: "var(--color-text-primary)" }}>Made Effortless</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{
            fontSize: "18px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "540px",
            margin: "0 auto 40px",
          }}
        >
          Real-time live classes, instant attendance portals, smart timetables,
          and beautiful analytics — all in one premium platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <button className="btn-glow" style={{ fontSize: "16px", padding: "16px 36px" }}>
              Get Started Free →
            </button>
          </Link>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <button className="btn-secondary" style={{ fontSize: "16px", padding: "16px 36px" }}>
              Sign In
            </button>
          </Link>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginTop: "80px",
          }}
        >
          {[
            { icon: "📡", title: "Live Sessions", desc: "Real-time attendance portals" },
            { icon: "📊", title: "Smart Analytics", desc: "Per-subject tracking" },
            { icon: "📅", title: "Timetables", desc: "Interactive schedule builder" },
            { icon: "🔐", title: "Secure", desc: "Role-based access control" },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="glass-card"
              style={{ padding: "24px", textAlign: "left" }}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>{f.title}</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
