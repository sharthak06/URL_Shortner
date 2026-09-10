
import { AppError } from "../../utils/Errors/AppError.js";
import {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./auth.helper.js";
import { IAuthRepository } from "./auth.interface.js";
import { toUserResponse } from "./auth.response.js";
import { LoginUserInputType, RegisterUserInputType } from "./auth.schema.js";
import { JwtPayloadType } from "./auth.types.js";

export class AuthService {
  constructor(private readonly authRepo: IAuthRepository) {}

  async registerUserService(data: RegisterUserInputType) {
    const existingUser = await this.authRepo.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError("User Already Exists", 400);
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await this.authRepo.createUser({
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
    });

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    return {
      accessToken,
      refreshToken,
      user: toUserResponse(user),
    };
  }

  async loginUserService(data: LoginUserInputType) {
    const user = await this.authRepo.findUserByEmail(data.email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    return {
      accessToken,
      refreshToken,
      user: toUserResponse(user),
    };
  }

  async getLoggedInUser(userId: string) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new AppError("User not Found", 404);
    }
    return toUserResponse(user);
  }

  async refreshAccessTokenService(refreshToken?: string) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    let decoded: JwtPayloadType;
    try {
      decoded = verifyRefreshToken(refreshToken) as JwtPayloadType;
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await this.authRepo.findUserById(decoded.userId);
    if (!user) {
      throw new AppError("User not Found", 404);
    }

    const accessToken = signAccessToken({ userId: user.id });

    return {
      accessToken,
    };
  }
}
