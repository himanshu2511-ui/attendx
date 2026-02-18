import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Create a live session
export async function POST(request: Request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (user.role !== "EDUCATOR") return NextResponse.json({ error: "Educators only" }, { status: 403 });

        const { classroomId, portalDuration } = await request.json();

        const classroom = await prisma.classroom.findFirst({
            where: { id: classroomId, educatorId: user.userId },
        });
        if (!classroom) return NextResponse.json({ error: "Not your classroom" }, { status: 403 });

        // End any existing live sessions
        await prisma.liveSession.updateMany({
            where: { classroomId, status: "LIVE" },
            data: { status: "ENDED", endTime: new Date() },
        });

        const session = await prisma.liveSession.create({
            data: {
                classroomId,
                status: "LIVE",
                portalDuration: portalDuration || 5,
                startTime: new Date(),
            },
            include: { classroom: { select: { name: true, subject: true } } },
        });

        return NextResponse.json({ session }, { status: 201 });
    } catch (error) {
        console.error("Create live session error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// List live sessions
export async function GET(request: Request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const classroomId = searchParams.get("classroomId");

        const where: Record<string, unknown> = {};
        if (classroomId) where.classroomId = classroomId;

        if (user.role === "EDUCATOR") {
            where.classroom = { educatorId: user.userId };
        } else {
            where.classroom = {
                students: { some: { studentId: user.userId, status: "APPROVED" } },
            };
        }

        const sessions = await prisma.liveSession.findMany({
            where,
            include: {
                classroom: { select: { name: true, subject: true, classCode: true } },
                _count: { select: { attendees: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("Get live sessions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
