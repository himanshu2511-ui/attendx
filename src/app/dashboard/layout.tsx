"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const educatorLinks = [
    { href: "/dashboard", label: "Overview", icon: "📊" },
    { href: "/dashboard/classrooms", label: "My Classrooms", icon: "🏫" },
    { href: "/dashboard/create-class", label: "Create Class", icon: "➕" },
    { href: "/dashboard/live", label: "Live Sessions", icon: "📡" },
    { href: "/dashboard/timetable", label: "Timetable", icon: "📅" },
    { href: "/dashboard/attendance", label: "Class History", icon: "📋" },
];

const studentLinks = [
    { href: "/dashboard", label: "Overview", icon: "📊" },
    { href: "/dashboard/join-class", label: "Join Class", icon: "🔍" },
    { href: "/dashboard/classrooms", label: "My Classes", icon: "🏫" },
    { href: "/dashboard/live", label: "Live Sessions", icon: "📡" },
    { href: "/dashboard/timetable", label: "Timetable", icon: "📅" },
    { href: "/dashboard/attendance", label: "Attendance", icon: "📈" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="gradient-text" style={{ fontFamily: "var(--font-family-display)", fontSize: "32px", fontWeight: 800 }}>
                    AttendX
                </div>
            </div>
        );
    }

    if (!user) return null;

    const links = user.role === "EDUCATOR" ? educatorLinks : studentLinks;

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        logout();
        router.push("/login");
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                            zIndex: 35, display: "none",
                        }}
                        className="mobile-overlay"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                <div style={{ marginBottom: "32px", paddingLeft: "8px" }}>
                    <Link href="/dashboard" style={{ textDecoration: "none" }}>
                        <span className="gradient-text" style={{ fontFamily: "var(--font-family-display)", fontSize: "24px", fontWeight: 800 }}>
                            AttendX
                        </span>
                    </Link>
                </div>

                {/* User info */}
                <div style={{
                    padding: "16px", borderRadius: "12px", background: "var(--color-bg-glass)",
                    border: "1px solid var(--color-border)", marginBottom: "24px",
                }}>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{user.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>@{user.username}</div>
                    <span className={`badge ${user.role === "EDUCATOR" ? "badge-purple" : "badge-cyan"}`} style={{ marginTop: "8px", fontSize: "10px" }}>
                        {user.role}
                    </span>
                </div>

                {/* Nav links */}
                <nav style={{ flex: 1 }}>
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`sidebar-link ${pathname === link.href ? "active" : ""}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span style={{ fontSize: "18px" }}>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "12px 16px", borderRadius: "10px", background: "none",
                        border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--color-accent-red)",
                        cursor: "pointer", fontSize: "14px", fontWeight: 500, width: "100%",
                        transition: "all 0.2s",
                    }}
                >
                    <span>🚪</span> Sign Out
                </button>
            </aside>

            {/* Main content */}
            <main style={{
                flex: 1, marginLeft: "260px", padding: "32px",
                minHeight: "100vh",
            }}>
                {/* Mobile header */}
                <div style={{
                    display: "none", alignItems: "center", justifyContent: "space-between",
                    marginBottom: "24px", padding: "12px 0",
                }} className="mobile-header">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
                        background: "none", border: "none", color: "var(--color-text-primary)",
                        fontSize: "24px", cursor: "pointer",
                    }}>
                        ☰
                    </button>
                    <span className="gradient-text" style={{ fontFamily: "var(--font-family-display)", fontSize: "20px", fontWeight: 800 }}>
                        AttendX
                    </span>
                    <div style={{ width: "24px" }} />
                </div>

                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            </main>

            <style jsx>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; }
          .mobile-overlay { display: block !important; }
          .mobile-header { display: flex !important; }
        }
      `}</style>
        </div>
    );
}
