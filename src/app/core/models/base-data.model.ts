/**
 * 基礎資料與系統相關資料模型
 */

/**
 * 系統設定
 */
export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  is_public: boolean;
  updated_at: string;
}

/**
 * 更新系統設定請求
 */
export interface UpdateSystemConfigRequest {
  value: string;
}

/**
 * 操作日誌
 */
export interface AuditLog {
  id: number;
  user_id: number;
  user?: import('./user.model').User;
  action: string;
  resource_type: string;
  resource_id?: number;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * 查詢操作日誌參數
 */
export interface AuditLogQueryParams {
  user_id?: number;
  action?: string;
  resource_type?: string;
  resource_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * 編號規則
 */
export interface NumberingRule {
  id: number;
  type: string; // 單據類型 (order, purchase_order, etc.)
  prefix: string;
  suffix?: string;
  padding: number; // 流水號位數
  current_number: number;
  reset_period?: 'daily' | 'monthly' | 'yearly' | 'never';
  last_reset_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立編號規則請求
 */
export interface CreateNumberingRuleRequest {
  type: string;
  prefix: string;
  suffix?: string;
  padding?: number;
  reset_period?: 'daily' | 'monthly' | 'yearly' | 'never';
  is_active?: boolean;
}

/**
 * 更新編號規則請求
 */
export interface UpdateNumberingRuleRequest {
  prefix?: string;
  suffix?: string;
  padding?: number;
  reset_period?: 'daily' | 'monthly' | 'yearly' | 'never';
  is_active?: boolean;
}

/**
 * 班次
 */
export interface Shift {
  id: number;
  store_id: number;
  store?: import('./user.model').Store;
  user_id: number;
  user?: import('./user.model').User;
  start_time: string;
  end_time?: string;
  opening_cash: number;
  closing_cash?: number;
  total_sales?: number;
  total_refunds?: number;
  cash_difference?: number;
  status: ShiftStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 班次狀態
 */
export type ShiftStatus = 'open' | 'closed';

/**
 * 開始班次請求
 */
export interface OpenShiftRequest {
  store_id: number;
  opening_cash: number;
}

/**
 * 結束班次請求
 */
export interface CloseShiftRequest {
  closing_cash: number;
  notes?: string;
}

/**
 * 報表
 */
export interface Report {
  id: number;
  name: string;
  type: ReportType;
  parameters: ReportParameters;
  data: unknown;
  generated_at: string;
  generated_by: number;
  generated_user?: import('./user.model').User;
}

/**
 * 報表類型
 */
export type ReportType =
  | 'sales_daily'
  | 'sales_weekly'
  | 'sales_monthly'
  | 'sales_by_product'
  | 'sales_by_category'
  | 'sales_by_store'
  | 'inventory_status'
  | 'inventory_turnover'
  | 'low_stock'
  | 'revenue'
  | 'profit_loss'
  | 'customer_analysis'
  | 'supplier_analysis';

/**
 * 報表參數
 */
export interface ReportParameters {
  start_date?: string;
  end_date?: string;
  store_id?: number;
  warehouse_id?: number;
  category_id?: number;
  product_id?: number;
  customer_id?: number;
  supplier_id?: number;
  [key: string]: unknown;
}

/**
 * 報表範本
 */
export interface ReportTemplate {
  id: number;
  name: string;
  type: ReportType;
  description?: string;
  default_parameters: ReportParameters;
  layout?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立報表範本請求
 */
export interface CreateReportTemplateRequest {
  name: string;
  type: ReportType;
  description?: string;
  default_parameters?: ReportParameters;
  layout?: Record<string, unknown>;
  is_active?: boolean;
}

/**
 * 排程報表
 */
export interface ReportSchedule {
  id: number;
  template_id: number;
  template?: ReportTemplate;
  name: string;
  schedule_type: ScheduleType;
  schedule_config: ScheduleConfig;
  recipients: string[]; // Email 列表
  parameters: ReportParameters;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 排程類型
 */
export type ScheduleType = 'daily' | 'weekly' | 'monthly';

/**
 * 排程設定
 */
export interface ScheduleConfig {
  time: string; // HH:mm 格式
  day_of_week?: number; // 0-6, 週日到週六 (weekly 用)
  day_of_month?: number; // 1-31 (monthly 用)
}

/**
 * 建立排程報表請求
 */
export interface CreateReportScheduleRequest {
  template_id: number;
  name: string;
  schedule_type: ScheduleType;
  schedule_config: ScheduleConfig;
  recipients: string[];
  parameters?: ReportParameters;
  is_active?: boolean;
}

/**
 * 儀表板資料
 */
export interface DashboardData {
  sales_summary: SalesSummary;
  inventory_alerts: InventoryAlert[];
  recent_orders: import('./order.model').Order[];
  top_products: TopProduct[];
  sales_trend: SalesTrendData[];
}

/**
 * 銷售摘要
 */
export interface SalesSummary {
  today_sales: number;
  today_orders: number;
  week_sales: number;
  week_orders: number;
  month_sales: number;
  month_orders: number;
  year_sales: number;
  year_orders: number;
  sales_growth: number; // 相較上期成長率
}

/**
 * 庫存警示
 */
export interface InventoryAlert {
  product_id: number;
  product_name: string;
  warehouse_id: number;
  warehouse_name: string;
  current_quantity: number;
  min_stock: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
}

/**
 * 熱銷商品
 */
export interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  rank: number;
}

/**
 * 銷售趨勢資料
 */
export interface SalesTrendData {
  date: string;
  sales: number;
  orders: number;
}

/**
 * 選單項目
 */
export interface MenuItem {
  label: string;
  icon?: string;
  routerLink?: string;
  items?: MenuItem[];
  visible?: boolean;
  disabled?: boolean;
  separator?: boolean;
  badge?: string | number;
  badgeClass?: string;
  roles?: string[]; // 允許的角色
  permissions?: string[]; // 允許的權限
}

/**
 * 通知
 */
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

/**
 * 通知類型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
