/**
 * 認證模組路由設定
 */
import { Routes } from '@angular/router';
import { loginGuard, authGuard } from '@core/guards';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [loginGuard],
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
