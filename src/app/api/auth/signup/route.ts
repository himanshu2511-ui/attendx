import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { signupSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = signupSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Invalid input" },
                { status: 400 }
            );
        }

        const { name, password, role, rollNo } = parsed.data;
        const username = parsed.data.username.toLowerCase();
        const email = parsed.data.email.toLowerCase();

        // Check existing
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });

        if (existing) {
            return NextResponse.json(
                { error: existing.email === email ? "Email already in use" : "Username already taken" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                username,
                email,
                passwordHash,
                role,
                rollNo: role === "STUDENT" ? rollNo : null,
            },
        });

        const token = await signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            username: user.username,
        });

        const response = NextResponse.json(
            {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    rollNo: user.rollNo,
                },
            },
            { status: 201 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
