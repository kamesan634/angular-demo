/**
 * 報表模組路由設定
 */
import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: 'sales',
    loadComponent: () =>
      import('./sales-report/sales-report.component').then(m => m.SalesReportComponent),
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./inventory-report/inventory-report.component').then(m => m.InventoryReportComponent),
  },
  {
    path: 'financial',
    loadComponent: () =>
      import('./financial-report/financial-report.component').then(m => m.FinancialReportComponent),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./templates/template-list/template-list.component').then(m => m.TemplateListComponent),
  },
  {
    path: 'schedules',
    loadComponent: () =>
      import('./schedules/schedule-list/schedule-list.component').then(m => m.ScheduleListComponent),
  },
  {
    path: '',
    redirectTo: 'sales',
    pathMatch: 'full',
  },
];
