/**
 * 庫存報表頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

interface InventoryStatus {
  product_code: string;
  product_name: string;
  category: string;
  total_stock: number;
  safety_stock: number;
  stock_value: number;
  status: 'normal' | 'low' | 'out' | 'over';
  turnover_days: number;
}

interface CategoryStock {
  category: string;
  products: number;
  total_qty: number;
  stock_value: number;
  ratio: number;
}

interface WarehouseStock {
  warehouse: string;
  products: number;
  total_qty: number;
  stock_value: number;
  utilization: number;
}

@Component({
  selector: 'app-inventory-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, SelectModule, TableModule,
    ChartModule, SelectButtonModule, TagModule, ProgressBarModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="庫存報表"
      subtitle="庫存狀態與週轉率分析"
      [breadcrumbs]="[{ label: '報表中心' }, { label: '庫存報表' }]"
    >
      <button pButton label="匯出報表" icon="pi pi-download" class="p-button-outlined" (click)="exportReport()"></button>
    </app-page-header>

    <!-- 篩選區 -->
    <div class="filter-bar">
      <p-select [options]="warehouseOptions" [(ngModel)]="selectedWarehouse" placeholder="倉庫" [showClear]="true"></p-select>
      <p-select [options]="categoryOptions" [(ngModel)]="selectedCategory" placeholder="類別" [showClear]="true"></p-select>
      <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="庫存狀態" [showClear]="true"></p-select>
      <button pButton label="查詢" icon="pi pi-search" (click)="loadData()"></button>
    </div>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-box"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().totalProducts }}</div>
          <div class="stat-label">商品種類</div>
        </div>
      </div>
      <div class="stat-card value">
        <div class="stat-icon"><i class="pi pi-dollar"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().totalValue | number:'1.0-0' }}</div>
          <div class="stat-label">庫存總值</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><i class="pi pi-exclamation-triangle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().lowStockCount }}</div>
          <div class="stat-label">低庫存商品</div>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon"><i class="pi pi-times-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().outOfStockCount }}</div>
          <div class="stat-label">缺貨商品</div>
        </div>
      </div>
    </div>

    <!-- Tab 選擇器 -->
    <div class="tab-selector">
      <p-selectButton [options]="tabOptions" [(ngModel)]="activeTab" optionLabel="label" optionValue="value"></p-selectButton>
    </div>

    <!-- 庫存總覽 -->
    @if (activeTab === 'overview') {
      <div class="grid">
        <div class="col-6">
          <div class="card">
            <h4>庫存狀態分布</h4>
            <p-chart type="doughnut" [data]="statusChartData" [options]="pieChartOptions" height="280px"></p-chart>
          </div>
        </div>
        <div class="col-6">
          <div class="card">
            <h4>類別庫存佔比</h4>
            <p-chart type="pie" [data]="categoryChartData" [options]="pieChartOptions" height="280px"></p-chart>
          </div>
        </div>
      </div>
      <div class="card mt-3">
        <p-table [value]="inventoryStatus()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm" [globalFilterFields]="['product_code', 'product_name']">
          <ng-template pTemplate="header">
            <tr>
              <th>商品編號</th>
              <th>商品名稱</th>
              <th>類別</th>
              <th class="text-right">庫存數量</th>
              <th class="text-right">安全庫存</th>
              <th style="width: 150px">庫存狀態</th>
              <th class="text-right">庫存金額</th>
              <th class="text-right">週轉天數</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td><span class="product-code">{{ item.product_code }}</span></td>
              <td>{{ item.product_name }}</td>
              <td>{{ item.category }}</td>
              <td class="text-right">{{ item.total_stock }}</td>
              <td class="text-right text-secondary">{{ item.safety_stock }}</td>
              <td>
                <div class="stock-status">
                  <p-progressBar [value]="getStockPercentage(item)" [showValue]="false" [style]="{height: '8px'}"></p-progressBar>
                  <p-tag [value]="getStatusLabel(item.status)" [severity]="getStatusSeverity(item.status)" class="ml-2"></p-tag>
                </div>
              </td>
              <td class="text-right">{{ item.stock_value | number:'1.0-0' }}</td>
              <td class="text-right" [class.text-warning]="item.turnover_days > 30">{{ item.turnover_days }}天</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- 類別分析 -->
    @if (activeTab === 'category') {
      <div class="card">
        <h4>各類別庫存金額</h4>
        <p-chart type="bar" [data]="categoryBarChartData" [options]="barChartOptions" height="300px"></p-chart>
      </div>
      <div class="card mt-3">
        <p-table [value]="categoryStock()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>類別</th>
              <th class="text-right">商品數</th>
              <th class="text-right">總數量</th>
              <th class="text-right">庫存金額</th>
              <th style="width: 200px">佔比</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-c>
            <tr>
              <td>{{ c.category }}</td>
              <td class="text-right">{{ c.products }}</td>
              <td class="text-right">{{ c.total_qty | number }}</td>
              <td class="text-right">{{ c.stock_value | number:'1.0-0' }}</td>
              <td>
                <div class="ratio-bar">
                  <p-progressBar [value]="c.ratio" [showValue]="false" [style]="{height: '8px'}"></p-progressBar>
                  <span class="ratio-text">{{ c.ratio }}%</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- 倉庫分析 -->
    @if (activeTab === 'warehouse') {
      <div class="grid">
        <div class="col-6">
          <div class="card">
            <h4>倉庫庫存分布</h4>
            <p-chart type="pie" [data]="warehouseChartData" [options]="pieChartOptions" height="280px"></p-chart>
          </div>
        </div>
        <div class="col-6">
          <div class="card">
            <h4>倉庫空間使用率</h4>
            <p-chart type="bar" [data]="utilizationChartData" [options]="utilizationBarOptions" height="280px"></p-chart>
          </div>
        </div>
      </div>
      <div class="card mt-3">
        <p-table [value]="warehouseStock()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>倉庫</th>
              <th class="text-right">商品種類</th>
              <th class="text-right">總數量</th>
              <th class="text-right">庫存金額</th>
              <th style="width: 200px">使用率</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-w>
            <tr>
              <td>{{ w.warehouse }}</td>
              <td class="text-right">{{ w.products }}</td>
              <td class="text-right">{{ w.total_qty | number }}</td>
              <td class="text-right">{{ w.stock_value | number:'1.0-0' }}</td>
              <td>
                <div class="ratio-bar">
                  <p-progressBar [value]="w.utilization" [showValue]="false" [style]="{height: '8px'}"></p-progressBar>
                  <span class="ratio-text" [class.text-danger]="w.utilization > 90">{{ w.utilization }}%</span>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- 週轉率分析 -->
    @if (activeTab === 'turnover') {
      <div class="card">
        <h4>商品週轉天數分布</h4>
        <p-chart type="bar" [data]="turnoverChartData" [options]="barChartOptions" height="300px"></p-chart>
      </div>
      <div class="alert-box mt-3">
        <div class="alert warning">
          <i class="pi pi-exclamation-triangle"></i>
          <div>
            <strong>滯銷商品警示</strong>
            <p>有 {{ summary().slowMovingCount }} 項商品週轉天數超過 30 天，建議檢視並調整庫存策略。</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .filter-bar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; padding: 1rem; background: var(--surface-card); border-radius: 8px; flex-wrap: wrap; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-ground); color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.value .stat-icon { background: var(--blue-100); color: var(--blue-600); }
    .stat-card.warning .stat-icon { background: var(--yellow-100); color: var(--yellow-700); }
    .stat-card.danger .stat-icon { background: var(--red-100); color: var(--red-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .card h4 { margin: 0 0 1rem 0; font-size: 1rem; color: var(--text-color); }
    .mt-3 { margin-top: 1rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .col-6 { min-width: 0; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .text-warning { color: var(--yellow-700); }
    .text-danger { color: var(--red-600); }
    .product-code { font-family: monospace; font-size: 0.875rem; }
    .stock-status { display: flex; align-items: center; gap: 0.5rem; }
    .ml-2 { margin-left: 0.5rem; }
    .ratio-bar { display: flex; align-items: center; gap: 0.5rem; }
    .ratio-text { font-size: 0.75rem; min-width: 40px; }
    .alert-box { display: flex; flex-direction: column; gap: 0.5rem; }
    .alert { display: flex; gap: 1rem; padding: 1rem; border-radius: 8px; align-items: flex-start; }
    .alert.warning { background: var(--yellow-100); color: var(--yellow-900); }
    .alert i { font-size: 1.25rem; margin-top: 0.25rem; }
    .alert strong { display: block; margin-bottom: 0.25rem; }
    .alert p { margin: 0; font-size: 0.875rem; }
    .tab-selector { margin-bottom: 1.5rem; }
  `],
})
export class InventoryReportComponent implements OnInit {
  private readonly messageService = inject(MessageService);

  inventoryStatus = signal<InventoryStatus[]>([]);
  categoryStock = signal<CategoryStock[]>([]);
  warehouseStock = signal<WarehouseStock[]>([]);
  summary = signal({ totalProducts: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0, slowMovingCount: 0 });

  selectedWarehouse: number | null = null;
  selectedCategory: string | null = null;
  selectedStatus: string | null = null;

  activeTab = 'overview';
  tabOptions = [
    { label: '庫存總覽', value: 'overview' },
    { label: '類別分析', value: 'category' },
    { label: '倉庫分析', value: 'warehouse' },
    { label: '週轉率分析', value: 'turnover' },
  ];

  warehouseOptions = [
    { label: '總倉', value: 1 },
    { label: '北區倉庫', value: 2 },
    { label: '中區倉庫', value: 3 },
    { label: '南區倉庫', value: 4 },
  ];

  categoryOptions = [
    { label: '飲料', value: 'drinks' },
    { label: '零食', value: 'snacks' },
    { label: '日用品', value: 'daily' },
    { label: '食品', value: 'food' },
  ];

  statusOptions = [
    { label: '正常', value: 'normal' },
    { label: '低庫存', value: 'low' },
    { label: '缺貨', value: 'out' },
    { label: '過量', value: 'over' },
  ];

  statusChartData: any = {};
  categoryChartData: any = {};
  categoryBarChartData: any = {};
  warehouseChartData: any = {};
  utilizationChartData: any = {};
  turnoverChartData: any = {};

  pieChartOptions = {
    plugins: { legend: { position: 'right' } },
    maintainAspectRatio: false,
  };

  barChartOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  utilizationBarOptions = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, max: 100 } },
    maintainAspectRatio: false,
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // 庫存狀態數據
    const inventory: InventoryStatus[] = [
      { product_code: 'P001', product_name: '可口可樂 330ml', category: '飲料', total_stock: 500, safety_stock: 100, stock_value: 6000, status: 'normal', turnover_days: 8 },
      { product_code: 'P002', product_name: '百事可樂 330ml', category: '飲料', total_stock: 350, safety_stock: 100, stock_value: 3850, status: 'normal', turnover_days: 12 },
      { product_code: 'P003', product_name: '樂事洋芋片', category: '零食', total_stock: 80, safety_stock: 50, stock_value: 2000, status: 'normal', turnover_days: 15 },
      { product_code: 'P004', product_name: '舒潔衛生紙', category: '日用品', total_stock: 15, safety_stock: 50, stock_value: 975, status: 'low', turnover_days: 25 },
      { product_code: 'P005', product_name: '御茶園綠茶', category: '飲料', total_stock: 45, safety_stock: 80, stock_value: 675, status: 'low', turnover_days: 10 },
      { product_code: 'P006', product_name: '泡麵 5入', category: '食品', total_stock: 200, safety_stock: 100, stock_value: 9000, status: 'normal', turnover_days: 35 },
      { product_code: 'P007', product_name: '礦泉水 600ml', category: '飲料', total_stock: 0, safety_stock: 100, stock_value: 0, status: 'out', turnover_days: 0 },
    ];
    this.inventoryStatus.set(inventory);

    // 統計
    this.summary.set({
      totalProducts: inventory.length,
      totalValue: inventory.reduce((sum, i) => sum + i.stock_value, 0),
      lowStockCount: inventory.filter(i => i.status === 'low').length,
      outOfStockCount: inventory.filter(i => i.status === 'out').length,
      slowMovingCount: inventory.filter(i => i.turnover_days > 30).length,
    });

    // 狀態分布圖
    this.statusChartData = {
      labels: ['正常', '低庫存', '缺貨'],
      datasets: [{ data: [4, 2, 1], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'] }],
    };

    // 類別數據
    const categories: CategoryStock[] = [
      { category: '飲料', products: 4, total_qty: 895, stock_value: 10525, ratio: 47 },
      { category: '零食', products: 1, total_qty: 80, stock_value: 2000, ratio: 9 },
      { category: '日用品', products: 1, total_qty: 15, stock_value: 975, ratio: 4 },
      { category: '食品', products: 1, total_qty: 200, stock_value: 9000, ratio: 40 },
    ];
    this.categoryStock.set(categories);

    this.categoryChartData = {
      labels: categories.map(c => c.category),
      datasets: [{ data: categories.map(c => c.stock_value), backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7'] }],
    };

    this.categoryBarChartData = {
      labels: categories.map(c => c.category),
      datasets: [{ data: categories.map(c => c.stock_value), backgroundColor: '#3b82f6' }],
    };

    // 倉庫數據
    const warehouses: WarehouseStock[] = [
      { warehouse: '總倉', products: 7, total_qty: 850, stock_value: 15500, utilization: 72 },
      { warehouse: '北區倉庫', products: 5, total_qty: 220, stock_value: 4200, utilization: 45 },
      { warehouse: '中區倉庫', products: 4, total_qty: 180, stock_value: 3300, utilization: 38 },
      { warehouse: '南區倉庫', products: 3, total_qty: 90, stock_value: 1500, utilization: 25 },
    ];
    this.warehouseStock.set(warehouses);

    this.warehouseChartData = {
      labels: warehouses.map(w => w.warehouse),
      datasets: [{ data: warehouses.map(w => w.stock_value), backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7'] }],
    };

    this.utilizationChartData = {
      labels: warehouses.map(w => w.warehouse),
      datasets: [{ data: warehouses.map(w => w.utilization), backgroundColor: warehouses.map(w => w.utilization > 80 ? '#ef4444' : '#3b82f6') }],
    };

    // 週轉天數分布
    this.turnoverChartData = {
      labels: ['0-7天', '8-14天', '15-30天', '30天以上'],
      datasets: [{ data: [1, 3, 2, 1], backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'] }],
    };
  }

  getStockPercentage(item: InventoryStatus): number {
    if (item.safety_stock === 0) return 100;
    return Math.min(100, (item.total_stock / (item.safety_stock * 2)) * 100);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { normal: '正常', low: '低庫存', out: '缺貨', over: '過量' };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    const severities: Record<string, 'success' | 'warn' | 'danger' | 'info'> = { normal: 'success', low: 'warn', out: 'danger', over: 'info' };
    return severities[status] || 'info';
  }

  exportReport(): void {
    this.messageService.add({ severity: 'info', summary: '匯出', detail: '正在產生庫存報表...' });
  }
}
