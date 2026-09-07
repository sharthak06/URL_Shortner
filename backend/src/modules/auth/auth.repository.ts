import { prisma } from "../../lib/prisma.js";
import { IAuthRepository } from "./auth.interface.js";
import { RegisterUserType } from "./auth.types.js";
import { User } from "@prisma/client";

export class AuthRepository implements IAuthRepository {
    async findUserById(id: string): Promise<User | null> {
        return await prisma.user.findUnique({ where: { id } });
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return await prisma.user.findUnique({ where: { email } });
    }

    async createUser(data: RegisterUserType): Promise<User> {
        return await prisma.user.create({ data });
    }
}


