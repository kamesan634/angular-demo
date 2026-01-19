/**
 * 認證相關資料模型
 */

/**
 * 登入請求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登入回應
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Token 資訊
 */
export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

/**
 * 變更密碼請求
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * 重設密碼請求
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * JWT Token 解析後的 Payload
 */
export interface JwtPayload {
  sub: string; // 使用者 ID
  username: string;
  roles: string[];
  exp: number; // 過期時間
  iat: number; // 發行時間
}
