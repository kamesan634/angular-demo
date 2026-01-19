/**
 * 認證攔截器
 * 自動在 HTTP 請求中加入 Authorization Header
 * 處理 Token 自動刷新
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  // 不需要認證的端點
  const excludedUrls = ['/auth/login', '/auth/login-json', '/auth/refresh', '/auth/forgot-password'];

  // 檢查是否為不需要認證的端點
  const isExcluded = excludedUrls.some(url => req.url.includes(url));

  if (isExcluded) {
    return next(req);
  }

  // 檢查是否需要刷新 Token
  if (authService.shouldRefreshToken()) {
    return authService.refreshAccessToken().pipe(
      switchMap(() => {
        const clonedReq = addAuthHeader(req, authService.accessToken());
        return next(clonedReq);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // 加入 Authorization Header
  const accessToken = authService.accessToken();
  if (accessToken) {
    const clonedReq = addAuthHeader(req, accessToken);
    return next(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401 錯誤且非刷新 Token 請求時，嘗試刷新 Token
        if (error.status === 401 && !req.url.includes('/auth/refresh')) {
          return authService.refreshAccessToken().pipe(
            switchMap(() => {
              const retryReq = addAuthHeader(req, authService.accessToken());
              return next(retryReq);
            }),
            catchError(refreshError => {
              // 刷新失敗，由 AuthService 處理登出
              return throwError(() => refreshError);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};

/**
 * 加入認證 Header
 */
function addAuthHeader(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return req;

  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
