import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { createClassroomSchema } from "@/lib/validations";
import { nanoid } from "nanoid";
import QRCode from "qrcode";

export async function GET() {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        let classrooms;
        if (user.role === "EDUCATOR") {
            classrooms = await prisma.classroom.findMany({
                where: { educatorId: user.userId },
                include: {
                    students: {
                        where: { status: "APPROVED" },
                        include: { student: { select: { id: true, name: true, username: true, rollNo: true } } },
                        orderBy: { joinedAt: "desc" },
                    },
                    _count: { select: { students: true, liveSessions: true } },
                },
                orderBy: { createdAt: "desc" },
            });
        } else {
            classrooms = await prisma.classroomStudent.findMany({
                where: { studentId: user.userId },
                include: {
                    classroom: {
                        include: {
                            educator: { select: { name: true, username: true } },
                            _count: { select: { students: true } },
                        },
                    },
                },
                orderBy: { classroom: { createdAt: "desc" } },
            });
        }

        return NextResponse.json({ classrooms });
    } catch (error) {
        console.error("Get classrooms error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (user.role !== "EDUCATOR") return NextResponse.json({ error: "Educators only" }, { status: 403 });

        const body = await request.json();
        const parsed = createClassroomSchema.safeParse(body);
        if (!parsed.success) {
            const validationError = parsed.error.issues[0]?.message ?? "Invalid input";
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        const classCode = nanoid(6).toUpperCase();
        const joinLink = `/join/${classCode}`;

        let qrCodeUrl: string | null = null;
        try {
            qrCodeUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${joinLink}`, {
                width: 256,
                margin: 2,
                color: { dark: "#00f5ff", light: "#0a0a0f" },
            });
        } catch { /* QR generation optional */ }

        const classroom = await prisma.classroom.create({
            data: {
                name: parsed.data.name,
                subject: parsed.data.subject,
                classCode,
                joinLink,
                qrCodeUrl,
                educatorId: user.userId,
            },
        });

        return NextResponse.json({ classroom }, { status: 201 });
    } catch (error) {
        console.error("Create classroom error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
