import prisma from '../config/database';

export class CheckOutRepository {
  async findPendingByEmployee(employeeId: string) {
    return prisma.checkOutRequest.findFirst({
      where: { employeeId, status: 'PENDING' },
      include: { employee: true, timesheet: true },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async findPendingByTimesheet(timesheetId: string) {
    return prisma.checkOutRequest.findFirst({
      where: { timesheetId, status: 'PENDING' },
      include: { employee: true, timesheet: true },
    });
  }

  async findAllPending() {
    return prisma.checkOutRequest.findMany({
      where: { status: 'PENDING' },
      include: { employee: true, timesheet: true },
      orderBy: { requestedAt: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.checkOutRequest.findUnique({
      where: { id },
      include: { employee: true, timesheet: true },
    });
  }

  async createRequest(employeeId: string, timesheetId: string) {
    return prisma.checkOutRequest.create({
      data: { employeeId, timesheetId },
      include: { employee: true, timesheet: true },
    });
  }

  async approveRequest(requestId: string, reviewedById: string) {
    return prisma.checkOutRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById,
      },
      include: { employee: true, timesheet: { include: { employee: true } } },
    });
  }

  async rejectRequest(requestId: string, reviewedById: string, rejectReason?: string) {
    return prisma.checkOutRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById,
        rejectReason: rejectReason?.trim() || null,
      },
      include: { employee: true, timesheet: true },
    });
  }

  async cancelPending(employeeId: string) {
    const pending = await this.findPendingByEmployee(employeeId);
    if (!pending) return null;
    return prisma.checkOutRequest.update({
      where: { id: pending.id },
      data: { status: 'REJECTED', reviewedAt: new Date(), rejectReason: 'Đã hủy bởi nhân viên' },
      include: { employee: true, timesheet: true },
    });
  }
}

export const checkOutRepository = new CheckOutRepository();
