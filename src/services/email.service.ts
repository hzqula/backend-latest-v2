import nodemailer from "nodemailer";
import { HttpError } from "../utils/error";
import { SMTP_USER, SMTP_PASS } from "../configs/env";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  public async sendOtpEmail(email: string, otpCode: number): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Latest App" <${SMTP_USER}>`,
        to: email,
        subject: "Kode OTP Pendaftaran Akun di Latest",
        text: `Kode OTP Anda adalah ${otpCode}. Kode ini berlaku selama 10 menit.`,
        html: `
          <h1>Kode OTP Pendaftaran</h1>
          <p>Kode OTP Anda adalah <strong>${otpCode}</strong>. Kode ini berlaku selama 10 menit.</p>
          <p>Jika Anda tidak meminta kode ini, abaikan email ini.</p>
        `,
      });
    } catch (error) {
      console.error("Error mengirim email OTP:", error);
      throw new HttpError(
        500,
        "Gagal mengirim email OTP: Terjadi kesalahan server"
      );
    }
  }

  public async verifySmtpConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("SMTP verification error:", error);
          reject(new HttpError(500, "Gagal memverifikasi koneksi SMTP"));
        } else {
          console.log("SMTP connection verified");
          resolve();
        }
      });
    });
  }
}
