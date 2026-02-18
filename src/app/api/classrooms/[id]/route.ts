import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Join a classroom
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (user.role !== "STUDENT") return NextResponse.json({ error: "Students only" }, { status: 403 });

        const { id } = await params;

        const classroom = await prisma.classroom.findUnique({ where: { id } });
        if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

        const existing = await prisma.classroomStudent.findUnique({
            where: { classroomId_studentId: { classroomId: id, studentId: user.userId } },
        });

        if (existing) {
            return NextResponse.json(
                { error: `Already ${existing.status.toLowerCase()}` },
                { status: 409 }
            );
        }

        const enrollment = await prisma.classroomStudent.create({
            data: { classroomId: id, studentId: user.userId, status: "APPROVED", joinedAt: new Date() },
        });

        await prisma.classroom.update({
            where: { id },
            data: { studentCount: { increment: 1 } },
        });

        return NextResponse.json({ enrollment }, { status: 201 });
    } catch (error) {
        console.error("Join classroom error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Get classroom details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        const classroom = await prisma.classroom.findUnique({
            where: { id },
            include: {
                educator: { select: { name: true, username: true } },
                students: {
                    include: { student: { select: { id: true, name: true, username: true, rollNo: true } } },
                    orderBy: { joinedAt: "desc" },
                },
                _count: { select: { liveSessions: true } },
            },
        });

        if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ classroom });
    } catch (error) {
        console.error("Get classroom error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Approve/reject student
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (user.role !== "EDUCATOR") return NextResponse.json({ error: "Educators only" }, { status: 403 });

        const { id } = await params;
        const { studentId, status } = await request.json();

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const classroom = await prisma.classroom.findFirst({
            where: { id, educatorId: user.userId },
        });
        if (!classroom) return NextResponse.json({ error: "Not your classroom" }, { status: 403 });

        const updated = await prisma.classroomStudent.update({
            where: { classroomId_studentId: { classroomId: id, studentId } },
            data: {
                status,
                joinedAt: status === "APPROVED" ? new Date() : null,
            },
        });

        if (status === "APPROVED") {
            await prisma.classroom.update({
                where: { id },
                data: { studentCount: { increment: 1 } },
            });
        }

        return NextResponse.json({ enrollment: updated });
    } catch (error) {
        console.error("Approve student error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
