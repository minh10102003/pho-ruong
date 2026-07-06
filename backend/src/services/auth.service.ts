import prisma from '../config/database';
import { AppRole } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';

import { permissionService } from './permission.service';

export interface AuthUserDto {
  id: string;
  phone: string;
  role: AppRole;
  displayName: string;
  employeeId: string | null;
  features: string[];
}

function toAuthUser(user: {
  id: string;
  phone: string;
  role: AppRole;
  displayName: string;
  employeeId: string | null;
}): Omit<AuthUserDto, 'features'> {
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    displayName: user.displayName,
    employeeId: user.employeeId,
  };
}

async function toAuthUserWithFeatures(user: {
  id: string;
  phone: string;
  role: AppRole;
  displayName: string;
  employeeId: string | null;
}): Promise<AuthUserDto> {
  const features = await permissionService.getEnabledFeatures(user.role);
  return { ...toAuthUser(user), features };
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

    const authUser = await toAuthUserWithFeatures(user);
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
    return toAuthUserWithFeatures(user);
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

    return toAuthUserWithFeatures(user);
  }

  async createStaffAccount(
    dto: {
      fullName: string;
      phone: string;
      password: string;
      hourlyRate: number;
      useBlockRounding?: boolean;
    },
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
          useBlockRounding: dto.useBlockRounding ?? false,
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

    return toAuthUserWithFeatures(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new Error('Tài khoản không tồn tại hoặc đã bị vô hiệu');
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }

    if (currentPassword === newPassword) {
      throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, passwordHash);
  }

  async listManagedUsers() {
    const users = await userRepository.findAllForAdmin();
    return users.map((user) => ({
      id: user.id,
      phone: user.phone,
      role: user.role,
      displayName: user.displayName,
      isActive: user.isActive,
      employeeId: user.employeeId,
      hourlyRate: user.employee ? Number(user.employee.hourlyRate) : null,
      useBlockRounding: user.employee?.useBlockRounding ?? null,
    }));
  }

  async updateManagedUser(
    userId: string,
    actorId: string,
    dto: {
      displayName?: string;
      phone?: string;
      password?: string;
      isActive?: boolean;
      hourlyRate?: number;
      useBlockRounding?: boolean;
    }
  ) {
    if (userId === actorId) {
      throw new Error('Không thể tự sửa tài khoản tại đây');
    }

    const user = await userRepository.findById(userId);
    if (!user || user.role === AppRole.ADMIN) {
      throw new Error('Không tìm thấy tài khoản');
    }

    if (dto.phone) {
      const phone = dto.phone.trim();
      const existing = await userRepository.findByPhone(phone);
      if (existing && existing.id !== userId) {
        throw new Error('Số điện thoại đã được sử dụng');
      }
    }

    const passwordHash = dto.password ? await hashPassword(dto.password) : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      if (user.employeeId && dto.hourlyRate !== undefined) {
        await tx.employee.update({
          where: { id: user.employeeId },
          data: { hourlyRate: dto.hourlyRate },
        });
      }

      if (user.employeeId && dto.useBlockRounding !== undefined) {
        await tx.employee.update({
          where: { id: user.employeeId },
          data: { useBlockRounding: dto.useBlockRounding },
        });
      }

      if (user.employeeId && dto.displayName !== undefined) {
        await tx.employee.update({
          where: { id: user.employeeId },
          data: { fullName: dto.displayName.trim() },
        });
      }

      if (user.employeeId && dto.phone !== undefined) {
        await tx.employee.update({
          where: { id: user.employeeId },
          data: { phone: dto.phone.trim() },
        });
      }

      if (user.employeeId && dto.isActive !== undefined) {
        await tx.employee.update({
          where: { id: user.employeeId },
          data: { isActive: dto.isActive },
        });
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          ...(dto.displayName !== undefined && { displayName: dto.displayName.trim() }),
          ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(passwordHash && { passwordHash }),
        },
        include: { employee: true },
      });
    });

    return {
      id: updated.id,
      phone: updated.phone,
      role: updated.role,
      displayName: updated.displayName,
      isActive: updated.isActive,
      employeeId: updated.employeeId,
      hourlyRate: updated.employee ? Number(updated.employee.hourlyRate) : null,
      useBlockRounding: updated.employee?.useBlockRounding ?? null,
    };
  }

  async deleteManagedUser(userId: string, actorId: string) {
    if (userId === actorId) {
      throw new Error('Không thể tự xóa tài khoản của mình');
    }

    const user = await userRepository.findById(userId);
    if (!user || user.role === AppRole.ADMIN) {
      throw new Error('Không tìm thấy tài khoản');
    }

    await prisma.$transaction(async (tx) => {
      if (user.employeeId) {
        await tx.employee.update({
          where: { id: user.employeeId },
          data: { isActive: false },
        });
      }
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
    });

    return { deleted: true };
  }
}

export const authService = new AuthService();
