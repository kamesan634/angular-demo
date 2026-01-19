/**
 * 財務報表頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

interface ProfitLossData {
  item: string;
  current: number;
  previous: number;
  change: number;
  change_rate: number;
}

interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  ratio: number;
}

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, SelectModule, TableModule,
    ChartModule, SelectButtonModule, CardModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="財務報表"
      subtitle="營收與成本分析"
      [breadcrumbs]="[{ label: '報表中心' }, { label: '財務報表' }]"
    >
      <button pButton label="匯出報表" icon="pi pi-download" class="p-button-outlined" (click)="exportReport()"></button>
    </app-page-header>

    <!-- 篩選區 -->
    <div class="filter-bar">
      <p-select [options]="periodOptions" [(ngModel)]="selectedPeriod" placeholder="期間"></p-select>
      <p-select [options]="yearOptions" [(ngModel)]="selectedYear" placeholder="年度"></p-select>
      <p-select [options]="monthOptions" [(ngModel)]="selectedMonth" placeholder="月份" [showClear]="true"></p-select>
      <button pButton label="查詢" icon="pi pi-search" (click)="loadData()"></button>
    </div>

    <!-- 財務摘要卡片 -->
    <div class="stats-row">
      <div class="stat-card revenue">
        <div class="stat-icon"><i class="pi pi-dollar"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().totalRevenue | number:'1.0-0' }}</div>
          <div class="stat-label">總營收</div>
          <div class="stat-change" [class.positive]="summary().revenueGrowth > 0" [class.negative]="summary().revenueGrowth < 0">
            <i [class]="summary().revenueGrowth >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
            {{ summary().revenueGrowth > 0 ? '+' : '' }}{{ summary().revenueGrowth }}%
          </div>
        </div>
      </div>
      <div class="stat-card cost">
        <div class="stat-icon"><i class="pi pi-shopping-cart"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().totalCost | number:'1.0-0' }}</div>
          <div class="stat-label">總成本</div>
        </div>
      </div>
      <div class="stat-card profit">
        <div class="stat-icon"><i class="pi pi-chart-line"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().grossProfit | number:'1.0-0' }}</div>
          <div class="stat-label">毛利</div>
          <div class="stat-change">毛利率 {{ summary().grossMargin }}%</div>
        </div>
      </div>
      <div class="stat-card net">
        <div class="stat-icon"><i class="pi pi-wallet"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ summary().netProfit | number:'1.0-0' }}</div>
          <div class="stat-label">淨利</div>
          <div class="stat-change">淨利率 {{ summary().netMargin }}%</div>
        </div>
      </div>
    </div>

    <!-- Tab 選擇器 -->
    <div class="tab-selector">
      <p-selectButton [options]="tabOptions" [(ngModel)]="activeTab" optionLabel="label" optionValue="value"></p-selectButton>
    </div>

    <!-- 損益表 -->
    @if (activeTab === 'profit-loss') {
      <div class="grid">
        <div class="col-7">
          <div class="card">
            <h4>損益趨勢</h4>
            <p-chart type="line" [data]="profitTrendData" [options]="lineChartOptions" height="300px"></p-chart>
          </div>
        </div>
        <div class="col-5">
          <div class="card">
            <h4>成本結構</h4>
            <p-chart type="doughnut" [data]="costStructureData" [options]="pieChartOptions" height="300px"></p-chart>
          </div>
        </div>
      </div>
      <div class="card mt-3">
        <h4>損益明細</h4>
        <p-table [value]="profitLossData()" styleClass="p-datatable-sm financial-table">
          <ng-template pTemplate="header">
            <tr>
              <th>項目</th>
              <th class="text-right">本期金額</th>
              <th class="text-right">上期金額</th>
              <th class="text-right">增減</th>
              <th class="text-right">增減率</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr [class.highlight]="row.item.includes('合計') || row.item.includes('淨利')">
              <td [class.indent]="!row.item.includes('合計') && !row.item.includes('營業')">{{ row.item }}</td>
              <td class="text-right">{{ row.current | number:'1.0-0' }}</td>
              <td class="text-right text-secondary">{{ row.previous | number:'1.0-0' }}</td>
              <td class="text-right" [class.text-success]="row.change > 0" [class.text-danger]="row.change < 0">
                {{ row.change > 0 ? '+' : '' }}{{ row.change | number:'1.0-0' }}
              </td>
              <td class="text-right" [class.text-success]="row.change_rate > 0" [class.text-danger]="row.change_rate < 0">
                {{ row.change_rate > 0 ? '+' : '' }}{{ row.change_rate }}%
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- 現金流量 -->
    @if (activeTab === 'cash-flow') {
      <div class="card">
        <h4>現金流量趨勢</h4>
        <p-chart type="bar" [data]="cashFlowChartData" [options]="cashFlowChartOptions" height="350px"></p-chart>
      </div>
      <div class="card mt-3">
        <h4>現金流量明細</h4>
        <p-table [value]="cashFlowData()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>日期</th>
              <th class="text-right">收入</th>
              <th class="text-right">支出</th>
              <th class="text-right">餘額</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.date }}</td>
              <td class="text-right text-success">{{ row.income | number:'1.0-0' }}</td>
              <td class="text-right text-danger">{{ row.expense | number:'1.0-0' }}</td>
              <td class="text-right font-semibold">{{ row.balance | number:'1.0-0' }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }

    <!-- 費用分析 -->
    @if (activeTab === 'expense') {
      <div class="grid">
        <div class="col-6">
          <div class="card">
            <h4>費用佔比</h4>
            <p-chart type="pie" [data]="expenseChartData" [options]="pieChartOptions" height="300px"></p-chart>
          </div>
        </div>
        <div class="col-6">
          <div class="card">
            <h4>費用趨勢</h4>
            <p-chart type="bar" [data]="expenseTrendData" [options]="barChartOptions" height="300px"></p-chart>
          </div>
        </div>
      </div>
      <div class="card mt-3">
        <h4>費用明細</h4>
        <p-table [value]="expenseBreakdown()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>費用類別</th>
              <th class="text-right">金額</th>
              <th style="width: 300px">佔比</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-e>
            <tr>
              <td>{{ e.category }}</td>
              <td class="text-right">{{ e.amount | number:'1.0-0' }}</td>
              <td>
                <div class="expense-bar">
                  <div class="bar" [style.width.%]="e.ratio" [style.background]="getExpenseColor(e.category)"></div>
                  <span>{{ e.ratio }}%</span>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr class="total-row">
              <td>合計</td>
              <td class="text-right font-semibold">{{ getTotalExpense() | number:'1.0-0' }}</td>
              <td></td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    }
  `,
  styles: [`
    .filter-bar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; padding: 1rem; background: var(--surface-card); border-radius: 8px; flex-wrap: wrap; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-ground); color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.revenue .stat-icon { background: var(--blue-100); color: var(--blue-600); }
    .stat-card.cost .stat-icon { background: var(--red-100); color: var(--red-600); }
    .stat-card.profit .stat-icon { background: var(--green-100); color: var(--green-600); }
    .stat-card.net .stat-icon { background: var(--purple-100); color: var(--purple-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .stat-change { font-size: 0.75rem; margin-top: 0.25rem; color: var(--text-color-secondary); }
    .stat-change.positive { color: var(--green-600); }
    .stat-change.negative { color: var(--red-600); }
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .card h4 { margin: 0 0 1rem 0; font-size: 1rem; color: var(--text-color); }
    .mt-3 { margin-top: 1rem; }
    .grid { display: grid; grid-template-columns: 7fr 5fr; gap: 1rem; }
    .col-5, .col-6, .col-7 { min-width: 0; }
    .grid:has(.col-6) { grid-template-columns: 1fr 1fr; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .text-success { color: var(--green-600); }
    .text-danger { color: var(--red-600); }
    .font-semibold { font-weight: 600; }
    :host ::ng-deep .financial-table tr.highlight td { font-weight: 600; background: var(--surface-ground); }
    :host ::ng-deep .financial-table td.indent { padding-left: 2rem; }
    .expense-bar { display: flex; align-items: center; gap: 0.75rem; }
    .expense-bar .bar { height: 8px; border-radius: 4px; }
    .expense-bar span { font-size: 0.75rem; min-width: 40px; }
    :host ::ng-deep .total-row td { font-weight: 600; background: var(--surface-ground); }
    .tab-selector { margin-bottom: 1.5rem; }
  `],
})
export class FinancialReportComponent implements OnInit {
  private readonly messageService = inject(MessageService);

  profitLossData = signal<ProfitLossData[]>([]);
  cashFlowData = signal<CashFlowData[]>([]);
  expenseBreakdown = signal<ExpenseBreakdown[]>([]);
  summary = signal({ totalRevenue: 0, totalCost: 0, grossProfit: 0, netProfit: 0, grossMargin: 0, netMargin: 0, revenueGrowth: 0 });

  selectedPeriod = 'monthly';
  selectedYear = 2026;
  selectedMonth: number | null = 1;

  activeTab = 'profit-loss';
  tabOptions = [
    { label: '損益表', value: 'profit-loss' },
    { label: '現金流量', value: 'cash-flow' },
    { label: '費用分析', value: 'expense' },
  ];

  periodOptions = [
    { label: '月報', value: 'monthly' },
    { label: '季報', value: 'quarterly' },
    { label: '年報', value: 'yearly' },
  ];

  yearOptions = [
    { label: '2026', value: 2026 },
    { label: '2025', value: 2025 },
    { label: '2024', value: 2024 },
  ];

  monthOptions = [
    { label: '1月', value: 1 }, { label: '2月', value: 2 }, { label: '3月', value: 3 },
    { label: '4月', value: 4 }, { label: '5月', value: 5 }, { label: '6月', value: 6 },
    { label: '7月', value: 7 }, { label: '8月', value: 8 }, { label: '9月', value: 9 },
    { label: '10月', value: 10 }, { label: '11月', value: 11 }, { label: '12月', value: 12 },
  ];

  profitTrendData: any = {};
  costStructureData: any = {};
  cashFlowChartData: any = {};
  expenseChartData: any = {};
  expenseTrendData: any = {};

  lineChartOptions = {
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  pieChartOptions = {
    plugins: { legend: { position: 'right' } },
    maintainAspectRatio: false,
  };

  barChartOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  cashFlowChartOptions = {
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  };

  expenseColors: Record<string, string> = {
    '人事費用': '#3b82f6',
    '租金': '#22c55e',
    '水電費': '#f59e0b',
    '行銷費用': '#a855f7',
    '運費': '#ef4444',
    '其他': '#6b7280',
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // 財務摘要
    this.summary.set({
      totalRevenue: 2580000,
      totalCost: 1806000,
      grossProfit: 774000,
      netProfit: 516000,
      grossMargin: 30,
      netMargin: 20,
      revenueGrowth: 12.5,
    });

    // 損益數據
    const plData: ProfitLossData[] = [
      { item: '營業收入', current: 2580000, previous: 2293333, change: 286667, change_rate: 12.5 },
      { item: '  銷貨收入', current: 2500000, previous: 2200000, change: 300000, change_rate: 13.6 },
      { item: '  服務收入', current: 80000, previous: 93333, change: -13333, change_rate: -14.3 },
      { item: '營業成本', current: 1806000, previous: 1605333, change: 200667, change_rate: 12.5 },
      { item: '  銷貨成本', current: 1750000, previous: 1540000, change: 210000, change_rate: 13.6 },
      { item: '  服務成本', current: 56000, previous: 65333, change: -9333, change_rate: -14.3 },
      { item: '營業毛利', current: 774000, previous: 688000, change: 86000, change_rate: 12.5 },
      { item: '營業費用', current: 258000, previous: 229333, change: 28667, change_rate: 12.5 },
      { item: '  人事費用', current: 120000, previous: 110000, change: 10000, change_rate: 9.1 },
      { item: '  租金', current: 50000, previous: 50000, change: 0, change_rate: 0 },
      { item: '  水電費', current: 25000, previous: 22000, change: 3000, change_rate: 13.6 },
      { item: '  其他費用', current: 63000, previous: 47333, change: 15667, change_rate: 33.1 },
      { item: '營業淨利', current: 516000, previous: 458667, change: 57333, change_rate: 12.5 },
    ];
    this.profitLossData.set(plData);

    // 損益趨勢圖
    this.profitTrendData = {
      labels: ['9月', '10月', '11月', '12月', '1月'],
      datasets: [
        { label: '營收', data: [2100000, 2200000, 2350000, 2450000, 2580000], borderColor: '#3b82f6', tension: 0.4 },
        { label: '毛利', data: [630000, 660000, 705000, 735000, 774000], borderColor: '#22c55e', tension: 0.4 },
        { label: '淨利', data: [420000, 440000, 470000, 490000, 516000], borderColor: '#a855f7', tension: 0.4 },
      ],
    };

    // 成本結構圖
    this.costStructureData = {
      labels: ['銷貨成本', '人事費用', '租金', '水電費', '其他'],
      datasets: [{ data: [1750000, 120000, 50000, 25000, 63000], backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#6b7280'] }],
    };

    // 現金流量數據
    const cashFlow: CashFlowData[] = [
      { date: '2026/01/13', income: 42500, expense: 28000, balance: 1250000 },
      { date: '2026/01/14', income: 48300, expense: 15000, balance: 1283300 },
      { date: '2026/01/15', income: 39000, expense: 52000, balance: 1270300 },
      { date: '2026/01/16', income: 57750, expense: 18000, balance: 1310050 },
      { date: '2026/01/17', income: 66000, expense: 25000, balance: 1351050 },
      { date: '2026/01/18', income: 79750, expense: 120000, balance: 1310800 },
      { date: '2026/01/19', income: 71500, expense: 22000, balance: 1360300 },
    ];
    this.cashFlowData.set(cashFlow);

    this.cashFlowChartData = {
      labels: cashFlow.map(c => c.date.substring(5)),
      datasets: [
        { label: '收入', data: cashFlow.map(c => c.income), backgroundColor: '#22c55e' },
        { label: '支出', data: cashFlow.map(c => c.expense), backgroundColor: '#ef4444' },
      ],
    };

    // 費用分析
    const expenses: ExpenseBreakdown[] = [
      { category: '人事費用', amount: 120000, ratio: 46 },
      { category: '租金', amount: 50000, ratio: 19 },
      { category: '水電費', amount: 25000, ratio: 10 },
      { category: '行銷費用', amount: 35000, ratio: 14 },
      { category: '運費', amount: 18000, ratio: 7 },
      { category: '其他', amount: 10000, ratio: 4 },
    ];
    this.expenseBreakdown.set(expenses);

    this.expenseChartData = {
      labels: expenses.map(e => e.category),
      datasets: [{ data: expenses.map(e => e.amount), backgroundColor: Object.values(this.expenseColors) }],
    };

    this.expenseTrendData = {
      labels: expenses.map(e => e.category),
      datasets: [{ data: expenses.map(e => e.amount), backgroundColor: Object.values(this.expenseColors) }],
    };
  }

  getExpenseColor(category: string): string {
    return this.expenseColors[category] || '#6b7280';
  }

  getTotalExpense(): number {
    return this.expenseBreakdown().reduce((sum, e) => sum + e.amount, 0);
  }

  exportReport(): void {
    this.messageService.add({ severity: 'info', summary: '匯出', detail: '正在產生財務報表...' });
  }
}
