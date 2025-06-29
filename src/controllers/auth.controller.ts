import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import {
  RegisterEmailSchema,
  VerifyOtpSchema,
  RegisterUserSchema,
  LoginSchema,
  RegisterEmailDto,
  VerifyOtpDto,
  RegisterUserDto,
  LoginDto,
} from "../dtos/auth.dto";
import { HttpError } from "../utils/error";
import { z } from "zod";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async registerEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const registerEmailDto = RegisterEmailSchema.parse(
        req.body
      ) as RegisterEmailDto;
      const message = await this.authService.registerEmail(
        registerEmailDto,
        req.ip || "unknown",
        req.headers["user-agent"] || "unknown"
      );
      res.status(200).json({ message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpError(
          400,
          "Validasi gagal: " + error.errors.map((e) => e.message).join(", ")
        );
      }
      next(error);
    }
  }

  public async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const verifyOtpDto = VerifyOtpSchema.parse(req.body) as VerifyOtpDto;
      const message = await this.authService.verifyOtp(verifyOtpDto);
      res.status(200).json({ message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpError(
          400,
          "Validasi gagal: " + error.errors.map((e) => e.message).join(", ")
        );
      }
      next(error);
    }
  }

  public async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const registerUserDto = RegisterUserSchema.parse(
        req.body
      ) as RegisterUserDto;
      const user = await this.authService.registerUser(
        registerUserDto,
        req.file,
        req.ip || "unknown",
        req.headers["user-agent"] || "unknown"
      );
      res.status(201).json({ message: "Pendaftaran pengguna berhasil", user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpError(
          400,
          "Validasi gagal: " + error.errors.map((e) => e.message).join(", ")
        );
      }
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const loginDto = LoginSchema.parse(req.body) as LoginDto;
      const { token, user } = await this.authService.login(
        loginDto,
        req.ip || "unknown",
        req.headers["user-agent"] || "unknown"
      );
      res.status(200).json({ message: "Login berhasil", token, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpError(
          400,
          "Validasi gagal: " + error.errors.map((e) => e.message).join(", ")
        );
      }
      next(error);
    }
  }

  public async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new HttpError(401, "Token tidak ditemukan");
      }
      const token = authHeader.split(" ")[1];
      const user = await this.authService.verifyToken(token);
      res.status(200).json({ message: "Token valid", user });
    } catch (error) {
      next(error);
    }
  }
}
