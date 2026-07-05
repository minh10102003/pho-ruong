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

  findAllForAdmin() {
    return prisma.user.findMany({
      where: { role: { in: ['MANAGER', 'STAFF'] } },
      include: { employee: true },
      orderBy: [{ role: 'asc' }, { displayName: 'asc' }],
    });
  }

  updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: { employee: true },
    });
  }
}

export const userRepository = new UserRepository();
