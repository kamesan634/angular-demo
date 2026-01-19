/**
 * 儀表板頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { PageHeaderComponent } from '@shared/components';
import { DashboardData, SalesSummary, InventoryAlert, TopProduct, Order } from '@core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    ChartModule,
    PageHeaderComponent,
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
  ],
  template: `
    <app-page-header title="儀表板" subtitle="歡迎回來！以下是今日營業概況"></app-page-header>

    <div class="dashboard-grid">
      <!-- 統計卡片 -->
      <div class="stat-cards">
        <p-card styleClass="stat-card">
          <div class="stat-content">
            <div class="stat-icon sales">
              <i class="pi pi-shopping-cart"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">今日銷售額</span>
              @if (isLoading()) {
                <p-skeleton width="120px" height="32px"></p-skeleton>
              } @else {
                <span class="stat-value">{{ salesSummary().today_sales | currency:'TWD':'symbol':'1.0-0' }}</span>
              }
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-change positive">
              <i class="pi pi-arrow-up"></i>
              {{ salesSummary().sales_growth | number:'1.1-1' }}%
            </span>
            <span>較上週同期</span>
          </div>
        </p-card>

        <p-card styleClass="stat-card">
          <div class="stat-content">
            <div class="stat-icon orders">
              <i class="pi pi-file-edit"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">今日訂單數</span>
              @if (isLoading()) {
                <p-skeleton width="80px" height="32px"></p-skeleton>
              } @else {
                <span class="stat-value">{{ salesSummary().today_orders | number }}</span>
              }
            </div>
          </div>
          <div class="stat-footer">
            <span>本月累計：{{ salesSummary().month_orders | number }} 筆</span>
          </div>
        </p-card>

        <p-card styleClass="stat-card">
          <div class="stat-content">
            <div class="stat-icon month">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">本月銷售額</span>
              @if (isLoading()) {
                <p-skeleton width="140px" height="32px"></p-skeleton>
              } @else {
                <span class="stat-value">{{ salesSummary().month_sales | currency:'TWD':'symbol':'1.0-0' }}</span>
              }
            </div>
          </div>
          <div class="stat-footer">
            <span>目標達成率：78%</span>
          </div>
        </p-card>

        <p-card styleClass="stat-card">
          <div class="stat-content">
            <div class="stat-icon alerts">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">庫存警示</span>
              @if (isLoading()) {
                <p-skeleton width="60px" height="32px"></p-skeleton>
              } @else {
                <span class="stat-value warning">{{ inventoryAlerts().length }}</span>
              }
            </div>
          </div>
          <div class="stat-footer">
            <a routerLink="/inventory/list" class="link">查看詳情</a>
          </div>
        </p-card>
      </div>

      <!-- 銷售趨勢圖表 -->
      <div class="chart-section">
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>銷售趨勢 (近 7 天)</h3>
            </div>
          </ng-template>
          @if (isLoading()) {
            <p-skeleton width="100%" height="300px"></p-skeleton>
          } @else {
            <p-chart type="line" [data]="salesChartData" [options]="chartOptions"></p-chart>
          }
        </p-card>
      </div>

      <!-- 最近訂單 -->
      <div class="recent-orders">
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>最近訂單</h3>
              <a routerLink="/sales/orders" pButton label="查看全部" class="p-button-text p-button-sm"></a>
            </div>
          </ng-template>
          @if (isLoading()) {
            <p-skeleton width="100%" height="200px"></p-skeleton>
          } @else {
            <p-table [value]="recentOrders()" [rows]="5" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>訂單編號</th>
                  <th>客戶</th>
                  <th>金額</th>
                  <th>狀態</th>
                  <th>時間</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-order>
                <tr>
                  <td>
                    <a [routerLink]="['/sales/orders', order.id]">{{ order.order_no }}</a>
                  </td>
                  <td>{{ order.customer?.name || '一般客戶' }}</td>
                  <td>{{ order.total_amount | currency:'TWD':'symbol':'1.0-0' }}</td>
                  <td>
                    <p-tag [value]="getStatusLabel(order.status)" [severity]="getStatusSeverity(order.status)"></p-tag>
                  </td>
                  <td>{{ order.created_at | date:'HH:mm' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="text-center">今日尚無訂單</td>
                </tr>
              </ng-template>
            </p-table>
          }
        </p-card>
      </div>

      <!-- 熱銷商品 -->
      <div class="top-products">
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>熱銷商品 Top 5</h3>
            </div>
          </ng-template>
          @if (isLoading()) {
            <p-skeleton width="100%" height="200px"></p-skeleton>
          } @else {
            <p-table [value]="topProducts()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 40px">排名</th>
                  <th>商品名稱</th>
                  <th>銷售數量</th>
                  <th>銷售金額</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-product>
                <tr>
                  <td>
                    <span class="rank-badge" [class]="'rank-' + product.rank">{{ product.rank }}</span>
                  </td>
                  <td>{{ product.product_name }}</td>
                  <td>{{ product.quantity_sold | number }}</td>
                  <td>{{ product.total_revenue | currency:'TWD':'symbol':'1.0-0' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="4" class="text-center">尚無資料</td>
                </tr>
              </ng-template>
            </p-table>
          }
        </p-card>
      </div>

      <!-- 庫存警示 -->
      <div class="inventory-alerts">
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>庫存警示</h3>
              <a routerLink="/inventory/list" pButton label="查看全部" class="p-button-text p-button-sm"></a>
            </div>
          </ng-template>
          @if (isLoading()) {
            <p-skeleton width="100%" height="150px"></p-skeleton>
          } @else {
            @if (inventoryAlerts().length > 0) {
              <ul class="alert-list">
                @for (alert of inventoryAlerts().slice(0, 5); track alert.product_id) {
                  <li class="alert-item">
                    <p-tag
                      [value]="getAlertTypeLabel(alert.alert_type)"
                      [severity]="getAlertTypeSeverity(alert.alert_type)"
                    ></p-tag>
                    <span class="product-name">{{ alert.product_name }}</span>
                    <span class="warehouse">{{ alert.warehouse_name }}</span>
                    <span class="quantity">庫存：{{ alert.current_quantity }}</span>
                  </li>
                }
              </ul>
            } @else {
              <div class="no-alerts">
                <i class="pi pi-check-circle"></i>
                <p>目前無庫存警示</p>
              </div>
            }
          }
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .stat-cards {
      grid-column: span 4;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .chart-section {
      grid-column: span 4;
    }

    .recent-orders {
      grid-column: span 2;
    }

    .top-products {
      grid-column: span 2;
    }

    .inventory-alerts {
      grid-column: span 4;
    }

    :host ::ng-deep .stat-card {
      .p-card-body {
        padding: 1.25rem;
      }
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
        color: white;
      }

      &.sales { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      &.orders { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
      &.month { background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%); }
      &.alerts { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      display: block;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;

      &.warning {
        color: var(--orange-500);
      }
    }

    .stat-footer {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--surface-border);
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-change {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;

      &.positive {
        color: var(--green-500);
      }

      &.negative {
        color: var(--red-500);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .link {
      color: var(--primary-color);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
      background: var(--surface-400);

      &.rank-1 { background: #FFD700; color: #333; }
      &.rank-2 { background: #C0C0C0; color: #333; }
      &.rank-3 { background: #CD7F32; }
    }

    .alert-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);

      &:last-child {
        border-bottom: none;
      }
    }

    .product-name {
      flex: 1;
      font-weight: 500;
    }

    .warehouse {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }

    .quantity {
      font-weight: 600;
      color: var(--orange-500);
    }

    .no-alerts {
      text-align: center;
      padding: 2rem;
      color: var(--text-color-secondary);

      i {
        font-size: 3rem;
        color: var(--green-500);
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0;
      }
    }

    @media screen and (max-width: 1200px) {
      .stat-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media screen and (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .stat-cards,
      .chart-section,
      .recent-orders,
      .top-products,
      .inventory-alerts {
        grid-column: span 1;
      }

      .stat-cards {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  isLoading = signal(true);

  // 模擬資料
  salesSummary = signal<SalesSummary>({
    today_sales: 0,
    today_orders: 0,
    week_sales: 0,
    week_orders: 0,
    month_sales: 0,
    month_orders: 0,
    year_sales: 0,
    year_orders: 0,
    sales_growth: 0,
  });

  recentOrders = signal<Partial<Order>[]>([]);
  topProducts = signal<TopProduct[]>([]);
  inventoryAlerts = signal<InventoryAlert[]>([]);

  // 圖表資料
  salesChartData: unknown;
  chartOptions: unknown;

  ngOnInit(): void {
    this.loadDashboardData();
    this.initChartOptions();
  }

  private loadDashboardData(): void {
    // 模擬 API 載入
    setTimeout(() => {
      this.salesSummary.set({
        today_sales: 125680,
        today_orders: 45,
        week_sales: 856420,
        week_orders: 312,
        month_sales: 3256800,
        month_orders: 1248,
        year_sales: 38560000,
        year_orders: 14580,
        sales_growth: 12.5,
      });

      this.recentOrders.set([
        { id: 1, order_no: 'ORD202401150001', customer: { name: '王小明' } as any, total_amount: 3580, status: 'completed', created_at: new Date().toISOString() },
        { id: 2, order_no: 'ORD202401150002', customer: undefined, total_amount: 1250, status: 'pending', created_at: new Date().toISOString() },
        { id: 3, order_no: 'ORD202401150003', customer: { name: '李美玲' } as any, total_amount: 8960, status: 'processing', created_at: new Date().toISOString() },
        { id: 4, order_no: 'ORD202401150004', customer: { name: '張志明' } as any, total_amount: 2340, status: 'completed', created_at: new Date().toISOString() },
        { id: 5, order_no: 'ORD202401150005', customer: undefined, total_amount: 560, status: 'cancelled', created_at: new Date().toISOString() },
      ]);

      this.topProducts.set([
        { product_id: 1, product_name: '有機鮮奶 1L', quantity_sold: 156, total_revenue: 10920, rank: 1 },
        { product_id: 2, product_name: '法式吐司麵包', quantity_sold: 142, total_revenue: 7100, rank: 2 },
        { product_id: 3, product_name: '經典美式咖啡', quantity_sold: 128, total_revenue: 6400, rank: 3 },
        { product_id: 4, product_name: '香蕉一串', quantity_sold: 98, total_revenue: 4900, rank: 4 },
        { product_id: 5, product_name: '雞胸肉 300g', quantity_sold: 87, total_revenue: 8700, rank: 5 },
      ]);

      this.inventoryAlerts.set([
        { product_id: 1, product_name: '有機鮮奶 1L', warehouse_id: 1, warehouse_name: '總倉', current_quantity: 5, min_stock: 20, alert_type: 'low_stock' },
        { product_id: 2, product_name: '雞蛋一盒', warehouse_id: 1, warehouse_name: '總倉', current_quantity: 0, min_stock: 50, alert_type: 'out_of_stock' },
        { product_id: 3, product_name: '可口可樂 330ml', warehouse_id: 2, warehouse_name: '門市A', current_quantity: 8, min_stock: 30, alert_type: 'low_stock' },
      ]);

      // 設定圖表資料
      this.salesChartData = {
        labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
        datasets: [
          {
            label: '銷售額',
            data: [98560, 125680, 108900, 156780, 142360, 186540, 125680],
            fill: true,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
          },
        ],
      };

      this.isLoading.set(false);
    }, 1000);
  }

  private initChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: number) => {
              return new Intl.NumberFormat('zh-TW', {
                style: 'currency',
                currency: 'TWD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value);
            },
          },
        },
      },
    };
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: '草稿',
      pending: '待處理',
      confirmed: '已確認',
      processing: '處理中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger'> = {
      draft: 'secondary',
      pending: 'warn',
      confirmed: 'info',
      processing: 'info',
      completed: 'success',
      cancelled: 'danger',
    };
    return severities[status];
  }

  getAlertTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      low_stock: '低庫存',
      out_of_stock: '缺貨',
      overstock: '庫存過多',
    };
    return labels[type] || type;
  }

  getAlertTypeSeverity(type: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    const severities: Record<string, 'warn' | 'danger' | 'info'> = {
      low_stock: 'warn',
      out_of_stock: 'danger',
      overstock: 'info',
    };
    return severities[type];
  }
}
