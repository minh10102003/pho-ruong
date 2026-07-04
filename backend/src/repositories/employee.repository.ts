import prisma from '../config/database';
import { Prisma } from '@prisma/client';

// Repository - tầng truy cập dữ liệu cho module Nhân viên
export class EmployeeRepository {
  async findAllEmployees() {
    return prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async findEmployeeById(id: string) {
    return prisma.employee.findUnique({ where: { id } });
  }

  async createEmployee(data: Prisma.EmployeeCreateInput) {
    return prisma.employee.create({ data });
  }

  async updateEmployee(id: string, data: Prisma.EmployeeUpdateInput) {
    return prisma.employee.update({ where: { id }, data });
  }

  async findOpenTimesheet(employeeId: string) {
    return prisma.timesheet.findFirst({
      where: { employeeId, checkOut: null },
      orderBy: { checkIn: 'desc' },
      include: { employee: true },
    });
  }

  async findAllOpenTimesheets() {
    return prisma.timesheet.findMany({
      where: { checkOut: null },
      include: { employee: true },
      orderBy: { checkIn: 'desc' },
    });
  }

  async createTimesheet(data: Prisma.TimesheetCreateInput) {
    return prisma.timesheet.create({
      data,
      include: { employee: true },
    });
  }

  async checkoutTimesheet(id: string) {
    return prisma.timesheet.update({
      where: { id },
      data: { checkOut: new Date() },
      include: { employee: true },
    });
  }

  async getTimesheetsByMonth(employeeId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return prisma.timesheet.findMany({
      where: {
        employeeId,
        checkIn: { gte: start, lt: end },
      },
      orderBy: { checkIn: 'asc' },
    });
  }

  async getAllTimesheetsByMonth(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return prisma.timesheet.findMany({
      where: {
        checkIn: { gte: start, lt: end },
      },
      include: { employee: true },
      orderBy: { checkIn: 'asc' },
    });
  }
}

export const employeeRepository = new EmployeeRepository();
