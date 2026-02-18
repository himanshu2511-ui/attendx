import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

// GET attendance summary
export async function GET() {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (user.role === "EDUCATOR") {
            return getEducatorAttendance(user.userId);
        } else {
            return getStudentAttendance(user.userId);
        }
    } catch (error) {
        console.error("Get attendance error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

async function getStudentAttendance(userId: string) {
    const attendances = await prisma.attendance.findMany({
        where: { studentId: userId },
        include: {
            liveSession: {
                include: {
                    classroom: { select: { id: true, name: true, subject: true } },
                },
            },
        },
        orderBy: { markedAt: "desc" },
    });

    const subjectStats: Record<string, { total: number; present: number; subject: string; classroomName: string }> = {};

    for (const a of attendances) {
        const key = a.liveSession.classroom.subject;
        if (!subjectStats[key]) {
            subjectStats[key] = {
                total: 0,
                present: 0,
                subject: a.liveSession.classroom.subject,
                classroomName: a.liveSession.classroom.name,
            };
        }
        subjectStats[key].total++;
        if (a.status === "PRESENT") subjectStats[key].present++;
    }

    const summary = Object.values(subjectStats).map((s) => ({
        ...s,
        percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    const overall = {
        total: attendances.length,
        present: attendances.filter((a) => a.status === "PRESENT").length,
        percentage:
            attendances.length > 0
                ? Math.round(
                    (attendances.filter((a) => a.status === "PRESENT").length / attendances.length) * 100
                )
                : 0,
    };

    return NextResponse.json({ summary, overall, records: attendances });
}

async function getEducatorAttendance(userId: string) {
    // Get all ended sessions for this educator's classrooms
    const sessions = await prisma.liveSession.findMany({
        where: {
            status: "ENDED",
            classroom: { educatorId: userId },
        },
        include: {
            classroom: {
                select: { id: true, name: true, subject: true },
            },
            attendances: {
                include: {
                    student: { select: { id: true, name: true, username: true, rollNo: true } },
                },
            },
            attendees: {
                include: {
                    student: { select: { id: true, name: true, username: true, rollNo: true } },
                },
            },
        },
        orderBy: { startTime: "desc" },
        take: 50,
    });

    // Build per-session attendance data
    const sessionHistory = [];

    for (const session of sessions) {
        // Get all enrolled students for this classroom
        const enrolled = await prisma.classroomStudent.findMany({
            where: { classroomId: session.classroomId, status: "APPROVED" },
            include: {
                student: { select: { id: true, name: true, username: true, rollNo: true } },
            },
        });

        // Build a map of who was PRESENT using both data sources:
        // 1. Attendance records (canonical, from new "end" flow)
        // 2. LiveAttendee attendanceStatus (fallback for older sessions)
        const presentSet = new Set<string>();

        // Source 1: Attendance model
        for (const a of session.attendances) {
            if (a.status === "PRESENT") presentSet.add(a.student.id);
        }

        // Source 2: LiveAttendee (fallback — covers old sessions without Attendance records)
        for (const a of session.attendees) {
            if (a.attendanceStatus === "PRESENT") presentSet.add(a.student.id);
        }

        // Map ALL enrolled students
        const studentList = enrolled.map((e) => ({
            id: e.student.id,
            name: e.student.name,
            username: e.student.username,
            rollNo: e.student.rollNo,
            status: presentSet.has(e.student.id) ? "PRESENT" : "ABSENT",
        }));

        const presentCount = studentList.filter((s) => s.status === "PRESENT").length;

        sessionHistory.push({
            id: session.id,
            date: session.startTime,
            classroomId: session.classroom.id,
            classroomName: session.classroom.name,
            subject: session.classroom.subject,
            totalStudents: enrolled.length,
            presentCount,
            absentCount: enrolled.length - presentCount,
            students: studentList,
        });
    }

    // Aggregate stats
    const totalClasses = sessions.length;
    const classroomSet = new Set(sessions.map((s) => s.classroomId));
    const totalClassrooms = classroomSet.size;

    return NextResponse.json({
        sessionHistory,
        stats: {
            totalClasses,
            totalClassrooms,
        },
    });
}
