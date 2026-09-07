import { UserResponseType } from "./auth.types.js";

export const toUserResponse = (user: UserResponseType) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
