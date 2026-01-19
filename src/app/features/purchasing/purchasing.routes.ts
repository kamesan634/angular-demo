/**
 * 採購模組路由設定
 */
import { Routes } from '@angular/router';

export const PURCHASING_ROUTES: Routes = [
  {
    path: 'suggestions',
    loadComponent: () =>
      import('./suggestions/suggestion-list/suggestion-list.component').then(m => m.SuggestionListComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./orders/purchase-order-list/purchase-order-list.component').then(m => m.PurchaseOrderListComponent),
  },
  {
    path: 'receipts',
    loadComponent: () =>
      import('./receipts/receipt-list/receipt-list.component').then(m => m.ReceiptListComponent),
  },
  {
    path: 'returns',
    loadComponent: () =>
      import('./returns/purchase-return-list/purchase-return-list.component').then(m => m.PurchaseReturnListComponent),
  },
  {
    path: '',
    redirectTo: 'orders',
    pathMatch: 'full',
  },
];
