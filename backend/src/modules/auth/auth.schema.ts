
import { z } from "zod";

export const registerUserSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long").trim().toLowerCase(),
    email: z.email("Invalid email address").trim().toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters long").trim()
}).strict();

export const loginUserSchema = z.object({
    email: z.email("Invalid email address").trim().toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters long").trim()
}).strict();

export type RegisterUserInputType = z.infer<typeof registerUserSchema>;
export type LoginUserInputType = z.infer<typeof loginUserSchema>;
