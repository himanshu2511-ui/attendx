import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";

        if (!query || query.length < 2) {
            return NextResponse.json({ classrooms: [] });
        }

        const classrooms = await prisma.classroom.findMany({
            where: {
                OR: [
                    { classCode: { contains: query } },
                    { name: { contains: query } },
                    { subject: { contains: query } },
                ],
            },
            include: {
                educator: { select: { name: true, username: true } },
                _count: { select: { students: { where: { status: "APPROVED" } } } },
            },
            take: 10,
        });

        return NextResponse.json({ classrooms });
    } catch (error) {
        console.error("Search classrooms error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
