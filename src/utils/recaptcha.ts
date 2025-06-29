import axios from "axios";
import { HttpError } from "./error";
import { RECAPTCHA_SECRET_KEY } from "../configs/env";

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export class RecaptchaService {
  private readonly RECAPTCHA_VERIFY_URL =
    "https://www.google.com/recaptcha/api/siteverify";

  public async verifyRecaptcha(token: string): Promise<boolean> {
    try {
      const response = await axios.post<RecaptchaResponse>(
        this.RECAPTCHA_VERIFY_URL,
        null,
        {
          params: {
            secret: RECAPTCHA_SECRET_KEY,
            response: token,
          },
        }
      );

      const { success, score } = response.data;
      // Untuk reCAPTCHA v3, gunakan score (misalnya, > 0.5 untuk manusia)
      // Untuk reCAPTCHA v2, hanya cek success
      return success && (!score || score > 0.5);
    } catch (error) {
      console.error("Gagal memverifikasi reCAPTCHA:", error);
      throw new HttpError(500, "Gagal memverifikasi reCAPTCHA");
    }
  }
}
