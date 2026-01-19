/**
 * 認證守衛
 * 檢查使用者是否已登入
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // 未登入，導向登入頁
  return router.createUrlTree(['/auth/login']);
};

/**
 * 登入頁守衛
 * 已登入的使用者不能訪問登入頁
 */
export const loginGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // 已登入，導向首頁
  return router.createUrlTree(['/dashboard']);
};
