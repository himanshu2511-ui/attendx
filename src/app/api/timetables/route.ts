import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

// List timetables
export async function GET() {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const timetables = await prisma.timetable.findMany({
            where: { userId: user.userId },
            include: {
                slots: {
                    include: { classroom: { select: { name: true, subject: true } } },
                    orderBy: [{ day: "asc" }, { startTime: "asc" }],
                },
            },
        });

        return NextResponse.json({ timetables });
    } catch (error) {
        console.error("Get timetables error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Create timetable
export async function POST(request: Request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name, slots } = await request.json();

        const timetable = await prisma.timetable.create({
            data: {
                userId: user.userId,
                name: name || "My Timetable",
                slots: slots
                    ? {
                        create: slots.map((s: { day: string; startTime: string; endTime: string; subject: string; classroomId?: string; isBreak?: boolean; breakDuration?: number }) => ({
                            day: s.day,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            subject: s.subject,
                            classroomId: s.classroomId || null,
                            isBreak: s.isBreak || false,
                            breakDuration: s.breakDuration || null,
                        })),
                    }
                    : undefined,
            },
            include: { slots: true },
        });

        return NextResponse.json({ timetable }, { status: 201 });
    } catch (error) {
        console.error("Create timetable error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
