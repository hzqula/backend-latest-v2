import { UserRole } from "../../prisma/app/generated/prisma/client";
import {
  RegisterEmailDto,
  VerifyOtpDto,
  RegisterUserDto,
  LoginDto,
} from "../dtos/auth.dto";
import { UserRepository } from "../repositories/user.repository";
import { OtpRepository } from "../repositories/otp.repository";
import { SecurityLogRepository } from "../repositories/security-log.repository";
import { StudentService } from "./student.service";
import { LecturerService } from "./lecturer.service";
import { EmailService } from "./email.service";
import { CloudinaryService } from "../services/cloudinary.service";
import { RecaptchaService } from "../utils/recaptcha";
import { HttpError } from "../utils/error";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env";
import { prisma } from "../configs/prisma";

export class AuthService {
  private userRepository: UserRepository;
  private otpRepository: OtpRepository;
  private securityLogRepository: SecurityLogRepository;
  private studentService: StudentService;
  private lecturerService: LecturerService;
  private emailService: EmailService;
  private cloudinaryService: CloudinaryService;
  private recaptchaService: RecaptchaService;

  constructor() {
    this.userRepository = new UserRepository();
    this.otpRepository = new OtpRepository();
    this.securityLogRepository = new SecurityLogRepository();
    this.studentService = new StudentService();
    this.lecturerService = new LecturerService();
    this.emailService = new EmailService();
    this.cloudinaryService = new CloudinaryService();
    this.recaptchaService = new RecaptchaService();
  }

  public async registerEmail(
    dto: RegisterEmailDto,
    ipAddress: string,
    device: string
  ): Promise<string> {
    const { email } = dto;

    // Periksa apakah email sudah terdaftar dengan profil lengkap dan diverifikasi
    const existingUser = await this.userRepository.findByEmail(email);
    if (
      existingUser &&
      existingUser.isVerify &&
      (existingUser.studentId || existingUser.lecturerId)
    ) {
      await this.securityLogRepository.create({
        user: { connect: { id: existingUser.id } },
        action: "REGISTER_EMAIL_FAILED",
        ipAddress,
        device,
        createdAt: new Date(),
      });
      throw new HttpError(400, "Email sudah terdaftar dan diverifikasi");
    }

    // Jika email ada tetapi belum diverifikasi atau belum memiliki profil, hapus OTP lama
    if (existingUser) {
      await this.otpRepository.deleteByEmail(email);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit kadaluarsa

    await this.otpRepository.create({
      code: otpCode,
      email,
      expiresAt,
    });

    console.log(otpCode);

    try {
      await this.emailService.sendOtpEmail(email, otpCode);
      await this.securityLogRepository.create({
        user: existingUser ? { connect: { id: existingUser.id } } : undefined,
        action: "REGISTER_EMAIL_SUCCESS",
        ipAddress,
        device,
        createdAt: new Date(),
      });
      return "OTP telah dikirim ke email";
    } catch (error) {
      await this.securityLogRepository.create({
        user: existingUser ? { connect: { id: existingUser.id } } : undefined,
        action: "REGISTER_EMAIL_FAILED",
        ipAddress,
        device,
        createdAt: new Date(),
      });
      throw this.handleEmailError(error);
    }
  }

  public async verifyOtp(dto: VerifyOtpDto): Promise<string> {
    const { email, code } = dto;

    const otp = await this.otpRepository.findByEmailAndCode(email, code);
    if (!otp || otp.expiresAt < new Date()) {
      throw new HttpError(400, "OTP tidak valid atau telah kadaluarsa");
    }

    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      user = await this.userRepository.create({
        email,
        password: "", // Sementara, akan diperbarui di registerUser
        role: email.endsWith("@student.unri.ac.id")
          ? UserRole.STUDENT
          : UserRole.LECTURER,
        isVerify: true,
      });
    } else if (!user.isVerify) {
      await this.userRepository.update(user.id, { isVerify: true });
    }

    await this.otpRepository.deleteByEmail(email);
    return "OTP berhasil diverifikasi";
  }

  public async registerUser(
    dto: RegisterUserDto,
    file?: Express.Multer.File,
    ipAddress?: string,
    device?: string
  ): Promise<any> {
    const { email, password, name, nim, nip, phoneNumber } = dto;

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isVerify) {
      await this.securityLogRepository.create({
        user: user ? { connect: { id: user.id } } : undefined,
        action: "REGISTER_USER_FAILED",
        ipAddress: ipAddress || "unknown",
        device: device || "unknown",
        createdAt: new Date(),
      });
      throw new HttpError(400, "Email belum diverifikasi");
    }

    // Periksa apakah email sudah terkait dengan studentId atau lecturerId
    if (user.studentId || user.lecturerId) {
      await this.securityLogRepository.create({
        user: { connect: { id: user.id } },
        action: "REGISTER_USER_FAILED",
        ipAddress: ipAddress || "unknown",
        device: device || "unknown",
        createdAt: new Date(),
      });
      throw new HttpError(400, "Email sudah terkait dengan akun lain");
    }

    let profilePictureUrl: string | undefined;
    if (file) {
      const publicId = `${user.role.toLowerCase()}/${email.split("@")[0]}`;
      profilePictureUrl = await this.cloudinaryService.uploadImage(
        file.buffer,
        user.role.toLowerCase(),
        publicId
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userRepository.update(user.id, { password: hashedPassword });

    if (user.role === UserRole.STUDENT) {
      if (!nim) {
        throw new HttpError(400, "NIM diperlukan untuk mahasiswa");
      }
      const semester = this.calculateSemester(nim);
      await this.studentService.createStudent({
        nim,
        name,
        phoneNumber,
        profilePicture: profilePictureUrl,
        userId: user.id,
      });
    } else {
      if (!nip) {
        throw new HttpError(400, "NIP diperlukan untuk dosen");
      }
      await this.lecturerService.createLecturer({
        nip,
        name,
        phoneNumber,
        profilePicture: profilePictureUrl,
        userId: user.id,
      });
    }

    await this.securityLogRepository.create({
      user: { connect: { id: user.id } },
      action: "REGISTER_USER_SUCCESS",
      ipAddress: ipAddress || "unknown",
      device: device || "unknown",
      createdAt: new Date(),
    });

    return {
      id: user.id,
      email,
      role: user.role,
      name,
      profilePicture: profilePictureUrl,
    };
  }

  public async login(
    dto: LoginDto,
    ipAddress: string,
    device: string
  ): Promise<{ token: string; user: any }> {
    const { email, password, recaptchaToken } = dto;

    // Validasi reCAPTCHA
    const isRecaptchaValid =
      await this.recaptchaService.verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      throw new HttpError(400, "Verifikasi reCAPTCHA gagal");
    }

    // Cari pengguna berdasarkan email
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isVerify) {
      await this.securityLogRepository.create({
        user: user ? { connect: { id: user.id } } : undefined,
        action: "LOGIN_FAILED",
        ipAddress,
        device,
        createdAt: new Date(),
      });
      throw new HttpError(401, "Email atau kata sandi tidak valid");
    }

    // Pengecualian untuk email koordinator
    if (email.endsWith("@eng.unri.ac.id")) {
      if (user.role !== UserRole.COORDINATOR || !user.coordinatorId) {
        await this.securityLogRepository.create({
          user: { connect: { id: user.id } },
          action: "LOGIN_FAILED",
          ipAddress,
          device,
          createdAt: new Date(),
        });
        throw new HttpError(
          403,
          "Email hanya dapat digunakan untuk akun koordinator"
        );
      }
    } else if (user.role === UserRole.COORDINATOR) {
      await this.securityLogRepository.create({
        user: { connect: { id: user.id } },
        action: "LOGIN_FAILED",
        ipAddress,
        device,
        createdAt: new Date(),
      });
      throw new HttpError(
        403,
        "Akun koordinator hanya dapat menggunakan email dengan domain @eng.unri.ac.id"
      );
    }

    // Validasi kata sandi
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.securityLogRepository.create({
        user: { connect: { id: user.id } },
        action: "LOGIN_FAILED",
        ipAddress,
        device,
        createdAt: new Date(),
      });
      throw new HttpError(401, "Email atau kata sandi tidak valid");
    }

    // Buat JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET || "secret",
      {
        expiresIn: "1h",
      }
    );

    // Catat aktivitas login ke SecurityLog
    await this.securityLogRepository.create({
      user: { connect: { id: user.id } },
      action: "LOGIN",
      ipAddress,
      device,
      createdAt: new Date(),
    });

    // Ambil informasi profil berdasarkan role
    let profile = null;
    if (user.role === UserRole.STUDENT && user.studentId) {
      profile = await this.studentService.getById(user.studentId);
    } else if (user.role === UserRole.LECTURER && user.lecturerId) {
      profile = await this.lecturerService.getById(user.lecturerId);
    } else if (user.role === UserRole.COORDINATOR && user.coordinatorId) {
      profile = await prisma.coordinator.findUnique({
        where: { id: user.coordinatorId },
      });
    }

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: profile
          ? { name: profile.name, profilePicture: profile.profilePicture }
          : null,
      },
    };
  }

  public async verifyToken(token: string): Promise<any> {
    try {
      // Konversi ke unknown terlebih dahulu untuk menghindari error TypeScript
      const payload = jwt.verify(token, JWT_SECRET || "secret") as unknown;

      // Validasi bahwa payload adalah objek dengan properti yang diharapkan
      if (
        typeof payload !== "object" ||
        !payload ||
        !("id" in payload) ||
        !("email" in payload) ||
        !("role" in payload)
      ) {
        throw new HttpError(401, "Token tidak valid");
      }

      // Type assertion ke tipe yang diinginkan setelah validasi
      const { id, email, role } = payload as {
        id: number;
        email: string;
        role: UserRole;
      };

      const user = await this.userRepository.findById(id);
      if (!user || user.email !== email || user.role !== role) {
        throw new HttpError(401, "Token tidak valid");
      }

      // Ambil informasi profil berdasarkan role
      let profile = null;
      if (user.role === UserRole.STUDENT && user.studentId) {
        profile = await this.studentService.getById(user.studentId);
      } else if (user.role === UserRole.LECTURER && user.lecturerId) {
        profile = await this.lecturerService.getById(user.lecturerId);
      } else if (user.role === UserRole.COORDINATOR && user.coordinatorId) {
        profile = await prisma.coordinator.findUnique({
          where: { id: user.coordinatorId },
        });
      }

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: profile
            ? {
                name: profile.name,
                profilePicture: profile.profilePicture,
                ...(user.role === UserRole.STUDENT && { nim: profile.nim }),
                ...(user.role === UserRole.LECTURER && { nip: profile.nip }),
              }
            : null,
        },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new HttpError(401, "Token telah kedaluwarsa");
      }
      throw new HttpError(401, "Token tidak valid");
    }
  }

  private calculateSemester(nim: string): number {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const entryYear = parseInt(nim.slice(0, 2), 10);
    const yearDiff = currentYear - entryYear;

    const isOddSemester = currentDate.getMonth() >= 6;
    return isOddSemester ? yearDiff * 2 + 1 : yearDiff * 2;
  }

  private handleEmailError(error: unknown): HttpError {
    console.error("Error mengirim email OTP:", error);
    if (error instanceof Error) {
      if (error.message.includes("authentication")) {
        return new HttpError(
          500,
          "Gagal mengirim OTP: Kesalahan otentikasi SMTP"
        );
      }
      if (error.message.includes("connection")) {
        return new HttpError(
          500,
          "Gagal mengirim OTP: Masalah koneksi ke server SMTP"
        );
      }
    }
    return new HttpError(500, "Gagal mengirim OTP: Terjadi kesalahan server");
  }
}
