import { prisma } from "../../lib/prisma.js";
import { IAuthRepository } from "./auth.interface.js";
import {
  RegisterUserType,
  CreateHashedTokenType,
} from "./auth.types.js";
import { User, EmailVerificationToken } from "@prisma/client";

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

    async markEmailVerified(userId: string): Promise<User> {
        return await prisma.user.update({
            where: { id: userId },
            data: { emailVerified: true },
        });
    }

    async updateUserPassword(userId: string, passwordHash: string): Promise<User> {
        return await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }

    // Replaces the user's verification tokens with a single new one. The delete + create
    // alone isn't enough even in a transaction: under READ COMMITTED a concurrent call's
    // deleteMany can't see a token inserted by another in-flight call, so both inserts
    // survive. Locking the user row first serializes concurrent issues per user, so the
    // second call's deleteMany runs after the first commits and removes its token.
    async issueEmailVerificationToken(
        data: CreateHashedTokenType
    ): Promise<EmailVerificationToken> {
        return await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM "users" WHERE id = ${data.userId} FOR UPDATE`;
            await tx.emailVerificationToken.deleteMany({ where: { userId: data.userId } });
            return await tx.emailVerificationToken.create({
                data,
            });
        });
    }

    async findEmailVerificationTokenByHash(tokenHash: string) {
        return await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    }

    async consumeEmailVerificationToken(id: string): Promise<void> {
        await prisma.emailVerificationToken.update({
            where: { id },
            data: { consumedAt: new Date() },
        });
    }

    async createPasswordResetToken(data: CreateHashedTokenType) {
        return await prisma.passwordResetToken.create({ data });
    }

    async findPasswordResetTokenByHash(tokenHash: string) {
        return await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    }

    // Claims the token and sets the new password in one transaction. The claim is a
    // conditional update (only matches an unconsumed, unexpired row), so of two
    // concurrent requests with the same token exactly one sees count === 1; the other
    // blocks on the row lock, then matches nothing and gets false back. If the password
    // update fails, the claim rolls back and the token stays usable.
    async claimPasswordResetTokenAndUpdatePassword(
        tokenId: string,
        userId: string,
        passwordHash: string
    ): Promise<boolean> {
        return await prisma.$transaction(async (tx) => {
            const { count } = await tx.passwordResetToken.updateMany({
                where: { id: tokenId, consumedAt: null, expiresAt: { gt: new Date() } },
                data: { consumedAt: new Date() },
            });
            if (count !== 1) {
                return false;
            }

            await tx.user.update({
                where: { id: userId },
                data: { passwordHash },
            });
            return true;
        });
    }

    async deletePasswordResetTokensForUser(userId: string): Promise<void> {
        await prisma.passwordResetToken.deleteMany({ where: { userId } });
    }
}
