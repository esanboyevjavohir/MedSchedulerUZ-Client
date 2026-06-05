// ===========================
// ENUMS
// ===========================

export enum HospitalType {
  Central = 1,
  Branch = 2,
}

export enum UserRole {
  SuperAdmin = 1,
  HospitalAdmin = 2,
  DeptHead = 3,
  Employee = 4,
}

export enum ScheduleStatus {
  Draft = 1,
  Published = 2,
  Archived = 3,
}

export enum ShiftType {
  Day = 1,
  Night = 2,
  OnCall = 3,
}

export enum ShiftStatus {
  Scheduled = 1,
  Completed = 2,
  Missed = 3,
  Swapped = 4,
  Cancelled = 5,
}

export enum SwapStatus {
  Pending = 1,
  Accepted = 2,
  Rejected = 3,
  Approved = 4,
}

export enum LeaveStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
}

export enum LeaveType {
  Annual = 1,
  Sick = 2,
  Unpaid = 3,
  Maternity = 4,
}

export enum AttendanceStatus {
  Present = 1,
  Late = 2,
  Absent = 3,
  EarlyLeave = 4,
}

export enum NotificationType {
  ScheduleChange = 1,
  CertExpiry = 2,
  ShiftSwap = 3,
  LeaveStatus = 4,
}

// ===========================
// API WRAPPER
// ===========================

export interface ApiResult<T> {
  succedded: boolean;
  result: T;
  errors: string[];
}

// ===========================
// AUTH / USER
// ===========================

export interface LoginUserModel {
  email: string;
  password: string;
}

export interface LoginResponseModel {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  expireAt: string;
  refreshTokenExpireAt: string;
}

export interface CreateUserModel {
  fullName: string;
  email: string;
  phoneNumber?: string;
  hospitalId: string;
  departmentId?: string;
  roleType: UserRole;
  specializationId?: string;
}

export interface UpdateProfileModel {
  fullName: string;
  phoneNumber?: string;
}

export interface UserResponseModel {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  roleType: string;
  specializationName?: string;
  hospitalId?: string;
  hospitalName?: string;
  departmentId?: string;
  departmentName?: string;
  createdOn: string;
}

export interface ChangePasswordModel {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordModel {
  email: string;
}

export interface ResetPasswordModel {
  email: string;
  temporaryPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenModel {
  id: string;
  refreshToken: string;
}

// ===========================
// HOSPITAL
// ===========================

export interface CreateHospitalModel {
  name: string;
  address: string;
  phone: string;
  type: HospitalType;
}

export interface UpdateHospitalModel {
  name: string;
  address: string;
  phone: string;
  type: HospitalType;
  isActive: boolean;
}

export interface HospitalResponseModel {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: HospitalType;
  isActive: boolean;
  createdOn: string;
}

// ===========================
// DEPARTMENT
// ===========================

export interface CreateDepartmentModel {
  hospitalId: string;
  name: string;
  minStaffRequired: number;
}

export interface UpdateDepartmentModel {
  name: string;
  minStaffRequired: number;
  isActive: boolean;
}

export interface DepartmentResponseModel {
  id: string;
  hospitalId: string;
  hospitalName: string;
  name: string;
  minStaffRequired: number;
  isActive: boolean;
  createdOn: string;
}

// ===========================
// SPECIALIZATION
// ===========================

export interface CreateSpecializationModel {
  departmentId: string;
  name: string;
}

export interface UpdateSpecializationModel {
  name: string;
  isActive: boolean;
}

export interface SpecializationResponseModel {
  id: string;
  name: string;
  isActive: boolean;
  departmentId: string;
  departmentName: string;
  hospitalName?: string;
}

// ===========================
// SCHEDULE
// ===========================

export interface CreateScheduleModel {
  hospitalId: string;
  departmentId: string;
  weekStart: string;
  weekEnd: string;
  createdBy: string;
}

export interface UpdateScheduleModel {
  weekStart: string;
  weekEnd: string;
  status: ScheduleStatus;
}

export interface ScheduleResponseModel {
  id: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  weekStart: string;
  weekEnd: string;
  status: ScheduleStatus;
  createdBy: string;
  createdOn: string;
}

// ===========================
// SHIFT
// ===========================

export interface CreateShiftModel {
  scheduleId: string;
  userId: string;
  departmentId: string;
  shiftDate: string;
  startTime: string;   // "HH:mm:ss"
  endTime: string;
  shiftType: ShiftType;
  isOnCall?: boolean;
}

export interface AutoGenerateShiftModel {
  scheduleId: string;
  departmentId: string;
  weekStart: string;
}

export interface UpdateShiftModel {
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  status: ShiftStatus;
  isOnCall: boolean;
}

export interface ShiftResponseModel {
  id: string;
  scheduleId: string;
  userId: string;
  userFullName: string;
  departmentId: string;
  departmentName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  status: ShiftStatus;
  isOnCall: boolean;
  qrToken?: string;
  createdOn: string;
}

// ===========================
// ATTENDANCE
// ===========================

export interface ClockInModel {
  shiftId: string;
  qrToken: string;
}

export interface ClockOutModel {
  shiftId: string;
  qrToken: string;
}

export interface AttendanceResponseModel {
  id: string;
  userId: string;
  userFullName: string;
  shiftId: string;
  clockIn?: string;
  clockOut?: string;
  status: AttendanceStatus;
  createdOn: string;
}

// ===========================
// SHIFT SWAP
// ===========================

export interface RequestSwapModel {
  shiftId: string;
  reason: string;
}

export interface ShiftSwapResponseModel {
  id: string;
  requesterId: string;
  requesterFullName: string;
  acceptorId?: string;
  acceptorFullName?: string;
  shiftId: string;
  shiftDate: string;
  status: SwapStatus;
  reason: string;
  approvedBy?: string;
  approverFullName?: string;
  deadline: string;
  createdOn: string;
  approvedAt?: string;
}

// ===========================
// LEAVE REQUEST
// ===========================

export interface CreateLeaveRequestModel {
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
}

export interface UpdateLeaveRequestModel {
  status: LeaveStatus;
}

export interface LeaveRequestResponseModel {
  id: string;
  userId: string;
  userFullName: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approverFullName?: string;
  createdOn: string;
  respondedAt?: string;
}

// ===========================
// CERTIFICATION
// ===========================

export interface AddCertificationModel {
  userId: string;
  name: string;
  documentBase64?: string;
  documentFileName?: string;
  issuedDate: string;
  expiryDate?: string;
}

export interface CertificationResponseModel {
  id: string;
  userId: string;
  userFullName: string;
  name: string;
  documentFileName?: string;
  issuedDate: string;
  expiryDate?: string;
  isNotified: boolean;
  createdOn: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

// ===========================
// NOTIFICATION
// ===========================

export interface CreateNotificationModel {
  userId: string;
  message: string;
  type: NotificationType;
}

export interface NotificationResponseModel {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdOn: string;
}