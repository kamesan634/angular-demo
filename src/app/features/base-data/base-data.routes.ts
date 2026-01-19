/**
 * 基礎資料模組路由設定
 */
import { Routes } from '@angular/router';

export const BASE_DATA_ROUTES: Routes = [
  {
    path: 'products',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./products/product-list/product-list.component').then(m => m.ProductListComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./products/product-form/product-form.component').then(m => m.ProductFormComponent),
        data: { mode: 'create' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./products/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./products/product-form/product-form.component').then(m => m.ProductFormComponent),
        data: { mode: 'edit' },
      },
    ],
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./categories/category-list/category-list.component').then(m => m.CategoryListComponent),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./customers/customer-list/customer-list.component').then(m => m.CustomerListComponent),
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./suppliers/supplier-list/supplier-list.component').then(m => m.SupplierListComponent),
  },
  {
    path: 'stores',
    loadComponent: () =>
      import('./stores/store-list/store-list.component').then(m => m.StoreListComponent),
  },
  {
    path: 'warehouses',
    loadComponent: () =>
      import('./warehouses/warehouse-list/warehouse-list.component').then(m => m.WarehouseListComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/user-list/user-list.component').then(m => m.UserListComponent),
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./roles/role-list/role-list.component').then(m => m.RoleListComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
];
