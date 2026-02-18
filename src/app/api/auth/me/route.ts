import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET() {
    try {
        const payload = await getUser();

        if (!payload) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                role: true,
                rollNo: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({ user });
    } catch {
        return NextResponse.json({ user: null }, { status: 401 });
    }
}
