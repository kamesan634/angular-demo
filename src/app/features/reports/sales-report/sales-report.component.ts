/**
 * 銷售報表頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

interface SalesData {
  date: string;
  orders: number;
  revenue: number;
  cost: number;
  profit: number;
  avgOrderValue: number;
}

interface ProductSales {
  product_code: string;
  product_name: string;
  quantity: number;
  revenue: number;
  profit: number;
  profit_rate: number;
}

interface StoreSales {
  store_name: string;
  orders: number;
  revenue: number;
  growth: number;
}

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, SelectModule, DatePickerModule,
    TableModule, ChartModule, CardModule, SelectButtonModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="銷售報表"
      subtitle="銷售數據分析與報表"
      [breadcrumbs]="[{ label: '報表中心' }, { label: '銷售報表' }]"
    >
      <button pButton label="匯出報表" icon="pi pi-download" class="p-button-outlined" (click)="exportReport()"></button>
      <button pButton label="列印" icon="pi pi-print" class="p-button-outlined" (click)="printReport()"></button>
    </app-page-header>

    <!-- 篩選區 -->
    <div class="filter-bar">
      <p-datepicker [(ngModel)]="dateRange" selectionMode="range" placeholder="日期範圍" dateFormat="yy/mm/dd" [showIcon]="true"></p-datepicker>
      <p-select [options]="storeOptions" [(ngModel)]="selectedStore" placeholder="門市" [showClear]="true"></p-select>
      <p-select [options]="periodOptions" [(ngModel)]="selectedPeriod" placeholder="統計週期"></p-select>
      <button pButton label="查詢" icon="pi pi-search" (click)="loadData()"></button>
    </div>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card revenue">
        <div class="stat-icon"><i class="pi pi-dollar"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().totalRevenue | number:'1.0-0' }}</div>
          <div class="stat-label">總營收</div>
          <div class="stat-change positive">
            <i class="pi pi-arrow-up"></i> {{ summary().revenueGrowth }}%
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-shopping-cart"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().totalOrders | number }}</div>
          <div class="stat-label">訂單數</div>
          <div class="stat-change positive">
            <i class="pi pi-arrow-up"></i> {{ summary().ordersGrowth }}%
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-wallet"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().avgOrderValue | number:'1.0-0' }}</div>
          <div class="stat-label">平均客單價</div>
        </div>
      </div>
      <div class="stat-card profit">
        <div class="stat-icon"><i class="pi pi-chart-line"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().totalProfit | number:'1.0-0' }}</div>
          <div class="stat-label">毛利潤</div>
          <div class="stat-change">毛利率 {{ summary().profitRate }}%</div>
        </div>
      </div>
    </div>

    <!-- Tab 選擇器 -->
    <div class="tab-selector">
      <p-selectButton [options]="tabOptions" [(ngModel)]="activeTab" optionLabel="label" optionValue="value"></p-selectButton>
    </div>

    <!-- 趨勢分析 -->
    @if (activeTab === 'trend') {
      <div class="chart-container">
        <p-chart type="line" [data]="trendChartData" [options]="chartOptions" height="350px"></p-chart>
      </div>
      <div class="card mt-3">
        <p-table [value]="salesData()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr><th>日期</th><th class="text-right">訂單數</th><th class="text-right">營收</th><th class="text-right">成本</th><th class="text-right">毛利</th><th class="text-right">平均客單價</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr><td>{{ row.date }}</td><td class="text-right">{{ row.orders }}</td><td class="text-right">{{ row.revenue | number:'1.0-0' }}</td><td class="text-right">{{ row.cost | number:'1.0-0' }}</td><td class="text-right text-success">{{ row.profit | number:'1.0-0' }}</td><td class="text-right">{{ row.avgOrderValue | number:'1.0-0' }}</td></tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- 商品銷售 -->
    @if (activeTab === 'product') {
      <div class="grid">
        <div class="col-6"><div class="card"><h4>銷售數量 Top 10</h4><p-chart type="bar" [data]="productQtyChartData" [options]="barChartOptions" height="300px"></p-chart></div></div>
        <div class="col-6"><div class="card"><h4>銷售金額 Top 10</h4><p-chart type="bar" [data]="productRevenueChartData" [options]="barChartOptions" height="300px"></p-chart></div></div>
      </div>
      <div class="card mt-3">
        <p-table [value]="productSales()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr><th>商品編號</th><th>商品名稱</th><th class="text-right">銷售數量</th><th class="text-right">銷售金額</th><th class="text-right">毛利</th><th class="text-right">毛利率</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-p>
            <tr><td><span class="product-code">{{ p.product_code }}</span></td><td>{{ p.product_name }}</td><td class="text-right">{{ p.quantity }}</td><td class="text-right">{{ p.revenue | number:'1.0-0' }}</td><td class="text-right text-success">{{ p.profit | number:'1.0-0' }}</td><td class="text-right">{{ p.profit_rate }}%</td></tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- 門市業績 -->
    @if (activeTab === 'store') {
      <div class="grid">
        <div class="col-6"><div class="card"><h4>門市營收佔比</h4><p-chart type="pie" [data]="storePieChartData" [options]="pieChartOptions" height="300px"></p-chart></div></div>
        <div class="col-6"><div class="card"><h4>門市訂單數比較</h4><p-chart type="bar" [data]="storeBarChartData" [options]="barChartOptions" height="300px"></p-chart></div></div>
      </div>
      <div class="card mt-3">
        <p-table [value]="storeSales()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr><th>門市</th><th class="text-right">訂單數</th><th class="text-right">營收</th><th class="text-right">成長率</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-s>
            <tr><td>{{ s.store_name }}</td><td class="text-right">{{ s.orders }}</td><td class="text-right">{{ s.revenue | number:'1.0-0' }}</td><td class="text-right" [class.text-success]="s.growth > 0" [class.text-danger]="s.growth < 0">{{ s.growth > 0 ? '+' : '' }}{{ s.growth }}%</td></tr>
          </ng-template>
        </p-table>
      </div>
    }
  `,
  styles: [`
    .filter-bar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; padding: 1rem; background: var(--surface-card); border-radius: 8px; flex-wrap: wrap; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .tab-selector { margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-ground); color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.revenue .stat-icon { background: var(--blue-100); color: var(--blue-600); }
    .stat-card.profit .stat-icon { background: var(--green-100); color: var(--green-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .stat-change { font-size: 0.75rem; margin-top: 0.25rem; }
    .stat-change.positive { color: var(--green-600); }
    .stat-change.negative { color: var(--red-600); }
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .card h4 { margin: 0 0 1rem 0; font-size: 1rem; color: var(--text-color); }
    .mt-3 { margin-top: 1rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .col-6 { min-width: 0; }
    .chart-container { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .text-right { text-align: right; }
    .text-success { color: var(--green-600); }
    .text-danger { color: var(--red-600); }
    .product-code { font-family: monospace; font-size: 0.875rem; }
  `],
})
export class SalesReportComponent implements OnInit {
  private readonly messageService = inject(MessageService);

  salesData = signal<SalesData[]>([]);
  productSales = signal<ProductSales[]>([]);
  storeSales = signal<StoreSales[]>([]);
  summary = signal({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalProfit: 0, profitRate: 0, revenueGrowth: 0, ordersGrowth: 0 });

  dateRange: Date[] | null = null;
  selectedStore: number | null = null;
  selectedPeriod = 'daily';
  activeTab = 'trend';
  tabOptions = [
    { label: '趨勢分析', value: 'trend' },
    { label: '商品銷售排行', value: 'product' },
    { label: '門市業績', value: 'store' },
  ];

  storeOptions = [
    { label: '旗艦店', value: 1 },
    { label: '信義店', value: 2 },
    { label: '台中店', value: 3 },
    { label: '高雄店', value: 4 },
  ];

  periodOptions = [
    { label: '日報', value: 'daily' },
    { label: '週報', value: 'weekly' },
    { label: '月報', value: 'monthly' },
  ];

  trendChartData: any = {};
  productQtyChartData: any = {};
  productRevenueChartData: any = {};
  storePieChartData: any = {};
  storeBarChartData: any = {};

  chartOptions = {
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  barChartOptions = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  pieChartOptions = {
    plugins: { legend: { position: 'right' } },
    maintainAspectRatio: false,
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // 模擬銷售趨勢數據
    const sales: SalesData[] = [
      { date: '2026/01/13', orders: 85, revenue: 42500, cost: 29750, profit: 12750, avgOrderValue: 500 },
      { date: '2026/01/14', orders: 92, revenue: 48300, cost: 33810, profit: 14490, avgOrderValue: 525 },
      { date: '2026/01/15', orders: 78, revenue: 39000, cost: 27300, profit: 11700, avgOrderValue: 500 },
      { date: '2026/01/16', orders: 105, revenue: 57750, cost: 40425, profit: 17325, avgOrderValue: 550 },
      { date: '2026/01/17', orders: 120, revenue: 66000, cost: 46200, profit: 19800, avgOrderValue: 550 },
      { date: '2026/01/18', orders: 145, revenue: 79750, cost: 55825, profit: 23925, avgOrderValue: 550 },
      { date: '2026/01/19', orders: 130, revenue: 71500, cost: 50050, profit: 21450, avgOrderValue: 550 },
    ];
    this.salesData.set(sales);

    // 計算彙總
    const totalRevenue = sales.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = sales.reduce((sum, d) => sum + d.orders, 0);
    const totalProfit = sales.reduce((sum, d) => sum + d.profit, 0);
    this.summary.set({
      totalRevenue,
      totalOrders,
      avgOrderValue: Math.round(totalRevenue / totalOrders),
      totalProfit,
      profitRate: Math.round((totalProfit / totalRevenue) * 100),
      revenueGrowth: 12.5,
      ordersGrowth: 8.3,
    });

    // 趨勢圖表
    this.trendChartData = {
      labels: sales.map(d => d.date.substring(5)),
      datasets: [
        { label: '營收', data: sales.map(d => d.revenue), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
        { label: '毛利', data: sales.map(d => d.profit), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
      ],
    };

    // 商品銷售數據
    const products: ProductSales[] = [
      { product_code: 'P001', product_name: '可口可樂 330ml', quantity: 520, revenue: 13000, profit: 3900, profit_rate: 30 },
      { product_code: 'P002', product_name: '百事可樂 330ml', quantity: 380, revenue: 9500, profit: 2850, profit_rate: 30 },
      { product_code: 'P007', product_name: '礦泉水 600ml', quantity: 650, revenue: 9750, profit: 2925, profit_rate: 30 },
      { product_code: 'P003', product_name: '樂事洋芋片', quantity: 280, revenue: 11200, profit: 3360, profit_rate: 30 },
      { product_code: 'P005', product_name: '御茶園綠茶', quantity: 420, revenue: 10500, profit: 3150, profit_rate: 30 },
      { product_code: 'P004', product_name: '舒潔衛生紙', quantity: 150, revenue: 14250, profit: 4275, profit_rate: 30 },
      { product_code: 'P006', product_name: '泡麵 5入', quantity: 180, revenue: 12600, profit: 3780, profit_rate: 30 },
    ];
    this.productSales.set(products);

    this.productQtyChartData = {
      labels: products.slice(0, 5).map(p => p.product_name),
      datasets: [{ data: products.slice(0, 5).map(p => p.quantity), backgroundColor: '#3b82f6' }],
    };

    this.productRevenueChartData = {
      labels: products.sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => p.product_name),
      datasets: [{ data: products.sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => p.revenue), backgroundColor: '#22c55e' }],
    };

    // 門市銷售數據
    const stores: StoreSales[] = [
      { store_name: '旗艦店', orders: 320, revenue: 176000, growth: 15.2 },
      { store_name: '信義店', orders: 245, revenue: 134750, growth: 8.5 },
      { store_name: '台中店', orders: 180, revenue: 99000, growth: -2.3 },
      { store_name: '高雄店', orders: 110, revenue: 60500, growth: 22.1 },
    ];
    this.storeSales.set(stores);

    this.storePieChartData = {
      labels: stores.map(s => s.store_name),
      datasets: [{ data: stores.map(s => s.revenue), backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'] }],
    };

    this.storeBarChartData = {
      labels: stores.map(s => s.store_name),
      datasets: [{ data: stores.map(s => s.orders), backgroundColor: '#3b82f6' }],
    };
  }

  exportReport(): void {
    this.messageService.add({ severity: 'info', summary: '匯出', detail: '正在產生報表...' });
  }

  printReport(): void {
    this.messageService.add({ severity: 'info', summary: '列印', detail: '準備列印報表...' });
  }
}
