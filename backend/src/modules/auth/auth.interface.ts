import { RegisterUserType } from "./auth.types.js";
import { User } from "@prisma/client";

export interface IAuthRepository {
  findUserById(id: string): Promise<User | null>;

  findUserByEmail(email: string): Promise<User | null>;

  createUser(data: RegisterUserType): Promise<User>;
}

