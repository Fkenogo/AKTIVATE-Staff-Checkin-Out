
export type UserRole = 'employee' | 'manager' | 'hr';
export type CheckMethod = 'qr_scan' | 'manual';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  is_approved: boolean;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in_time: string;
  check_out_time?: string;
  check_in_method: CheckMethod;
  check_out_method?: CheckMethod;
  location_gps: { lat: number; lng: number };
  is_late: boolean;
  manual_reason?: string;
  manual_checkout_reason?: string;
  late_reason?: string;
  status: RequestStatus; 
  checkout_status?: RequestStatus;
}

export interface QRCodeData {
  id: string;
  qr_data: string;
  valid_until: string;
  is_active: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
}
