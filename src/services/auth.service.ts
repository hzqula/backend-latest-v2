import { UserRole } from "../../prisma/app/generated/prisma/client";
import { prisma } from "../configs/prisma";
import {
  RegisterEmailDto,
  VerifyOtpDto,
  RegisterUserDto,
} from "../dtos/auth.dto";
import { UserRepository } from "../repositories/user.repository";
import { OtpRepository } from "../repositories/otp.repository";
import { StudentService } from "./student.service";
import { LecturerService } from "./lecturer.service";
import { EmailService } from "./email.service";
import { CloudinaryService } from "./cloudinary.service";
import { HttpError } from "../utils/error";
import bcrypt from "bcrypt";

export class AuthService {
  private userRepository: UserRepository;
  private otpRepository: OtpRepository;
  private studentService: StudentService;
  private lecturerService: LecturerService;
  private emailService: EmailService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.userRepository = new UserRepository();
    this.otpRepository = new OtpRepository();
    this.studentService = new StudentService();
    this.lecturerService = new LecturerService();
    this.emailService = new EmailService();
    this.cloudinaryService = new CloudinaryService();
  }

  public async registerEmail(dto: RegisterEmailDto): Promise<string> {
    const { email } = dto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new HttpError(400, "Email sudah terdaftar");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit kadaluarsa

    await this.otpRepository.create({
      code: otpCode,
      email,
      expiresAt,
    });

    await this.emailService.sendOtpEmail(email, otpCode);
    return "OTP telah dikirim ke email";
  }

  public async verifyOtp(dto: VerifyOtpDto): Promise<string> {
    const { email, code } = dto;

    const otp = await this.otpRepository.findByEmailAndCode(email, code);
    if (!otp || otp.expiresAt < new Date()) {
      throw new HttpError(400, "OTP tidak valid atau telah kadaluarsa");
    }

    const user = await this.userRepository.create({
      email,
      password: "", // Sementara, akan diperbarui di registerUser
      role: email.endsWith("@student.unri.ac.id")
        ? UserRole.STUDENT
        : UserRole.LECTURER,
      isVerify: true,
    });

    await this.otpRepository.deleteByEmail(email);
    return "OTP berhasil diverifikasi";
  }

  public async registerUser(
    dto: RegisterUserDto,
    file?: Express.Multer.File
  ): Promise<any> {
    const { email, password, name, nim, nip, phoneNumber } = dto;

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isVerify) {
      throw new HttpError(400, "Email belum diverifikasi");
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

    return {
      id: user.id,
      email,
      role: user.role,
      name,
      profilePicture: profilePictureUrl,
    };
  }

  private calculateSemester(nim: string): number {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const entryYear = parseInt(nim.slice(0, 2), 10);
    const yearDiff = currentYear - entryYear;

    const isOddSemester = currentDate.getMonth() >= 6;
    return isOddSemester ? yearDiff * 2 + 1 : yearDiff * 2;
  }
}
