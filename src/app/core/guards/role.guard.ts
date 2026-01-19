/**
 * 角色守衛
 * 檢查使用者是否具有指定角色
 */
import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * 角色守衛
 * 路由設定時需在 data 中指定 roles 陣列
 *
 * @example
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard],
 *   data: { roles: ['admin', 'manager'] }
 * }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 取得路由設定的角色要求
  const requiredRoles = route.data['roles'] as string[] | undefined;

  // 如果沒有設定角色要求，直接通過
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // 檢查使用者是否具有任一要求的角色
  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  // 權限不足，導向 403 頁面或首頁
  return router.createUrlTree(['/error/403']);
};

/**
 * 權限守衛
 * 檢查使用者是否具有指定權限
 *
 * @example
 * {
 *   path: 'products',
 *   component: ProductsComponent,
 *   canActivate: [permissionGuard],
 *   data: { permissions: ['product:read', 'product:write'] }
 * }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 取得路由設定的權限要求
  const requiredPermissions = route.data['permissions'] as string[] | undefined;

  // 如果沒有設定權限要求，直接通過
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // 檢查使用者是否具有所有要求的權限
  const hasAllPermissions = requiredPermissions.every(permission =>
    authService.hasPermission(permission)
  );

  if (hasAllPermissions) {
    return true;
  }

  // 權限不足，導向 403 頁面
  return router.createUrlTree(['/error/403']);
};
