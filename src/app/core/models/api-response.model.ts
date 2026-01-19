/**
 * API 回應相關資料模型
 */

/**
 * 通用 API 回應
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
}

/**
 * API 錯誤
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

/**
 * 分頁 API 回應
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * 列表查詢參數
 */
export interface ListQueryParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 批次操作回應
 */
export interface BatchOperationResponse {
  success_count: number;
  failed_count: number;
  errors?: BatchOperationError[];
}

/**
 * 批次操作錯誤
 */
export interface BatchOperationError {
  id: number | string;
  message: string;
}

/**
 * 匯入回應
 */
export interface ImportResponse {
  total: number;
  success_count: number;
  failed_count: number;
  errors?: ImportError[];
}

/**
 * 匯入錯誤
 */
export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

/**
 * 驗證錯誤詳情 (FastAPI 格式)
 */
export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * HTTP 錯誤回應
 */
export interface HttpErrorResponse {
  detail?: string | ValidationErrorDetail[];
  message?: string;
}
