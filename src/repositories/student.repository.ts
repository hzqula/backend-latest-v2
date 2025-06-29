import { Prisma, Student } from "../../prisma/app/generated/prisma/client";
import { prisma } from "../configs/prisma";

export class StudentRepository {
  public async findByNim(nim: string): Promise<Student | null> {
    return prisma.student.findUnique({ where: { nim } });
  }

  public async findById(id: number): Promise<Student | null> {
    return prisma.student.findUnique({ where: { id } });
  }

  public async create(data: Prisma.StudentCreateInput): Promise<Student> {
    return prisma.student.create({ data });
  }
}
