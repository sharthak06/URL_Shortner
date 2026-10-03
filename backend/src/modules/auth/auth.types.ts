export type RegisterUserType = {
  name: string;
  email: string;
  passwordHash: string;
};

export type LoginUserType = {
  email: string;
  password: string;
};

export type UserResponseType = {
  name: string;
  email: string;
  id: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type JwtPayloadType = {
  userId: string;
};

export type CreateHashedTokenType = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};
