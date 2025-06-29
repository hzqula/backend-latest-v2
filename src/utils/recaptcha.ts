import axios from "axios";
import { HttpError } from "../utils/error";
import { RECAPTCHA_SECRET_KEY } from "../configs/env";

export class RecaptchaService {
  public async verifyRecaptcha(token: string): Promise<boolean> {
    try {
      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
          params: {
            secret: RECAPTCHA_SECRET_KEY,
            response: token,
          },
        }
      );
      return response.data.success;
    } catch (error) {
      console.error("Error verifying reCAPTCHA:", error);
      throw new HttpError(500, "Gagal memverifikasi reCAPTCHA");
    }
  }
}
