import { Prisma, SecurityLog } from "../../prisma/app/generated/prisma/client";
import { prisma } from "../configs/prisma";

export class SecurityLogRepository {
  public async create(
    data: Prisma.SecurityLogCreateInput
  ): Promise<SecurityLog> {
    return prisma.securityLog.create({ data });
  }
}
