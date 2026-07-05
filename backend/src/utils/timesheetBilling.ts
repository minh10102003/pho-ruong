/** Làm tròn xuống mốc 30 phút gần nhất (14:45 → 14:30) */
export function floorTo30Minutes(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  result.setMinutes(minutes < 30 ? 0 : 30, 0, 0);
  return result;
}

/** Tính số giờ làm — nếu bật khối 30 phút thì chỉ tính theo bội 0.5h */
export function calculateTimesheetHours(
  checkIn: Date,
  checkOut: Date,
  useBlockRounding: boolean
): number {
  if (!useBlockRounding) {
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return Math.max(0, hours);
  }

  const start = floorTo30Minutes(checkIn);
  const end = floorTo30Minutes(checkOut);
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  return diffMs / (1000 * 60 * 60);
}

export function calculateTimesheetSalary(
  checkIn: Date,
  checkOut: Date,
  hourlyRate: number,
  useBlockRounding: boolean
): number {
  const hours = calculateTimesheetHours(checkIn, checkOut, useBlockRounding);
  return Math.round(hours * hourlyRate);
}
