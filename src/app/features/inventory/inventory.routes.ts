/**
 * 庫存模組路由設定
 */
import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./inventory-list/inventory-list.component').then(m => m.InventoryListComponent),
  },
  {
    path: 'adjustments',
    loadComponent: () =>
      import('./adjustments/adjustment-list/adjustment-list.component').then(m => m.AdjustmentListComponent),
  },
  {
    path: 'stock-counts',
    loadComponent: () =>
      import('./stock-counts/stock-count-list/stock-count-list.component').then(m => m.StockCountListComponent),
  },
  {
    path: 'transfers',
    loadComponent: () =>
      import('./transfers/transfer-list/transfer-list.component').then(m => m.TransferListComponent),
  },
  {
    path: 'movements',
    loadComponent: () =>
      import('./movements/movement-list/movement-list.component').then(m => m.MovementListComponent),
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
];
