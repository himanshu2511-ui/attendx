"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_LABELS: Record<string, string> = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday" };
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

interface Slot {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    isBreak: boolean;
    classroom?: { name: string; subject: string } | null;
}

export default function TimetablePage() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [slotForm, setSlotForm] = useState({
        day: "MON", startTime: "09:00", endTime: "10:00", subject: "", isBreak: false,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["timetables"],
        queryFn: async () => (await fetch("/api/timetables")).json(),
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/timetables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "My Timetable" }),
            });
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timetables"] }),
    });

    const addSlotMutation = useMutation({
        mutationFn: async (timetableId: string) => {
            const res = await fetch(`/api/timetables/${timetableId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(slotForm),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timetables"] });
            setShowModal(false);
            setSlotForm({ day: "MON", startTime: "09:00", endTime: "10:00", subject: "", isBreak: false });
        },
    });

    const deleteSlotMutation = useMutation({
        mutationFn: async ({ timetableId, slotId }: { timetableId: string; slotId: string }) => {
            await fetch(`/api/timetables/${timetableId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotId }),
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timetables"] }),
    });

    const timetable = data?.timetables?.[0];

    if (isLoading) {
        return (
            <div>
                <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>Timetable</h1>
                <div className="skeleton" style={{ height: "400px" }} />
            </div>
        );
    }

    if (!timetable) {
        return (
            <div>
                <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Timetable</h1>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>Create your weekly schedule</p>
                <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>No timetable yet</h3>
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>Create one to organize your weekly schedule</p>
                    <button className="btn-glow" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Creating..." : "Create Timetable"}
                    </button>
                </div>
            </div>
        );
    }

    const slots: Slot[] = timetable.slots || [];

    const getSlotForDayHour = (day: string, hour: number) => {
        return slots.find((s) => {
            const startH = parseInt(s.startTime.split(":")[0]);
            return s.day === day && startH === hour;
        });
    };

    // Current day highlight
    const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

    // Upcoming 2 classes
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

    const upcoming = slots
        .filter((s) => !s.isBreak)
        .filter((s) => {
            if (s.day === today) return s.startTime > currentTimeStr;
            return DAYS.indexOf(s.day as typeof DAYS[number]) > DAYS.indexOf(today);
        })
        .sort((a, b) => {
            const dayDiff = DAYS.indexOf(a.day as typeof DAYS[number]) - DAYS.indexOf(b.day as typeof DAYS[number]);
            return dayDiff || a.startTime.localeCompare(b.startTime);
        })
        .slice(0, 2);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-family-display)", fontSize: "28px", fontWeight: 800 }}>Timetable</h1>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>{timetable.name}</p>
                </div>
                <button className="btn-glow" onClick={() => setShowModal(true)}>+ Add Slot</button>
            </div>

            {/* Upcoming classes */}
            {upcoming.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "var(--color-accent-cyan)" }}>
                        ⏰ Upcoming Classes
                    </h3>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {upcoming.map((s) => (
                            <div key={s.id} className="glass-card" style={{ padding: "16px 20px", minWidth: "200px" }}>
                                <div style={{ fontWeight: 600, fontSize: "15px" }}>{s.subject}</div>
                                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                                    {DAY_LABELS[s.day]} · {s.startTime} - {s.endTime}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timetable grid */}
            <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: "800px" }}>
                    {/* Header row */}
                    <div style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
                        <div />
                        {DAYS.map((day) => (
                            <div key={day} style={{
                                padding: "12px", textAlign: "center", borderRadius: "8px",
                                fontSize: "13px", fontWeight: 600,
                                background: day === today ? "rgba(0,245,255,0.1)" : "var(--color-bg-glass)",
                                color: day === today ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
                                border: day === today ? "1px solid rgba(0,245,255,0.2)" : "1px solid transparent",
                            }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Time rows */}
                    {HOURS.map((hour) => (
                        <div key={hour} style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
                            <div style={{
                                padding: "12px 8px", fontSize: "12px", color: "var(--color-text-muted)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                            </div>
                            {DAYS.map((day) => {
                                const slot = getSlotForDayHour(day, hour);
                                return (
                                    <div key={`${day}-${hour}`} style={{
                                        padding: slot ? "10px" : "12px",
                                        borderRadius: "8px",
                                        minHeight: "50px",
                                        background: slot
                                            ? slot.isBreak
                                                ? "rgba(245,158,11,0.08)"
                                                : "rgba(0,245,255,0.06)"
                                            : "var(--color-bg-glass)",
                                        border: `1px solid ${slot ? (slot.isBreak ? "rgba(245,158,11,0.2)" : "rgba(0,245,255,0.15)") : "var(--color-border)"}`,
                                        cursor: slot ? "pointer" : "default",
                                        position: "relative",
                                    }}>
                                        {slot && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <div style={{ fontSize: "12px", fontWeight: 600, color: slot.isBreak ? "var(--color-accent-orange)" : "var(--color-accent-cyan)" }}>
                                                    {slot.isBreak ? "☕ Break" : slot.subject}
                                                </div>
                                                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                                    {slot.startTime} - {slot.endTime}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteSlotMutation.mutate({ timetableId: timetable.id, slotId: slot.id }); }}
                                                    style={{
                                                        position: "absolute", top: "4px", right: "4px",
                                                        background: "none", border: "none", color: "var(--color-text-muted)",
                                                        cursor: "pointer", fontSize: "10px", opacity: 0.5,
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Slot Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontFamily: "var(--font-family-display)", fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>
                            Add Time Slot
                        </h2>
                        <form onSubmit={(e) => { e.preventDefault(); addSlotMutation.mutate(timetable.id); }}
                            style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>Day</label>
                                <select className="input-field" value={slotForm.day} onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}>
                                    {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
                                </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>Start</label>
                                    <input type="time" className="input-field" value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>End</label>
                                    <input type="time" className="input-field" value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                                    <input type="checkbox" checked={slotForm.isBreak} onChange={(e) => setSlotForm({ ...slotForm, isBreak: e.target.checked })} />
                                    This is a break
                                </label>
                            </div>
                            {!slotForm.isBreak && (
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "6px" }}>Subject</label>
                                    <input className="input-field" placeholder="e.g. Data Structures" value={slotForm.subject} onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })} required={!slotForm.isBreak} />
                                </div>
                            )}
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="submit" className="btn-glow" style={{ flex: 1 }} disabled={addSlotMutation.isPending}>
                                    {addSlotMutation.isPending ? "Adding..." : "Add Slot"}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
