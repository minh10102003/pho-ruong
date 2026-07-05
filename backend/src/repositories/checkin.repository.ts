import prisma from '../config/database';

export class CheckInRepository {
  async findPendingByEmployee(employeeId: string) {
    return prisma.checkInRequest.findFirst({
      where: { employeeId, status: 'PENDING' },
      include: { employee: true },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async findAllPending() {
    return prisma.checkInRequest.findMany({
      where: { status: 'PENDING' },
      include: { employee: true },
      orderBy: { requestedAt: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.checkInRequest.findUnique({
      where: { id },
      include: { employee: true, timesheet: true },
    });
  }

  async createRequest(employeeId: string) {
    return prisma.checkInRequest.create({
      data: { employeeId },
      include: { employee: true },
    });
  }

  async approveRequest(requestId: string, reviewedById: string, timesheetId: string) {
    return prisma.checkInRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById,
        timesheetId,
      },
      include: { employee: true, timesheet: { include: { employee: true } } },
    });
  }

  async rejectRequest(requestId: string, reviewedById: string, rejectReason?: string) {
    return prisma.checkInRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById,
        rejectReason: rejectReason?.trim() || null,
      },
      include: { employee: true },
    });
  }

  async cancelPending(employeeId: string) {
    const pending = await this.findPendingByEmployee(employeeId);
    if (!pending) return null;
    return prisma.checkInRequest.update({
      where: { id: pending.id },
      data: { status: 'REJECTED', reviewedAt: new Date(), rejectReason: 'Đã hủy bởi nhân viên' },
      include: { employee: true },
    });
  }
}

export const checkInRepository = new CheckInRepository();
