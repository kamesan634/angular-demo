/**
 * 應用程式路由設定
 */
import { Routes } from '@angular/router';
import { authGuard } from '@core/guards';
import { MainLayoutComponent } from '@layout/main-layout/main-layout.component';

export const routes: Routes = [
  // 認證相關頁面 (無需版面配置)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  // 主要應用程式頁面 (需要版面配置與認證)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'base-data',
        loadChildren: () => import('./features/base-data/base-data.routes').then(m => m.BASE_DATA_ROUTES),
      },
      {
        path: 'sales',
        loadChildren: () => import('./features/sales/sales.routes').then(m => m.SALES_ROUTES),
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES),
      },
      {
        path: 'purchasing',
        loadChildren: () => import('./features/purchasing/purchasing.routes').then(m => m.PURCHASING_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  // 錯誤頁面
  {
    path: 'error/403',
    loadComponent: () => import('./features/error/forbidden/forbidden.component').then(m => m.ForbiddenComponent),
  },
  {
    path: 'error/404',
    loadComponent: () => import('./features/error/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  // 未匹配的路由
  {
    path: '**',
    redirectTo: 'error/404',
  },
];
