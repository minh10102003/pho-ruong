import { employeeRepository } from '../repositories/employee.repository';
import { checkInRepository } from '../repositories/checkin.repository';
import { orderWsHub } from '../websocket/orderHub';
import { socketHub, CheckInSocketPayload } from '../websocket/socketHub';

function notifyCheckIn(payload: CheckInSocketPayload) {
  socketHub.emitCheckInUpdate(payload);
  orderWsHub.broadcastCheckInUpdate(payload);
  orderWsHub.broadcastEmployeeUpdate({ action: `checkin-${payload.action}`, employeeId: payload.employeeId });
}

export class CheckInService {
  async requestCheckIn(employeeId: string) {
    const employee = await employeeRepository.findEmployeeById(employeeId);
    if (!employee) throw new Error('Không tìm thấy nhân viên');

    const openSheet = await employeeRepository.findOpenTimesheet(employeeId);
    if (openSheet) {
      throw new Error('Bạn đang trong ca làm, không thể gửi yêu cầu check-in mới');
    }

    const pending = await checkInRepository.findPendingByEmployee(employeeId);
    if (pending) {
      throw new Error('Đã có yêu cầu check-in đang chờ duyệt');
    }

    const request = await checkInRepository.createRequest(employeeId);
    notifyCheckIn({
      action: 'requested',
      requestId: request.id,
      employeeId,
      employeeName: employee.fullName,
      message: `${employee.fullName} yêu cầu check-in`,
    });
    return request;
  }

  async getPendingRequests() {
    return checkInRepository.findAllPending();
  }

  async getMyPendingRequest(employeeId: string) {
    return checkInRepository.findPendingByEmployee(employeeId);
  }

  async approveRequest(requestId: string, reviewerUserId: string) {
    const request = await checkInRepository.findById(requestId);
    if (!request) throw new Error('Không tìm thấy yêu cầu check-in');
    if (request.status !== 'PENDING') throw new Error('Yêu cầu đã được xử lý');

    const openSheet = await employeeRepository.findOpenTimesheet(request.employeeId);
    if (openSheet) throw new Error('Nhân viên đã có ca làm đang mở');

    const timesheet = await employeeRepository.createTimesheet({
      checkIn: new Date(),
      employee: { connect: { id: request.employeeId } },
    });

    const updated = await checkInRepository.approveRequest(requestId, reviewerUserId, timesheet.id);
    notifyCheckIn({
      action: 'approved',
      requestId,
      employeeId: request.employeeId,
      employeeName: request.employee.fullName,
      timesheetId: timesheet.id,
      message: `Quản lý đã duyệt check-in cho ${request.employee.fullName}`,
    });
    return updated;
  }

  async rejectRequest(requestId: string, reviewerUserId: string, rejectReason?: string) {
    const request = await checkInRepository.findById(requestId);
    if (!request) throw new Error('Không tìm thấy yêu cầu check-in');
    if (request.status !== 'PENDING') throw new Error('Yêu cầu đã được xử lý');

    const updated = await checkInRepository.rejectRequest(requestId, reviewerUserId, rejectReason);
    notifyCheckIn({
      action: 'rejected',
      requestId,
      employeeId: request.employeeId,
      employeeName: request.employee.fullName,
      message: rejectReason?.trim() || 'Quản lý đã từ chối yêu cầu check-in',
    });
    return updated;
  }

  async cancelMyRequest(employeeId: string) {
    const pending = await checkInRepository.findPendingByEmployee(employeeId);
    if (!pending) throw new Error('Không có yêu cầu check-in đang chờ');

    const updated = await checkInRepository.cancelPending(employeeId);
    if (!updated) throw new Error('Hủy yêu cầu thất bại');

    notifyCheckIn({
      action: 'cancelled',
      requestId: updated.id,
      employeeId,
      employeeName: updated.employee.fullName,
      message: 'Nhân viên đã hủy yêu cầu check-in',
    });
    return updated;
  }
}

export const checkInService = new CheckInService();
