/**
 * 側邊欄元件
 */
import { Component, inject, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@core/services';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, PanelMenuModule],
  template: `
    <aside class="layout-sidebar" [class.collapsed]="collapsed()">
      <nav class="sidebar-nav">
        <p-panelMenu [model]="visibleMenuItems()" [multiple]="false"></p-panelMenu>
      </nav>
    </aside>
  `,
  styles: [`
    .layout-sidebar {
      position: fixed;
      top: 60px;
      left: 0;
      bottom: 0;
      width: 280px;
      background: var(--surface-card);
      border-right: 1px solid var(--surface-border);
      overflow-y: auto;
      transition: width 0.3s ease, transform 0.3s ease;
      z-index: 999;
    }

    .layout-sidebar.collapsed {
      transform: translateX(-100%);
    }

    .sidebar-nav {
      padding: 1rem 0;
    }

    :host ::ng-deep {
      .p-panelmenu {
        border: none;

        .p-panelmenu-panel {
          border: none;
          margin-bottom: 0;
        }

        .p-panelmenu-header {
          border: none;
          border-radius: 0;

          .p-panelmenu-header-content {
            border: none;
            border-radius: 0;
            background: transparent;

            &:hover {
              background: var(--surface-hover);
            }
          }

          &.p-highlight .p-panelmenu-header-content {
            background: var(--primary-color);
            color: var(--primary-color-text);
          }
        }

        .p-panelmenu-content {
          border: none;
          background: transparent;
          padding: 0;
        }

        .p-menuitem-link {
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border-radius: 0;

          &:hover {
            background: var(--surface-hover);
          }
        }

        .p-menuitem.p-highlight > .p-menuitem-content {
          background: var(--highlight-bg);
        }
      }
    }

    @media screen and (max-width: 991px) {
      .layout-sidebar {
        width: 280px;
        transform: translateX(-100%);
      }

      .layout-sidebar:not(.collapsed) {
        transform: translateX(0);
      }
    }
  `],
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  // 輸入屬性
  collapsed = input<boolean>(false);

  // 完整選單項目
  private readonly menuItems: MenuItem[] = [
    {
      label: '儀表板',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
    },
    {
      label: '基礎資料',
      icon: 'pi pi-database',
      items: [
        { label: '商品管理', icon: 'pi pi-box', routerLink: '/base-data/products' },
        { label: '分類管理', icon: 'pi pi-tags', routerLink: '/base-data/categories' },
        { label: '客戶管理', icon: 'pi pi-users', routerLink: '/base-data/customers' },
        { label: '供應商管理', icon: 'pi pi-truck', routerLink: '/base-data/suppliers' },
        { label: '門市管理', icon: 'pi pi-building', routerLink: '/base-data/stores' },
        { label: '倉庫管理', icon: 'pi pi-warehouse', routerLink: '/base-data/warehouses' },
        { label: '使用者管理', icon: 'pi pi-user', routerLink: '/base-data/users' },
        { label: '角色管理', icon: 'pi pi-shield', routerLink: '/base-data/roles' },
        { label: '系統設定', icon: 'pi pi-cog', routerLink: '/base-data/settings' },
      ],
    },
    {
      label: '銷售管理',
      icon: 'pi pi-shopping-cart',
      items: [
        { label: 'POS 銷售', icon: 'pi pi-desktop', routerLink: '/sales/pos' },
        { label: '訂單管理', icon: 'pi pi-list', routerLink: '/sales/orders' },
        { label: '退貨管理', icon: 'pi pi-replay', routerLink: '/sales/returns' },
        { label: '促銷管理', icon: 'pi pi-percentage', routerLink: '/sales/promotions' },
        { label: '優惠券管理', icon: 'pi pi-ticket', routerLink: '/sales/coupons' },
        { label: '發票管理', icon: 'pi pi-file', routerLink: '/sales/invoices' },
      ],
    },
    {
      label: '庫存管理',
      icon: 'pi pi-inbox',
      items: [
        { label: '庫存查詢', icon: 'pi pi-search', routerLink: '/inventory/list' },
        { label: '庫存調整', icon: 'pi pi-pencil', routerLink: '/inventory/adjustments' },
        { label: '庫存盤點', icon: 'pi pi-check-square', routerLink: '/inventory/stock-counts' },
        { label: '庫存調撥', icon: 'pi pi-arrows-h', routerLink: '/inventory/transfers' },
        { label: '異動紀錄', icon: 'pi pi-history', routerLink: '/inventory/movements' },
      ],
    },
    {
      label: '採購管理',
      icon: 'pi pi-shopping-bag',
      items: [
        { label: '採購建議', icon: 'pi pi-lightbulb', routerLink: '/purchasing/suggestions' },
        { label: '採購單管理', icon: 'pi pi-file-edit', routerLink: '/purchasing/orders' },
        { label: '驗收管理', icon: 'pi pi-check', routerLink: '/purchasing/receipts' },
        { label: '採購退貨', icon: 'pi pi-undo', routerLink: '/purchasing/returns' },
      ],
    },
    {
      label: '報表中心',
      icon: 'pi pi-chart-bar',
      items: [
        { label: '銷售報表', icon: 'pi pi-chart-line', routerLink: '/reports/sales' },
        { label: '庫存報表', icon: 'pi pi-chart-pie', routerLink: '/reports/inventory' },
        { label: '財務報表', icon: 'pi pi-dollar', routerLink: '/reports/financial' },
        { label: '報表範本', icon: 'pi pi-file-pdf', routerLink: '/reports/templates' },
        { label: '排程報表', icon: 'pi pi-calendar', routerLink: '/reports/schedules' },
      ],
    },
  ];

  // 根據權限過濾可見的選單項目
  visibleMenuItems = computed(() => {
    // 目前簡化處理，顯示所有選單
    // 實際應用可根據角色/權限過濾
    return this.menuItems;
  });
}
