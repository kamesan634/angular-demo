/**
 * 開發環境設定
 */
export const environment = {
  production: false,
  // API 基礎位址
  apiUrl: '/api/v1',
  // Token 自動刷新：距離過期時間少於此值時自動刷新 (毫秒)
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 分鐘
  // Token 儲存鍵名
  tokenKey: 'access_token',
  refreshTokenKey: 'refresh_token',
  // 分頁預設大小
  defaultPageSize: 20,
  // 日期格式
  dateFormat: 'yyyy-MM-dd',
  dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
};
