// Mock data for Reports & Analytics (Supabase offline)

export const revenueMonthly = [
  { month: 'Sep', amount: 142000 },
  { month: 'Oct', amount: 168000 },
  { month: 'Nov', amount: 155000 },
  { month: 'Dec', amount: 189000 },
  { month: 'Jan', amount: 174000 },
  { month: 'Feb', amount: 196000 },
];

export const revenueByMethod = [
  { method: 'UPI / Google Pay', percent: 52, color: '#4F6EF7' },
  { method: 'Cash', percent: 28, color: '#22C55E' },
  { method: 'Bank Transfer', percent: 14, color: '#F59E0B' },
  { method: 'Card', percent: 6, color: '#EF4444' },
];

export const revenueDailyThisWeek = [
  { day: 'Mon', amount: 8200 },
  { day: 'Tue', amount: 6400 },
  { day: 'Wed', amount: 12500 },
  { day: 'Thu', amount: 9800 },
  { day: 'Fri', amount: 7100 },
  { day: 'Sat', amount: 15300 },
  { day: 'Sun', amount: 3200 },
];

export const memberGrowth = [
  { month: 'Sep', count: 86 },
  { month: 'Oct', count: 102 },
  { month: 'Nov', count: 118 },
  { month: 'Dec', count: 109 },
  { month: 'Jan', count: 131 },
  { month: 'Feb', count: 148 },
];

export const membersByStatus = [
  { label: 'Active', value: 112, color: '#22C55E' },
  { label: 'Expired', value: 24, color: '#EF4444' },
  { label: 'Frozen', value: 12, color: '#F59E0B' },
];

export const membersByGender = [
  { label: 'Male', value: 98, color: '#4F6EF7' },
  { label: 'Female', value: 42, color: '#EC4899' },
  { label: 'Other', value: 8, color: '#F59E0B' },
];

export const membersByGoal = [
  { label: 'Weight Loss', percent: 38, color: '#EF4444' },
  { label: 'Muscle Gain', percent: 32, color: '#4F6EF7' },
  { label: 'General Fitness', percent: 20, color: '#22C55E' },
  { label: 'Rehab / Physio', percent: 10, color: '#F59E0B' },
];

export const attendanceWeekly = [
  { day: 'Mon', count: 64 },
  { day: 'Tue', count: 58 },
  { day: 'Wed', count: 71 },
  { day: 'Thu', count: 55 },
  { day: 'Fri', count: 62 },
  { day: 'Sat', count: 78 },
  { day: 'Sun', count: 34 },
];

export const attendanceMonthly = [
  { month: 'Sep', avg: 52 },
  { month: 'Oct', avg: 58 },
  { month: 'Nov', avg: 61 },
  { month: 'Dec', avg: 48 },
  { month: 'Jan', avg: 66 },
  { month: 'Feb', avg: 70 },
];

export const topConsistentMembers = [
  { name: 'Rahul Sharma', days: 26, avatar: '🏋️' },
  { name: 'Priya Patel', days: 25, avatar: '💪' },
  { name: 'Arjun Reddy', days: 24, avatar: '🔥' },
  { name: 'Sneha Gupta', days: 23, avatar: '⚡' },
  { name: 'Vikram Singh', days: 22, avatar: '🎯' },
];

export const expiringMembers = [
  { id: '1', name: 'Amit Kumar', phone: '+919876543210', plan: '3 Month', expiresIn: 0, avatar: '🔴' },
  { id: '2', name: 'Neha Verma', phone: '+919812345678', plan: '1 Month', expiresIn: 2, avatar: '🟠' },
  { id: '3', name: 'Rohan Das', phone: '+919898765432', plan: '6 Month', expiresIn: 4, avatar: '🟡' },
  { id: '4', name: 'Kavita Joshi', phone: '+919845612378', plan: '1 Month', expiresIn: 5, avatar: '🟡' },
  { id: '5', name: 'Suresh Nair', phone: '+919867543120', plan: '3 Month', expiresIn: 7, avatar: '🟢' },
  { id: '6', name: 'Divya Menon', phone: '+919823456789', plan: '1 Month', expiresIn: 9, avatar: '🟢' },
];

export const quickStats = {
  totalRevenue: 196000,
  revenueTrend: +12.6,
  totalMembers: 148,
  membersTrend: +13.0,
  avgAttendance: 70,
  attendanceTrend: +6.1,
  expiringCount: 6,
};

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}
