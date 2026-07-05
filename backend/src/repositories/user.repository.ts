import prisma from '../config/database';
import { AppRole, Prisma } from '@prisma/client';

export class UserRepository {
  findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: { employee: true },
    });
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { employee: true },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, include: { employee: true } });
  }

  updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

export const userRepository = new UserRepository();
