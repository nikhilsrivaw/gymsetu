export type UserRole = 'gym_owner' | 'staff';

export type MemberStatus = 'active' | 'expired' | 'suspended' | 'inactive';

export type MemberGoal = 'weight_loss' | 'muscle_gain' | 'general_fitness' | 'other';

export type Gender = 'male' | 'female' | 'other';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';

export type PaymentType = 'full' | 'partial';

export type MemberPlanStatus = 'active' | 'expired' | 'cancelled';

export interface Gym {
  id: string;
  name: string;
  owner_id: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  gym_id: string | null;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  profile_photo_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: MemberGoal | null;
  join_date: string;
  status: MemberStatus;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  duration_days: number;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MemberPlan {
  id: string;
  member_id: string;
  gym_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: MemberPlanStatus;
  created_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  member_plan_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  receipt_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  gym_id: string;
  member_id: string;
  check_in_date: string;
  check_in_time: string | null;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
}

export interface StaffPermission {
  id: string;
  profile_id: string;
  gym_id: string;
  can_manage_members: boolean;
  can_record_payments: boolean;
  can_mark_attendance: boolean;
  can_view_reports: boolean;
  can_manage_plans: boolean;
  created_at: string;
}
