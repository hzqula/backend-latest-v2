import { Prisma, Lecturer } from "../../prisma/app/generated/prisma/client";
import { prisma } from "../configs/prisma";

export class LecturerRepository {
  public async findByNip(nip: string): Promise<Lecturer | null> {
    return prisma.lecturer.findUnique({ where: { nip } });
  }

  public async create(data: Prisma.LecturerCreateInput): Promise<Lecturer> {
    return prisma.lecturer.create({ data });
  }
}
