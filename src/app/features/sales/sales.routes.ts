/**
 * 銷售模組路由設定
 */
import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  {
    path: 'pos',
    loadComponent: () =>
      import('./pos/pos.component').then(m => m.PosComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./orders/order-list/order-list.component').then(m => m.OrderListComponent),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
  },
  {
    path: 'returns',
    loadComponent: () =>
      import('./returns/return-list/return-list.component').then(m => m.ReturnListComponent),
  },
  {
    path: 'promotions',
    loadComponent: () =>
      import('./promotions/promotion-list/promotion-list.component').then(m => m.PromotionListComponent),
  },
  {
    path: 'coupons',
    loadComponent: () =>
      import('./coupons/coupon-list/coupon-list.component').then(m => m.CouponListComponent),
  },
  {
    path: 'invoices',
    loadComponent: () =>
      import('./invoices/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent),
  },
  {
    path: '',
    redirectTo: 'orders',
    pathMatch: 'full',
  },
];
