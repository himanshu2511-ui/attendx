import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .refine((val) => /^[a-zA-Z0-9_]+$/.test(val), {
            message: "Username can only contain letters, numbers, and underscores",
        }),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number"),
    role: z.enum(["STUDENT", "EDUCATOR"]),
    rollNo: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const createClassroomSchema = z.object({
    name: z.string().min(2, "Classroom name must be at least 2 characters"),
    subject: z.string().min(2, "Subject must be at least 2 characters"),
});

export const createTimetableSchema = z.object({
    name: z.string().optional(),
});

export const createSlotSchema = z.object({
    day: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM"),
    subject: z.string().min(1),
    classroomId: z.string().optional(),
    isBreak: z.boolean().optional(),
    breakDuration: z.number().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
export type CreateSlotInput = z.infer<typeof createSlotSchema>;
