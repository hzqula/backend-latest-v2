import { OTP } from "../../prisma/app/generated/prisma/client";
import { prisma } from "../configs/prisma";

export class OtpRepository {
  public async findByEmailAndCode(
    email: string,
    code: number
  ): Promise<OTP | null> {
    return prisma.oTP.findFirst({ where: { user: { email }, code } });
  }

  public async create(data: {
    code: number;
    email: string;
    expiresAt: Date;
  }): Promise<OTP> {
    return prisma.oTP.create({
      data: {
        code: data.code,
        expiresAt: data.expiresAt,
        user: {
          connectOrCreate: {
            where: { email: data.email },
            create: {
              email: data.email,
              password: "",
              role: data.email.endsWith("@student.unri.ac.id")
                ? "STUDENT"
                : "LECTURER",
            },
          },
        },
      },
    });
  }

  public async deleteByEmail(email: string): Promise<void> {
    await prisma.oTP.deleteMany({ where: { user: { email } } });
  }
}
