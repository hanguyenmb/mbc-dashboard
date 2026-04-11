export type UserRole = "admin" | "viewer" | "teams_only";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  teamId: string | null;
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  leaderId: string;
  members: string[];
}

export interface KPIRecord {
  userId: string;
  period: string; // "2025-Q1", "2025-01"
  revenue: number;
  orders: number;
  customers: number;
  target: {
    revenue: number;
    orders: number;
    customers: number;
  };
  services: ServiceBreakdown[];
}

export interface ServiceBreakdown {
  name: string;
  revenue: number;
}

export interface TeamKPI {
  teamId: string;
  teamName: string;
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  target: {
    revenue: number;
    orders: number;
    customers: number;
  };
  members: MemberKPI[];
}

export interface MemberKPI {
  userId: string;
  name: string;
  revenue: number;
  orders: number;
  customers: number;
  target: {
    revenue: number;
    orders: number;
    customers: number;
  };
}

export interface ImportLog {
  id: string;
  filename: string;
  importedAt: string;
  importedBy: string;
  rowCount: number;
  status: "success" | "error" | "partial";
  notes?: string;
}

export type TaskStatus = "done" | "inprogress" | "notstarted";

export interface WeeklyTask {
  id: string;
  title: string;
  description?: string;
  notes?: string;   // Ghi chú chi tiết
  category: string;
  status: TaskStatus;
  progress: number; // 0-100
  weekKey: string;  // "2026-W12"
}

export interface WeeklyCategory {
  id: string;
  name: string;
  color: string;
}

export interface TeamServiceRecord {
  teamId: string;
  teamName: string;
  region: "HN" | "HCM";
  revenue: number;       // tổng DS (triệu VNĐ)
  target: number;        // mục tiêu tổng
  customerCount: number;     // tổng KH (ĐKM + gia hạn)
  customerCountDkm?: number; // KH đăng ký mới
  hostMail: number;
  msgws: number;
  tenMien: number;
  transferGws: number;
  saleAi: number;
  elastic: number;
  cloudServer: number;
  [key: string]: any;    // dynamic service fields
}

export interface ServiceConfig {
  key: string;    // stable field key (used in TeamServiceRecord)
  label: string;  // display name — editable
  color: string;  // chart color
}

export const DEFAULT_SERVICE_CONFIG: ServiceConfig[] = [
  { key: "hostMail",    label: "Host/Mail",    color: "#60A5FA" },
  { key: "msgws",       label: "MS/GWS",       color: "#34D399" },
  { key: "tenMien",     label: "Tên miền",     color: "#FCD34D" },
  { key: "transferGws", label: "Transfer GWS", color: "#C084FC" },
  { key: "saleAi",      label: "Sale AI",      color: "#F87171" },
  { key: "elastic",     label: "Elastic",      color: "#38BDF8" },
  { key: "cloudServer", label: "Cloud Server", color: "#F97316" },
];

export type TeamMonthlyData = { month: string; teams: TeamServiceRecord[]; prevYearRevenue?: number }[];

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  plan: string[];
}
