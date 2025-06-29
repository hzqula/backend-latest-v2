import { z } from "zod";

export const RegisterEmailSchema = z.object({
  email: z
    .string()
    .email("Format email tidak valid")
    .refine(
      (email) =>
        email.endsWith("@student.unri.ac.id") ||
        email.endsWith("@lecturer.unri.ac.id"),
      {
        message:
          "Email harus menggunakan domain @student.unri.ac.id atau @lecturer.unri.ac.id",
      }
    ),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  code: z
    .number()
    .int()
    .min(100000, "OTP harus 6 digit")
    .max(999999, "OTP harus 6 digit"),
});

export const RegisterUserSchema = z
  .object({
    email: z.string().email("Format email tidak valid"),
    name: z
      .string()
      .min(1, "Nama wajib diisi")
      .refine(
        (name) =>
          name
            .split(" ")
            .every(
              (word: string) =>
                word[0] === word[0].toUpperCase() && word.length > 0
            ),
        { message: "Setiap kata pada nama harus diawali huruf kapital" }
      ),
    nim: z
      .string()
      .optional()
      .refine((nim) => !nim || /^[0-9]{8,}$/.test(nim), {
        message: "NIM harus berupa angka dan minimal 8 digit",
      }),
    nip: z
      .string()
      .optional()
      .refine((nip) => !nip || /^[0-9]{8,}$/.test(nip), {
        message: "NIP harus berupa angka dan minimal 8 digit",
      }),
    phoneNumber: z.string().regex(/^08[0-9]{9,11}$/, {
      message: "Nomor telepon harus diawali 08 dan memiliki 11-13 digit",
    }),
    password: z
      .string()
      .min(8, "Kata sandi harus minimal 8 karakter")
      .regex(/[0-9]/, "Kata sandi harus mengandung setidaknya satu angka")
      .regex(
        /[^a-zA-Z0-9]/,
        "Kata sandi harus mengandung setidaknya satu simbol"
      ),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi kata sandi harus minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi dan konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => (data.nim && !data.nip) || (!data.nim && data.nip), {
    message: "Hanya salah satu dari NIM atau NIP yang boleh diisi",
    path: ["nim", "nip"],
  });

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Format email tidak valid")
    .refine(
      (email) =>
        email.endsWith("@student.unri.ac.id") ||
        email.endsWith("@lecturer.unri.ac.id") ||
        email.endsWith("@eng.unri.ac.id"),
      {
        message:
          "Email harus menggunakan domain @student.unri.ac.id, @lecturer.unri.ac.id, atau @eng.unri.ac.id",
      }
    ),
  password: z.string().min(1, "Kata sandi wajib diisi"),
  recaptchaToken: z.string().min(1, "Token reCAPTCHA wajib diisi"),
});

export type RegisterEmailDto = z.infer<typeof RegisterEmailSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
