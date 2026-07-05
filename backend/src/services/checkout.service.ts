import { employeeRepository } from '../repositories/employee.repository';
import { checkOutRepository } from '../repositories/checkout.repository';
import { orderWsHub } from '../websocket/orderHub';
import { socketHub, CheckInSocketPayload } from '../websocket/socketHub';

function notifyAttendance(payload: CheckInSocketPayload) {
  socketHub.emitCheckInUpdate(payload);
  orderWsHub.broadcastCheckInUpdate(payload);
}

export class CheckOutService {
  async requestCheckOut(employeeId: string, timesheetId: string) {
    const employee = await employeeRepository.findEmployeeById(employeeId);
    if (!employee) throw new Error('Không tìm thấy nhân viên');

    const timesheet = await employeeRepository.findTimesheetById(timesheetId);
    if (!timesheet || timesheet.employeeId !== employeeId) {
      throw new Error('Không tìm thấy ca làm');
    }
    if (timesheet.checkOut) {
      throw new Error('Ca làm đã được check-out');
    }

    const pending = await checkOutRepository.findPendingByEmployee(employeeId);
    if (pending) {
      throw new Error('Đã có yêu cầu check-out đang chờ duyệt');
    }

    const request = await checkOutRepository.createRequest(employeeId, timesheetId);
    notifyAttendance({
      action: 'checkout_requested',
      requestId: request.id,
      employeeId,
      employeeName: employee.fullName,
      timesheetId,
      message: `${employee.fullName} yêu cầu check-out`,
    });
    return request;
  }

  async getPendingRequests() {
    return checkOutRepository.findAllPending();
  }

  async getMyPendingRequest(employeeId: string) {
    return checkOutRepository.findPendingByEmployee(employeeId);
  }

  async approveRequest(requestId: string, reviewerUserId: string) {
    const request = await checkOutRepository.findById(requestId);
    if (!request) throw new Error('Không tìm thấy yêu cầu check-out');
    if (request.status !== 'PENDING') throw new Error('Yêu cầu đã được xử lý');

    const timesheet = await employeeRepository.findTimesheetById(request.timesheetId);
    if (!timesheet || timesheet.checkOut) {
      throw new Error('Ca làm không hợp lệ hoặc đã check-out');
    }

    const sheet = await employeeRepository.checkoutTimesheet(request.timesheetId);
    const updated = await checkOutRepository.approveRequest(requestId, reviewerUserId);

    notifyAttendance({
      action: 'checkout_approved',
      requestId,
      employeeId: request.employeeId,
      employeeName: request.employee.fullName,
      timesheetId: sheet.id,
      message: `Quản lý đã duyệt check-out cho ${request.employee.fullName}`,
    });

    orderWsHub.broadcastEmployeeUpdate({
      action: 'check-out',
      employeeId: sheet.employeeId,
      timesheetId: sheet.id,
    });

    return updated;
  }

  async rejectRequest(requestId: string, reviewerUserId: string, rejectReason?: string) {
    const request = await checkOutRepository.findById(requestId);
    if (!request) throw new Error('Không tìm thấy yêu cầu check-out');
    if (request.status !== 'PENDING') throw new Error('Yêu cầu đã được xử lý');

    const updated = await checkOutRepository.rejectRequest(requestId, reviewerUserId, rejectReason);
    notifyAttendance({
      action: 'checkout_rejected',
      requestId,
      employeeId: request.employeeId,
      employeeName: request.employee.fullName,
      timesheetId: request.timesheetId,
      message: rejectReason?.trim() || 'Quản lý đã từ chối yêu cầu check-out',
    });
    return updated;
  }

  async cancelMyRequest(employeeId: string) {
    const pending = await checkOutRepository.findPendingByEmployee(employeeId);
    if (!pending) throw new Error('Không có yêu cầu check-out đang chờ');

    const updated = await checkOutRepository.cancelPending(employeeId);
    if (!updated) throw new Error('Hủy yêu cầu thất bại');

    notifyAttendance({
      action: 'checkout_cancelled',
      requestId: updated.id,
      employeeId,
      employeeName: updated.employee.fullName,
      timesheetId: updated.timesheetId,
      message: 'Nhân viên đã hủy yêu cầu check-out',
    });
    return updated;
  }
}

export const checkOutService = new CheckOutService();
