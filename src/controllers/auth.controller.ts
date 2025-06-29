import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import {
  RegisterEmailDto,
  VerifyOtpDto,
  RegisterUserDto,
  LoginDto,
} from "../dtos/auth.dto";
import { HttpError } from "../utils/error";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async registerEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const registerEmailDto: RegisterEmailDto = req.body;
      const message = await this.authService.registerEmail(
        registerEmailDto,
        req.ip || "unknown",
        (req.headers["user-agent"] as string) || "unknown"
      );
      res.status(200).json({ message });
    } catch (error) {
      next(error);
    }
  }

  public async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const verifyOtpDto: VerifyOtpDto = req.body;
      const message = await this.authService.verifyOtp(verifyOtpDto);
      res.status(200).json({ message });
    } catch (error) {
      next(error);
    }
  }

  public async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const registerUserDto: RegisterUserDto = req.body;
      const user = await this.authService.registerUser(
        registerUserDto,
        req.file
      );
      res.status(201).json({ message: "Pendaftaran pengguna berhasil", user });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const loginDto: LoginDto = req.body;
      const { token, user } = await this.authService.login(
        loginDto,
        req.ip || "unknown",
        (req.headers["user-agent"] as string) || "unknown"
      );
      res.status(200).json({ message: "Login berhasil", token, user });
    } catch (error) {
      next(error);
    }
  }
}
