import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Get session details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        const session = await prisma.liveSession.findUnique({
            where: { id },
            include: {
                classroom: {
                    select: { name: true, subject: true, classCode: true, educatorId: true },
                },
                attendees: {
                    include: {
                        student: { select: { id: true, name: true, username: true, rollNo: true } },
                    },
                },
                _count: { select: { attendees: true, attendances: true } },
            },
        });

        if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ session });
    } catch (error) {
        console.error("Get session error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Update session (end, cancel, open/close portal, admit)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { action, studentId, portalDuration } = body;

        const session = await prisma.liveSession.findUnique({
            where: { id },
            include: { classroom: true },
        });
        if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

        switch (action) {
            case "end": {
                if (session.classroom.educatorId !== user.userId)
                    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

                const updated = await prisma.liveSession.update({
                    where: { id },
                    data: { status: "ENDED", endTime: new Date(), portalOpen: false },
                });
                // Mark all non-called attendees as ABSENT
                await prisma.liveAttendee.updateMany({
                    where: { liveSessionId: id, attendanceStatus: "PENDING" },
                    data: { attendanceStatus: "ABSENT" },
                });

                // Create Attendance records for ALL enrolled students in this classroom
                const enrolled = await prisma.classroomStudent.findMany({
                    where: { classroomId: session.classroomId, status: "APPROVED" },
                    select: { studentId: true },
                });

                // Find who was PRESENT (called attendance)
                const presentAttendees = await prisma.liveAttendee.findMany({
                    where: { liveSessionId: id, attendanceStatus: "PRESENT" },
                    select: { studentId: true },
                });
                const presentIds = new Set(presentAttendees.map((a) => a.studentId));

                // Upsert attendance for every enrolled student
                for (const enrollment of enrolled) {
                    const status = presentIds.has(enrollment.studentId) ? "PRESENT" : "ABSENT";
                    await prisma.attendance.upsert({
                        where: { liveSessionId_studentId: { liveSessionId: id, studentId: enrollment.studentId } },
                        create: { liveSessionId: id, studentId: enrollment.studentId, status },
                        update: { status, markedAt: new Date() },
                    });
                }

                return NextResponse.json({ session: updated });
            }

            case "cancel": {
                if (session.classroom.educatorId !== user.userId)
                    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

                const updated = await prisma.liveSession.update({
                    where: { id },
                    data: { status: "CANCELLED", endTime: new Date(), portalOpen: false },
                });
                return NextResponse.json({ session: updated });
            }

            case "open-portal": {
                if (session.classroom.educatorId !== user.userId)
                    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

                const duration = portalDuration || session.portalDuration;
                const closeTime = new Date(Date.now() + duration * 60 * 1000);

                const updated = await prisma.liveSession.update({
                    where: { id },
                    data: { portalOpen: true, portalDuration: duration, portalCloseTime: closeTime },
                });
                return NextResponse.json({ session: updated });
            }

            case "close-portal": {
                if (session.classroom.educatorId !== user.userId)
                    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

                const updated = await prisma.liveSession.update({
                    where: { id },
                    data: { portalOpen: false },
                });
                return NextResponse.json({ session: updated });
            }

            case "join": {
                if (user.role !== "STUDENT")
                    return NextResponse.json({ error: "Students only" }, { status: 403 });

                const attendee = await prisma.liveAttendee.upsert({
                    where: { liveSessionId_studentId: { liveSessionId: id, studentId: user.userId } },
                    create: { liveSessionId: id, studentId: user.userId },
                    update: {},
                });
                return NextResponse.json({ attendee });
            }

            case "admit": {
                if (session.classroom.educatorId !== user.userId)
                    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

                if (studentId === "all") {
                    await prisma.liveAttendee.updateMany({
                        where: { liveSessionId: id, admittedAt: null },
                        data: { admittedAt: new Date() },
                    });
                    const count = await prisma.liveAttendee.count({
                        where: { liveSessionId: id, admittedAt: { not: null } },
                    });
                    await prisma.liveSession.update({
                        where: { id },
                        data: { admittedCount: count },
                    });
                    return NextResponse.json({ admitted: "all", count });
                } else {
                    await prisma.liveAttendee.update({
                        where: { liveSessionId_studentId: { liveSessionId: id, studentId } },
                        data: { admittedAt: new Date() },
                    });
                    await prisma.liveSession.update({
                        where: { id },
                        data: { admittedCount: { increment: 1 } },
                    });
                    return NextResponse.json({ admitted: studentId });
                }
            }

            case "call-attendance": {
                if (user.role !== "STUDENT")
                    return NextResponse.json({ error: "Students only" }, { status: 403 });

                if (!session.portalOpen)
                    return NextResponse.json({ error: "Portal is closed" }, { status: 400 });

                if (session.portalCloseTime && new Date() > session.portalCloseTime)
                    return NextResponse.json({ error: "Portal has expired" }, { status: 400 });

                const attendee = await prisma.liveAttendee.findUnique({
                    where: { liveSessionId_studentId: { liveSessionId: id, studentId: user.userId } },
                });

                if (!attendee || !attendee.admittedAt)
                    return NextResponse.json({ error: "Not admitted to session" }, { status: 403 });

                if (attendee.attendanceCalled)
                    return NextResponse.json({ error: "Already called" }, { status: 409 });

                await prisma.liveAttendee.update({
                    where: { id: attendee.id },
                    data: { attendanceCalled: true, calledAt: new Date(), attendanceStatus: "PRESENT" },
                });

                await prisma.attendance.upsert({
                    where: { liveSessionId_studentId: { liveSessionId: id, studentId: user.userId } },
                    create: { liveSessionId: id, studentId: user.userId, status: "PRESENT" },
                    update: { status: "PRESENT", markedAt: new Date() },
                });

                return NextResponse.json({ status: "PRESENT" });
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Update session error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
