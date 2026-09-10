import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export { authRepository, authService, authController };
