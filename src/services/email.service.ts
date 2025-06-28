import nodemailer from "nodemailer";
import { HttpError } from "../utils/error";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  public async sendOtpEmail(email: string, otpCode: number): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Kode OTP Anda",
        text: `Kode OTP Anda adalah ${otpCode}. Kode ini berlaku selama 10 menit.`,
      });
    } catch (error) {
      throw new HttpError(500, "Gagal mengirim email OTP");
    }
  }
}
