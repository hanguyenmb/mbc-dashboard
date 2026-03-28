import { User, Team, KPIRecord, TeamKPI, ImportLog, WeeklyTask, WeeklyCategory } from "./types";

// ── USERS ──────────────────────────────────────────────────────────────────
export const USERS: User[] = [
  {
    id: "u1",
    name: "Admin",
    email: "admin",
    password: "123456@abc",
    role: "manager",
    teamId: null,
    avatar: "A",
  },
  {
    id: "u2",
    name: "Leader",
    email: "leader",
    password: "matbao123",
    role: "leader",
    teamId: "t1",
    avatar: "L",
  },
  {
    id: "u3",
    name: "",
    email: "",
    password: "",
    role: "employee",
    teamId: "t2",
    avatar: "",
  },
  {
    id: "u4",
    name: "",
    email: "",
    password: "",
    role: "employee",
    teamId: "t1",
    avatar: "",
  },
  {
    id: "u5",
    name: "",
    email: "",
    password: "",
    role: "employee",
    teamId: "t1",
    avatar: "",
  },
  {
    id: "u6",
    name: "",
    email: "",
    password: "",
    role: "employee",
    teamId: "t2",
    avatar: "N",
  },
  {
    id: "u7",
    name: "Vũ Thị Mai",
    email: "mai@matbao.net",
    password: "emp123",
    role: "employee",
    teamId: "t2",
    avatar: "M",
  },
];

// ── TEAMS ──────────────────────────────────────────────────────────────────
export const TEAMS: Team[] = [
  { id: "t1", name: "Team Alpha", leaderId: "u2", members: ["u4", "u5"] },
  { id: "t2", name: "Team Beta", leaderId: "u3", members: ["u6", "u7"] },
];

// ── MONTHLY DATA (tỷ VNĐ) ───────────────────────────────────────────────────
// HN + HCM = Kết quả chung | null = chưa có dữ liệu
export const MONTHLY_DATA = [
  { month: "T1",  cumKy: 10.23, mt8: 16.03, mt10: 16.50, hn: 6.45,  hcm: 10.24 },
  { month: "T2",  cumKy: 16.32, mt8: 12.60, mt10: 12.70, hn: 5.10,  hcm: 8.93  },
  { month: "T3",  cumKy: 24.16, mt8: 26.06, mt10: 26.58, hn: 9.05,  hcm: 15.75 },
  { month: "T4",  cumKy: 21.19, mt8: 22.86, mt10: 23.31, hn: null,  hcm: null  },
  { month: "T5",  cumKy: 21.65, mt8: 23.35, mt10: 23.82, hn: null,  hcm: null  },
  { month: "T6",  cumKy: 22.92, mt8: 24.72, mt10: 25.21, hn: null,  hcm: null  },
  { month: "T7",  cumKy: 21.25, mt8: 22.92, mt10: 23.38, hn: null,  hcm: null  },
  { month: "T8",  cumKy: 23.09, mt8: 24.90, mt10: 25.39, hn: null,  hcm: null  },
  { month: "T9",  cumKy: 20.93, mt8: 22.58, mt10: 23.03, hn: null,  hcm: null  },
  { month: "T10", cumKy: 20.37, mt8: 21.97, mt10: 22.41, hn: null,  hcm: null  },
  { month: "T11", cumKy: 20.18, mt8: 21.76, mt10: 22.20, hn: null,  hcm: null  },
  { month: "T12", cumKy: 23.49, mt8: 25.34, mt10: 25.84, hn: null,  hcm: null  },
];

// ── QUARTERLY DATA ───────────────────────────────────────────────────────────
export const QUARTERLY_DATA = [
  { quy: "Q1", nam2025: 50.71, nam2026: 55.52, mt8: 54.69, mt10: 55.78, tlMt8: 101.52, tlMt10: 99.53, tangTruong: 109.49 },
  { quy: "Q2", nam2025: 65.76, nam2026: null,  mt8: 70.93, mt10: 72.34, tlMt8: 0,      tlMt10: 0,     tangTruong: 0      },
  { quy: "Q3", nam2025: 65.27, nam2026: null,  mt8: 70.40, mt10: 71.80, tlMt8: 0,      tlMt10: 0,     tangTruong: 0      },
  { quy: "Q4", nam2025: null,  nam2026: null,  mt8: null,  mt10: null,  tlMt8: 0,      tlMt10: 0,     tangTruong: 0      },
];

// ── ĐĂNG KÝ MỚI vs GIA HẠN theo tháng (tỷ VNĐ) ────────────────────────────
export const REVENUE_TYPE = [
  { month: "T1", dangKyMoi: 6.059, giaHan: 10.630, dkHn: 2.656, dkHcm: 3.403, ghHn: 3.797, ghHcm: 6.833 },
  { month: "T2", dangKyMoi: 3.675, giaHan: 10.358, dkHn: 1.689, dkHcm: 1.986, ghHn: 3.406, ghHcm: 6.952 },
  { month: "T3", dangKyMoi: 8.607, giaHan: 16.250, dkHn: 3.802, dkHcm: 4.805, ghHn: 5.261, ghHcm: 10.989 },
];

// ── 6 NHÓM DỊCH VỤ — dữ liệu theo tháng (Triệu VNĐ) ────────────────────────
export const SERVICE_MONTHLY = [
  {
    month: "T1",
    hostMail: 930,    msgws: 2195.8, tenMien: 2488.6, transferGws: 442,   saleAi: 2.5,  elastic: 3.5,
    hn:  { hostMail: 361,   msgws: 878.6,  tenMien: 1021.5, transferGws: 392.1, saleAi: 2.5, elastic: 0.7 },
    hcm: { hostMail: 569,   msgws: 1317.2, tenMien: 1467.1, transferGws: 49.9,  saleAi: 0,   elastic: 2.8 },
  },
  {
    month: "T2",
    hostMail: 589.6,  msgws: 1073.6, tenMien: 1711.3, transferGws: 300.6, saleAi: 6.7,  elastic: 7.5,
    hn:  { hostMail: 235.4, msgws: 498.7,  tenMien: 698.3,  transferGws: 256.8, saleAi: 0,   elastic: 1.7 },
    hcm: { hostMail: 354.2, msgws: 574.9,  tenMien: 1013,   transferGws: 43.8,  saleAi: 6.7, elastic: 5.8 },
  },
  {
    month: "T3",
    hostMail: 1470,   msgws: 2665.9, tenMien: 3185.3, transferGws: 1278,  saleAi: 5,    elastic: 28,
    hn:  { hostMail: 564.6, msgws: 1136.9, tenMien: 1424,   transferGws: 673.4, saleAi: 0.7, elastic: 1.9 },
    hcm: { hostMail: 905.4, msgws: 1529,   tenMien: 1761.3, transferGws: 604.6, saleAi: 4.3, elastic: 26.1 },
  },
];

// ── Q1 TOTALS cho donut chart ────────────────────────────────────────────────
export const SERVICE_GROUPS = [
  { name: "Hosting/Email",      value: 2989.6, color: "#0066CC" },
  { name: "MS/GWS",             value: 5935.3, color: "#10B981" },
  { name: "Tên miền + DV khác", value: 7385.2, color: "#F59E0B" },
  { name: "Transfer GWS",       value: 2020.6, color: "#8B5CF6" },
  { name: "Sale AI",            value: 14.2,   color: "#EF4444" },
  { name: "Elastic",            value: 39,     color: "#06B6D4" },
];

// ── MONTHLY KPI DATA (legacy - kept for compatibility) ───────────────────────
export const MONTHLY_OVERVIEW = [
  { month: "T1/25", gross: 1250, net: 980, target: 1100 },
  { month: "T2/25", gross: 1380, net: 1050, target: 1100 },
  { month: "T3/25", gross: 1520, net: 1180, target: 1150 },
  { month: "T4/25", gross: 1420, net: 1090, target: 1150 },
  { month: "T5/25", gross: 1680, net: 1310, target: 1200 },
  { month: "T6/25", gross: 1790, net: 1420, target: 1200 },
];

// ── OVERVIEW KPIs ───────────────────────────────────────────────────────────
export const OVERVIEW_KPIs = {
  period: "Q1/2025",
  grossRevenue: 4077_000_000,
  netRevenue: 1407_000_000,
  customers: 1009,
  orders: 1394,
  arpc: 4_000_000,
  aov: 2_900_000,
  targets: {
    grossRevenue: 2324_000_000,
    netRevenue: 2324_000_000,
    customers: 1350,
    orders: 1800,
    arpc: 3_500_000,
    aov: 2_500_000,
  },
  growth: {
    gross: 12.5,
    net: 0,
    customers: 4.5,
    orders: 3.1,
    arpc: 5.2,
    aov: 7.2,
  },
};

// ── SERVICE BREAKDOWN (legacy) ───────────────────────────────────────────────
export const SERVICES = [
  { name: "Domain", revenue: 520, color: "#0066CC" },
  { name: "Hosting & Cloud", revenue: 890, color: "#10B981" },
  { name: "Email Pro", revenue: 727, color: "#8B5CF6" },
  { name: "SSL / Chứng thư", revenue: 1308, color: "#F59E0B" },
  { name: "HĐDT", revenue: 341, color: "#EF4444" },
  { name: "Microsoft 365", revenue: 280, color: "#06B6D4" },
  { name: "Google Workspace", revenue: 195, color: "#EC4899" },
  { name: "Phần mềm", revenue: 230, color: "#6366F1" },
  { name: "Khác", revenue: 87, color: "#6B7280" },
];

// ── TEAM KPIs ───────────────────────────────────────────────────────────────
export const TEAM_KPIs: TeamKPI[] = [
  {
    teamId: "t1",
    teamName: "Team Alpha",
    period: "Q1/2025",
    revenue: 819_000_000,
    orders: 560,
    customers: 412,
    target: { revenue: 1_000_000_000, orders: 700, customers: 550 },
    members: [
      {
        userId: "u4",
        name: "Lê Minh Tuấn",
        revenue: 480_000_000,
        orders: 320,
        customers: 235,
        target: { revenue: 550_000_000, orders: 380, customers: 280 },
      },
      {
        userId: "u5",
        name: "Phạm Thị Lan",
        revenue: 339_000_000,
        orders: 240,
        customers: 177,
        target: { revenue: 450_000_000, orders: 320, customers: 270 },
      },
    ],
  },
  {
    teamId: "t2",
    teamName: "Team Beta",
    period: "Q1/2025",
    revenue: 374_000_000,
    orders: 298,
    customers: 220,
    target: { revenue: 500_000_000, orders: 400, customers: 300 },
    members: [
      {
        userId: "u6",
        name: "Hoàng Văn Nam",
        revenue: 210_000_000,
        orders: 168,
        customers: 125,
        target: { revenue: 270_000_000, orders: 220, customers: 160 },
      },
      {
        userId: "u7",
        name: "Vũ Thị Mai",
        revenue: 164_000_000,
        orders: 130,
        customers: 95,
        target: { revenue: 230_000_000, orders: 180, customers: 140 },
      },
    ],
  },
];

// ── SOURCE DATA ─────────────────────────────────────────────────────────────
export const SOURCE_DATA = [
  { name: "CTV đặc biệt", value: 1335, color: "#EF4444" },
  { name: "CTV công ty", value: 615, color: "#8B5CF6" },
  { name: "Khách hàng cũ", value: 371, color: "#06B6D4" },
  { name: "Khách giới thiệu", value: 63, color: "#EC4899" },
  { name: "Kênh chat", value: 48, color: "#10B981" },
  { name: "Gia hạn HT", value: 66, color: "#6B7280" },
  { name: "CTV cá nhân", value: 36, color: "#F59E0B" },
  { name: "Khách tự tìm", value: 20, color: "#0066CC" },
  { name: "Affiliate", value: 9, color: "#34D399" },
  { name: "matbao.in", value: 16, color: "#60A5FA" },
  { name: "MBI Online", value: 14, color: "#A78BFA" },
  { name: "Điện thoại", value: 22, color: "#FCD34D" },
  { name: "Yêu cầu PB", value: 11, color: "#F87171" },
  { name: "Đại lý", value: 7, color: "#4ADE80" },
];

// ── WEEKLY CATEGORIES ────────────────────────────────────────────────────────
export const WEEKLY_CATEGORIES: WeeklyCategory[] = [
  { id: "doanh-so",     name: "Doanh số",             color: "#3b82f6" },
  { id: "van-hanh",     name: "Vận hành",             color: "#10b981" },
  { id: "phat-trien",   name: "Phát triển dịch vụ",   color: "#8b5cf6" },
  { id: "doi-tac",      name: "Đối tác",              color: "#f59e0b" },
  { id: "noi-bo",       name: "Nội bộ",               color: "#06b6d4" },
];

// ── WEEKLY TASKS ─────────────────────────────────────────────────────────────
export const WEEKLY_TASKS: WeeklyTask[] = [
  // ── Tuần 12 (22/03 – 28/03/2026) ──────────────────────────────────────────
  {
    id: "w12-1", weekKey: "2026-W12", category: "doanh-so",
    title: "Mục tiêu Doanh số tuần 5,5 tỷ",
    description: "Doanh số toàn quốc tuần 4 tháng 3",
    status: "inprogress", progress: 63,
  },
  {
    id: "w12-2", weekKey: "2026-W12", category: "doanh-so",
    title: "Lộ trình doanh số tháng 03: 87%",
    description: "Theo dõi và thúc đẩy lộ trình đạt mục tiêu tháng",
    status: "inprogress", progress: 58,
  },
  {
    id: "w12-3", weekKey: "2026-W12", category: "van-hanh",
    title: "Thực hành các công việc bàn giao các hạng mục từ anh Hiến",
    description: "Tiếp nhận và xử lý toàn bộ hạng mục bàn giao",
    status: "inprogress", progress: 61,
  },
  {
    id: "w12-4", weekKey: "2026-W12", category: "van-hanh",
    title: "Tiếp nhận xử lý các Task tồn đọng từ anh Hiến liên quan tới DE",
    description: "Xử lý tồn đọng từ tuần trước",
    status: "inprogress", progress: 40,
  },
  {
    id: "w12-5", weekKey: "2026-W12", category: "phat-trien",
    title: "Task liên quan tới Email thông báo dịch vụ mới",
    description: "Cập nhật template và gửi email thông báo",
    status: "inprogress", progress: 21,
  },
  {
    id: "w12-6", weekKey: "2026-W12", category: "phat-trien",
    title: "Đưa dịch vụ Workflow automation lên trên mbn phần dịch vụ GWS + luồng đặt hàng",
    description: "Tích hợp workflow automation vào trang dịch vụ",
    status: "inprogress", progress: 35,
  },
  {
    id: "w12-7", weekKey: "2026-W12", category: "phat-trien",
    title: "Sale AI: Tách riêng quản lý chat trên kênh SaleAI riêng và huấn luyện riêng",
    description: "Phát triển kênh Sale AI độc lập",
    status: "inprogress", progress: 5,
  },
  {
    id: "w12-8", weekKey: "2026-W12", category: "noi-bo",
    title: "Làm trợ lý hỗ trợ trong công việc: quản lý vận hành team, phân tích DL, Đề xuất tính năng",
    description: "Hỗ trợ leader trong quản lý và phân tích",
    status: "inprogress", progress: 20,
  },
  {
    id: "w12-9", weekKey: "2026-W12", category: "doi-tac",
    title: "Ký Hợp tác với 1 đối tác cung cấp các dịch vụ cho chủ shop trên sàn",
    description: "Đàm phán và ký kết hợp tác",
    status: "inprogress", progress: 44,
  },
  {
    id: "w12-10", weekKey: "2026-W12", category: "doi-tac",
    title: "Meeting với 2 đối tác mảng thiết kế phần mềm/crm",
    description: "Họp khảo sát và đánh giá đối tác",
    status: "inprogress", progress: 51,
  },
  // ── Tuần 13 (29/03 – 04/04/2026) — Kế hoạch ────────────────────────────
  {
    id: "w13-1", weekKey: "2026-W13", category: "doanh-so",
    title: "Mục tiêu Doanh số tuần tháng 04",
    description: "Xác định chỉ tiêu doanh số tuần đầu tháng 4",
    status: "notstarted", progress: 0,
  },
  {
    id: "w13-2", weekKey: "2026-W13", category: "van-hanh",
    title: "Tổng kết tháng 03 và lập kế hoạch tháng 04",
    description: "Review Q1 và chuẩn bị kế hoạch Q2",
    status: "notstarted", progress: 0,
  },
  {
    id: "w13-3", weekKey: "2026-W13", category: "phat-trien",
    title: "Ra mắt dịch vụ Workflow automation trên mbn",
    description: "Go-live sau khi hoàn thành tích hợp tuần 12",
    status: "notstarted", progress: 0,
  },
  {
    id: "w13-4", weekKey: "2026-W13", category: "doi-tac",
    title: "Hoàn thiện hợp đồng với đối tác sàn thương mại",
    description: "Ký kết chính thức sau giai đoạn đàm phán",
    status: "notstarted", progress: 0,
  },
];

// ── IMPORT LOGS ─────────────────────────────────────────────────────────────
export const IMPORT_LOGS: ImportLog[] = [
  {
    id: "log1",
    filename: "bao-cao-q1-2025.xlsx",
    importedAt: "2025-04-01T09:00:00",
    importedBy: "admin@matbao.net",
    rowCount: 142,
    status: "success",
  },
  {
    id: "log2",
    filename: "doanh-so-thang3.xlsx",
    importedAt: "2025-03-31T17:30:00",
    importedBy: "admin@matbao.net",
    rowCount: 58,
    status: "partial",
    notes: "3 dòng lỗi định dạng số",
  },
];
