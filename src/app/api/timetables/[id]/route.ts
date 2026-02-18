import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

// Add slot to timetable
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        const timetable = await prisma.timetable.findFirst({
            where: { id, userId: user.userId },
        });
        if (!timetable) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const body = await request.json();
        const { day, startTime, endTime, subject, classroomId, isBreak, breakDuration } = body;

        const slot = await prisma.timetableSlot.create({
            data: {
                timetableId: id,
                day,
                startTime,
                endTime,
                subject,
                classroomId: classroomId || null,
                isBreak: isBreak || false,
                breakDuration: breakDuration || null,
            },
        });

        return NextResponse.json({ slot }, { status: 201 });
    } catch (error) {
        console.error("Add slot error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Delete slot
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { slotId } = await request.json();

        const timetable = await prisma.timetable.findFirst({
            where: { id, userId: user.userId },
        });
        if (!timetable) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.timetableSlot.delete({ where: { id: slotId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete slot error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
