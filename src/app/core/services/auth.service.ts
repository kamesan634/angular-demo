/**
 * 認證服務
 * 處理登入、登出、Token 管理與自動刷新機制
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of, timer } from 'rxjs';
import { tap, catchError, switchMap, filter, take, map } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  LoginRequest,
  LoginResponse,
  TokenInfo,
  ChangePasswordRequest,
  JwtPayload,
} from '@core/models';
import { User } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // API 端點
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Token 狀態管理
  private tokenInfo = signal<TokenInfo | null>(null);
  private currentUser = signal<User | null>(null);

  // Token 刷新狀態
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  // Token 刷新定時器
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  // 公開的計算屬性
  readonly isAuthenticated = computed(() => !!this.tokenInfo()?.accessToken);
  readonly user = computed(() => this.currentUser());
  readonly accessToken = computed(() => this.tokenInfo()?.accessToken || null);

  constructor() {
    // 初始化時從 localStorage 載入 Token
    this.loadStoredToken();
  }

  /**
   * 登入
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login-json`, credentials).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
      }),
      catchError(error => {
        console.error('登入失敗:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 登出
   */
  logout(): Observable<void> {
    const refreshToken = this.tokenInfo()?.refreshToken;

    // 清除本地狀態
    this.clearAuthState();

    if (!refreshToken) {
      this.router.navigate(['/auth/login']);
      return of(undefined);
    }

    return this.http.post<void>(`${this.apiUrl}/logout`, { refresh_token: refreshToken }).pipe(
      tap(() => {
        this.router.navigate(['/auth/login']);
      }),
      catchError(() => {
        // 即使 API 呼叫失敗，也導向登入頁
        this.router.navigate(['/auth/login']);
        return of(undefined);
      })
    );
  }

  /**
   * 刷新 Token
   */
  refreshAccessToken(): Observable<LoginResponse> {
    if (this.isRefreshing) {
      // 如果正在刷新，等待刷新完成
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => of(this.createLoginResponseFromTokenInfo()))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const refreshToken = this.tokenInfo()?.refreshToken;

    if (!refreshToken) {
      this.isRefreshing = false;
      return throwError(() => new Error('無刷新 Token'));
    }

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(response => {
          this.isRefreshing = false;
          this.handleLoginSuccess(response);
          this.refreshTokenSubject.next(response.access_token);
        }),
        catchError(error => {
          this.isRefreshing = false;
          this.clearAuthState();
          this.router.navigate(['/auth/login']);
          return throwError(() => error);
        })
      );
  }

  /**
   * 取得當前使用者資訊
   */
  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
      }),
      catchError(error => {
        console.error('取得使用者資訊失敗:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 變更密碼
   */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, request);
  }

  /**
   * 檢查是否需要刷新 Token
   */
  shouldRefreshToken(): boolean {
    const tokenInfo = this.tokenInfo();
    if (!tokenInfo) return false;

    const now = Date.now();
    const timeUntilExpiry = tokenInfo.expiresAt - now;

    return timeUntilExpiry < environment.tokenRefreshThreshold && timeUntilExpiry > 0;
  }

  /**
   * 檢查 Token 是否已過期
   */
  isTokenExpired(): boolean {
    const tokenInfo = this.tokenInfo();
    if (!tokenInfo) return true;

    return Date.now() >= tokenInfo.expiresAt;
  }

  /**
   * 檢查使用者是否有指定角色
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.roles.some(r => r.name === role);
  }

  /**
   * 檢查使用者是否有任一指定角色
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * 檢查使用者是否有指定權限
   */
  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.roles.some(r => r.permissions.includes(permission));
  }

  /**
   * 處理登入成功
   */
  private handleLoginSuccess(response: LoginResponse): void {
    const payload = this.parseJwt(response.access_token);
    const expiresAt = payload ? payload.exp * 1000 : Date.now() + response.expires_in * 1000;

    const tokenInfo: TokenInfo = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
    };

    // 更新狀態
    this.tokenInfo.set(tokenInfo);

    // 儲存到 localStorage
    this.saveTokenToStorage(tokenInfo);

    // 設定自動刷新定時器
    this.scheduleTokenRefresh(expiresAt);

    // 載入使用者資訊
    this.fetchCurrentUser().subscribe();
  }

  /**
   * 設定 Token 自動刷新定時器
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    // 清除現有定時器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const now = Date.now();
    // 在過期前 5 分鐘刷新
    const refreshTime = expiresAt - environment.tokenRefreshThreshold - now;

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshAccessToken().subscribe();
      }, refreshTime);
    }
  }

  /**
   * 從 localStorage 載入 Token
   */
  private loadStoredToken(): void {
    const accessToken = localStorage.getItem(environment.tokenKey);
    const refreshToken = localStorage.getItem(environment.refreshTokenKey);
    const expiresAtStr = localStorage.getItem('token_expires_at');

    if (accessToken && refreshToken && expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);

      // 檢查 Token 是否已過期
      if (Date.now() < expiresAt) {
        const tokenInfo: TokenInfo = {
          accessToken,
          refreshToken,
          expiresAt,
        };
        this.tokenInfo.set(tokenInfo);
        this.scheduleTokenRefresh(expiresAt);

        // 載入使用者資訊
        this.fetchCurrentUser().subscribe();
      } else {
        // Token 已過期，嘗試刷新
        this.tokenInfo.set({
          accessToken,
          refreshToken,
          expiresAt,
        });
        this.refreshAccessToken().subscribe({
          error: () => {
            this.clearAuthState();
          },
        });
      }
    }
  }

  /**
   * 儲存 Token 到 localStorage
   */
  private saveTokenToStorage(tokenInfo: TokenInfo): void {
    localStorage.setItem(environment.tokenKey, tokenInfo.accessToken);
    localStorage.setItem(environment.refreshTokenKey, tokenInfo.refreshToken);
    localStorage.setItem('token_expires_at', tokenInfo.expiresAt.toString());
  }

  /**
   * 清除認證狀態
   */
  private clearAuthState(): void {
    // 清除定時器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // 清除狀態
    this.tokenInfo.set(null);
    this.currentUser.set(null);

    // 清除 localStorage
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem('token_expires_at');
  }

  /**
   * 解析 JWT Token
   */
  private parseJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * 從目前的 tokenInfo 建立 LoginResponse
   */
  private createLoginResponseFromTokenInfo(): LoginResponse {
    const info = this.tokenInfo();
    return {
      access_token: info?.accessToken || '',
      refresh_token: info?.refreshToken || '',
      token_type: 'bearer',
      expires_in: info ? Math.floor((info.expiresAt - Date.now()) / 1000) : 0,
    };
  }
}
