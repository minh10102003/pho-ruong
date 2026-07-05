import { employeeRepository } from '../repositories/employee.repository';
import { CreateEmployeeDto, CheckInDto, CheckOutDto, UpdateEmployeeDto } from '../types';
import { orderWsHub } from '../websocket/orderHub';

// Service - xử lý nghiệp vụ module Nhân viên & Lương
export class EmployeeService {
  async getEmployees() {
    return employeeRepository.findAllEmployees();
  }

  async getOpenTimesheet(employeeId: string) {
    const employee = await employeeRepository.findEmployeeById(employeeId);
    if (!employee) throw new Error('Không tìm thấy nhân viên');
    return employeeRepository.findOpenTimesheet(employeeId);
  }

  async getTimesheetById(id: string) {
    return employeeRepository.findTimesheetById(id);
  }

  async getOpenTimesheets() {
    return employeeRepository.findAllOpenTimesheets();
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const employee = await employeeRepository.createEmployee({
      fullName: dto.fullName,
      phone: dto.phone,
      role: 'STAFF',
      hourlyRate: dto.hourlyRate,
    });
    orderWsHub.broadcastEmployeeUpdate({ action: 'create', employeeId: employee.id });
    return employee;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const employee = await employeeRepository.findEmployeeById(id);
    if (!employee) throw new Error('Không tìm thấy nhân viên');

    const updated = await employeeRepository.updateEmployee(id, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    orderWsHub.broadcastEmployeeUpdate({ action: 'update', employeeId: id });
    return updated;
  }

  async checkIn(dto: CheckInDto) {
    const employee = await employeeRepository.findEmployeeById(dto.employeeId);
    if (!employee) throw new Error('Không tìm thấy nhân viên');

    const openSheet = await employeeRepository.findOpenTimesheet(dto.employeeId);
    if (openSheet) {
      throw new Error('Nhân viên đã check-in, chưa check-out');
    }

    const timesheet = await employeeRepository.createTimesheet({
      checkIn: new Date(),
      note: dto.note,
      employee: { connect: { id: dto.employeeId } },
    });
    orderWsHub.broadcastEmployeeUpdate({ action: 'check-in', employeeId: dto.employeeId });
    return timesheet;
  }

  async checkOut(dto: CheckOutDto) {
    const sheet = await employeeRepository.checkoutTimesheet(dto.timesheetId);
    if (!sheet.checkOut) throw new Error('Check-out thất bại');
    orderWsHub.broadcastEmployeeUpdate({
      action: 'check-out',
      employeeId: sheet.employeeId,
      timesheetId: sheet.id,
    });
    return sheet;
  }

  // Tính tổng giờ công và lương tháng cho một nhân viên
  async getPayrollForEmployee(employeeId: string, year: number, month: number) {
    const employee = await employeeRepository.findEmployeeById(employeeId);
    if (!employee) throw new Error('Không tìm thấy nhân viên');

    const timesheets = await employeeRepository.getTimesheetsByMonth(
      employeeId,
      year,
      month
    );

    let totalHours = 0;
    for (const sheet of timesheets) {
      if (sheet.checkOut) {
        const hours =
          (sheet.checkOut.getTime() - sheet.checkIn.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    }

    const hourlyRate = Number(employee.hourlyRate);
    const totalSalary = totalHours * hourlyRate;

    return {
      employee,
      year,
      month,
      totalHours: Math.round(totalHours * 100) / 100,
      hourlyRate,
      totalSalary: Math.round(totalSalary),
      timesheets,
    };
  }

  // Bảng lương tổng hợp tất cả nhân viên trong tháng
  async getMonthlyPayroll(year: number, month: number) {
    const employees = await employeeRepository.findAllEmployees();
    const payrolls = await Promise.all(
      employees.map((emp) => this.getPayrollForEmployee(emp.id, year, month))
    );
    return payrolls;
  }
}

export const employeeService = new EmployeeService();
