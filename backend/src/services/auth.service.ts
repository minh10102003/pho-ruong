import prisma from '../config/database';
import { AppRole } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';

export interface AuthUserDto {
  id: string;
  phone: string;
  role: AppRole;
  displayName: string;
  employeeId: string | null;
}

function toAuthUser(user: {
  id: string;
  phone: string;
  role: AppRole;
  displayName: string;
  employeeId: string | null;
}): AuthUserDto {
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    displayName: user.displayName,
    employeeId: user.employeeId,
  };
}

export class AuthService {
  async login(phone: string, password: string) {
    const normalizedPhone = phone.trim();
    const user = await userRepository.findByPhone(normalizedPhone);

    if (!user || !user.isActive) {
      throw new Error('Số điện thoại hoặc mật khẩu không đúng');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Số điện thoại hoặc mật khẩu không đúng');
    }

    await userRepository.updateLastLogin(user.id);

    const authUser = toAuthUser(user);
    const token = signAuthToken({
      userId: authUser.id,
      role: authUser.role,
      employeeId: authUser.employeeId,
      displayName: authUser.displayName,
    });

    return { token, user: authUser };
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new Error('Tài khoản không tồn tại hoặc đã bị vô hiệu');
    }
    return toAuthUser(user);
  }

  async createManager(
    dto: { fullName: string; phone: string; password: string },
    createdById: string
  ) {
    const phone = dto.phone.trim();
    const existing = await userRepository.findByPhone(phone);
    if (existing) {
      throw new Error('Số điện thoại đã được sử dụng');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await userRepository.create({
      phone,
      passwordHash,
      role: AppRole.MANAGER,
      displayName: dto.fullName.trim(),
      createdById,
    });

    return toAuthUser(user);
  }

  async createStaffAccount(
    dto: { fullName: string; phone: string; password: string; hourlyRate: number },
    createdById: string
  ) {
    const phone = dto.phone.trim();
    const existing = await userRepository.findByPhone(phone);
    if (existing) {
      throw new Error('Số điện thoại đã được sử dụng');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          fullName: dto.fullName.trim(),
          phone,
          role: 'STAFF',
          hourlyRate: dto.hourlyRate,
        },
      });

      return tx.user.create({
        data: {
          phone,
          passwordHash,
          role: AppRole.STAFF,
          displayName: dto.fullName.trim(),
          employeeId: employee.id,
          createdById,
        },
        include: { employee: true },
      });
    });

    return toAuthUser(user);
  }
}

export const authService = new AuthService();
