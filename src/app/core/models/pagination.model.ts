/**
 * 分頁相關資料模型
 */

/**
 * 分頁狀態
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * 分頁事件 (PrimeNG 相容)
 */
export interface PageEvent {
  first: number; // 起始索引
  rows: number; // 每頁筆數
  page?: number; // 頁碼 (0-based)
  pageCount?: number; // 總頁數
}

/**
 * 排序事件 (PrimeNG 相容)
 */
export interface SortEvent {
  field: string;
  order: 1 | -1; // 1: 升冪, -1: 降冪
}

/**
 * 篩選條件
 */
export interface FilterCondition {
  field: string;
  value: unknown;
  matchMode: FilterMatchMode;
}

/**
 * 篩選模式
 */
export type FilterMatchMode =
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'between'
  | 'dateIs'
  | 'dateIsNot'
  | 'dateBefore'
  | 'dateAfter';

/**
 * 表格狀態
 */
export interface TableState {
  pagination: PaginationState;
  sortField?: string;
  sortOrder?: 1 | -1;
  filters?: Record<string, FilterCondition>;
  globalFilter?: string;
}

/**
 * 表格查詢參數轉換結果
 */
export interface TableQueryParams {
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  [key: string]: unknown;
}
