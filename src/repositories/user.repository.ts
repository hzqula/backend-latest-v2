import { Prisma, User } from "../../prisma/app/generated/prisma/client";
import { prisma } from "../configs/prisma";

export class UserRepository {
  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  public async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  public async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  public async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }
}
