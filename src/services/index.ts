import api from './api';
import type {
  ApiResult,
  LoginUserModel, LoginResponseModel,
  CreateUserModel, UserResponseModel, UpdateProfileModel,
  ChangePasswordModel, ForgotPasswordModel, ResetPasswordModel, RefreshTokenModel,
  CreateHospitalModel, UpdateHospitalModel, HospitalResponseModel,
  CreateDepartmentModel, UpdateDepartmentModel, DepartmentResponseModel,
  CreateSpecializationModel, UpdateSpecializationModel, SpecializationResponseModel,
  CreateScheduleModel, UpdateScheduleModel, ScheduleResponseModel,
  CreateShiftModel, UpdateShiftModel, ShiftResponseModel,
  ClockInModel, ClockOutModel, AttendanceResponseModel,
  RequestSwapModel, ShiftSwapResponseModel,
  CreateLeaveRequestModel, UpdateLeaveRequestModel, LeaveRequestResponseModel,
  AddCertificationModel, CertificationResponseModel,
  CreateNotificationModel, NotificationResponseModel,
} from '../types';

// ===========================
// USER / AUTH
// ===========================
export const userService = {
  login: (model: LoginUserModel) =>
    api.post<ApiResult<LoginResponseModel>>('/User/login', model),

  register: (model: CreateUserModel) =>
    api.post<ApiResult<{ id: string; fullName: string; email: string }>>('/User/register', model),

  sendOtp: (userId: string) =>
    api.post<ApiResult<boolean>>(`/User/send-otp/${userId}`),

  verifyOtp: (otpCode: string, userId: string) =>
    api.post<ApiResult<LoginResponseModel>>(`/User/verify-otp?otpCode=${otpCode}&userId=${userId}`),

  resendOtp: (userId: string) =>
    api.post<ApiResult<boolean>>(`/User/resend-otp/${userId}`),

  forgotPassword: (model: ForgotPasswordModel) =>
    api.post<ApiResult<boolean>>('/User/forgot-password', model),

  resetPassword: (model: ResetPasswordModel) =>
    api.post<ApiResult<boolean>>('/User/reset-password', model),

  refreshToken: (model: RefreshTokenModel) =>
    api.post<ApiResult<LoginResponseModel>>('/User/refresh-token', model),

  updateProfile: (model: UpdateProfileModel) =>
    api.put<ApiResult<boolean>>('/User/profile-update', model),

  updateUser: (id: string, model: any) =>
    api.put<ApiResult<boolean>>(`/User/${id}/update-user`, model),

  changePassword: (model: ChangePasswordModel) =>
    api.put<ApiResult<boolean>>('/User/change-password', model),

  getMyProfile: () =>
    api.get<ApiResult<UserResponseModel>>('/User/my-profile'),

  getById: (id: string) =>
    api.get<ApiResult<UserResponseModel>>(`/User/${id}`),

  getAll: () =>
    api.get<ApiResult<UserResponseModel[]>>('/User/GetAllUser'),

  deleteUser: (id: string) =>
    api.delete<ApiResult<boolean>>(`/User/${id}`),
};

// ===========================
// HOSPITAL
// ===========================
export const hospitalService = {
  create: (model: CreateHospitalModel) =>
    api.post<ApiResult<{ id: string }>>('/Hospital', model),

  update: (id: string, model: UpdateHospitalModel) =>
    api.put<ApiResult<{ id: string }>>(`/Hospital/${id}`, model),

  getById: (id: string) =>
    api.get<ApiResult<HospitalResponseModel>>(`/Hospital/${id}`),

  getAll: () =>
    api.get<ApiResult<HospitalResponseModel[]>>('/Hospital'),

  delete: (id: string) =>
    api.delete<ApiResult<boolean>>(`/Hospital/${id}`),
};

// ===========================
// DEPARTMENT
// ===========================
export const departmentService = {
  create: (model: CreateDepartmentModel) =>
    api.post<ApiResult<{ id: string }>>('/Department', model),

  update: (id: string, model: UpdateDepartmentModel) =>
    api.put<ApiResult<{ id: string }>>(`/Department/${id}`, model),

  getById: (id: string) =>
    api.get<ApiResult<DepartmentResponseModel>>(`/Department/${id}`),

  getAll: () =>
    api.get<ApiResult<DepartmentResponseModel[]>>('/Department'),

  getByHospital: (hospitalId: string) =>
    api.get<ApiResult<DepartmentResponseModel[]>>(`/Department/hospital/${hospitalId}`),

  delete: (id: string) =>
    api.delete<ApiResult<boolean>>(`/Department/${id}`),
};

// ===========================
// SPECIALIZATION
// ===========================
export const specializationService = {
  create: (model: CreateSpecializationModel) =>
    api.post<ApiResult<{ id: string }>>('/Specialization', model),

  update: (id: string, model: UpdateSpecializationModel) =>
    api.put<ApiResult<{ id: string }>>(`/Specialization/${id}`, model),

  getById: (id: string) =>
    api.get<ApiResult<SpecializationResponseModel>>(`/Specialization/${id}`),

  getAll: () =>
    api.get<ApiResult<SpecializationResponseModel[]>>('/Specialization'),

  getByDepartment: (departmentId: string) =>
    api.get<ApiResult<SpecializationResponseModel[]>>(`/Specialization/department/${departmentId}`),

  delete: (id: string) =>
    api.delete<ApiResult<boolean>>(`/Specialization/${id}`),
};

// ===========================
// SCHEDULE
// ===========================
export const scheduleService = {
  create: (model: CreateScheduleModel) =>
    api.post<ApiResult<{ id: string }>>('/Schedule', model),

  update: (id: string, model: UpdateScheduleModel) =>
    api.put<ApiResult<{ id: string }>>(`/Schedule/${id}`, model),

  getById: (id: string) =>
    api.get<ApiResult<ScheduleResponseModel>>(`/Schedule/${id}`),

  getAll: () =>
    api.get<ApiResult<ScheduleResponseModel[]>>('/Schedule'),

  getByDepartment: (departmentId: string) =>
    api.get<ApiResult<ScheduleResponseModel[]>>(`/Schedule/department/${departmentId}`),

  delete: (id: string) =>
    api.delete<ApiResult<boolean>>(`/Schedule/${id}`),
};

// ===========================
// SHIFT
// ===========================
export const shiftService = {
  create: (model: CreateShiftModel) =>
    api.post<ApiResult<{ id: string }>>('/Shift', model),

  autoGenerate: (model: { scheduleId: string; departmentId: string; weekStart: string }) =>
    api.post<ApiResult<{ createdCount: number; skippedCount: number; warnings: string[] }>>('/Shift/auto-generate', model),

  autoGenerateWeek: (model: { hospitalId: string; departmentId: string; weekStart: string; createdBy: string }) =>
    api.post<ApiResult<{ scheduleId: string; createdCount: number; skippedCount: number; warnings: string[] }>>('/Shift/auto-generate-week', model),

  update: (id: string, model: UpdateShiftModel) =>
    api.put<ApiResult<{ id: string }>>(`/Shift/${id}`, model),

  getById: (id: string) =>
    api.get<ApiResult<ShiftResponseModel>>(`/Shift/${id}`),

  getAll: () =>
    api.get<ApiResult<ShiftResponseModel[]>>('/Shift'),

  getByUser: (userId: string) =>
    api.get<ApiResult<ShiftResponseModel[]>>(`/Shift/user/${userId}`),

  getBySchedule: (scheduleId: string) =>
    api.get<ApiResult<ShiftResponseModel[]>>(`/Shift/schedule/${scheduleId}`),

  getQrToken: (id: string) =>
    api.get<ApiResult<string>>(`/Shift/${id}/qr-token`),

  delete: (id: string) =>
    api.delete<ApiResult<boolean>>(`/Shift/${id}`),
};

// ===========================
// ATTENDANCE
// ===========================
export const attendanceService = {
  clockIn: (model: ClockInModel) =>
    api.post<ApiResult<boolean>>('/Attendance/clock-in', model),

  clockOut: (model: ClockOutModel) =>
    api.post<ApiResult<boolean>>('/Attendance/clock-out', model),

  getById: (id: string) =>
    api.get<ApiResult<AttendanceResponseModel>>(`/Attendance/${id}`),

  getByUser: (userId: string) =>
    api.get<ApiResult<AttendanceResponseModel[]>>(`/Attendance/user/${userId}`),

  getByShift: (shiftId: string) =>
    api.get<ApiResult<AttendanceResponseModel[]>>(`/Attendance/shift/${shiftId}`),
};

// ===========================
// SHIFT SWAP
// ===========================
export const shiftSwapService = {
  requestSwap: (model: RequestSwapModel) =>
    api.post<ApiResult<{ id: string }>>('/ShiftSwap/request', model),

  acceptSwap: (swapId: string) =>
    api.put<ApiResult<boolean>>(`/ShiftSwap/${swapId}/accept`),

  approveSwap: (swapId: string) =>
    api.put<ApiResult<boolean>>(`/ShiftSwap/${swapId}/approve`),

  assignSwap: (swapId: string, acceptorId: string) =>
    api.put<ApiResult<boolean>>(`/ShiftSwap/${swapId}/assign/${acceptorId}`),

  getPending: () =>
    api.get<ApiResult<ShiftSwapResponseModel[]>>('/ShiftSwap/pending'),

  getByUser: (userId: string) =>
    api.get<ApiResult<ShiftSwapResponseModel[]>>(`/ShiftSwap/user/${userId}`),
};

// ===========================
// LEAVE REQUEST
// ===========================
export const leaveRequestService = {
  create: (model: CreateLeaveRequestModel) =>
    api.post<ApiResult<{ id: string }>>('/LeaveRequest', model),

  respond: (id: string, model: UpdateLeaveRequestModel) =>
    api.put<ApiResult<boolean>>(`/LeaveRequest/${id}/respond`, model),

  getById: (id: string) =>
    api.get<ApiResult<LeaveRequestResponseModel>>(`/LeaveRequest/${id}`),

  getByUser: (userId: string) =>
    api.get<ApiResult<LeaveRequestResponseModel[]>>(`/LeaveRequest/user/${userId}`),

  getAll: () =>
    api.get<ApiResult<LeaveRequestResponseModel[]>>('/LeaveRequest/GetAll'),

  getPending: () =>
    api.get<ApiResult<LeaveRequestResponseModel[]>>('/LeaveRequest/pending'),
};

// ===========================
// CERTIFICATION
// ===========================
export const certificationService = {
  add: (model: AddCertificationModel) =>
    api.post<ApiResult<{ id: string }>>('/Certification', model),

  getByUser: (userId: string) =>
    api.get<ApiResult<CertificationResponseModel[]>>(`/Certification/user/${userId}`),

  delete: (id: string) =>
    api.delete<ApiResult<boolean>>(`/Certification/${id}`),
};

// ===========================
// NOTIFICATION
// ===========================
export const notificationService = {
  create: (model: CreateNotificationModel) =>
    api.post<ApiResult<{ id: string }>>('/Notification', model),

  markAsRead: (id: string) =>
    api.put<ApiResult<boolean>>(`/Notification/${id}/read`),

  markAllAsRead: () =>
    api.put<ApiResult<boolean>>('/Notification/read-all'),

  getMy: () =>
    api.get<ApiResult<NotificationResponseModel[]>>('/Notification/my'),

  getMyUnread: () =>
    api.get<ApiResult<NotificationResponseModel[]>>('/Notification/my/unread'),
};