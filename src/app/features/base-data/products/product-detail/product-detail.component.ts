/**
 * 商品詳情元件 - 檢視商品完整資訊
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { DividerModule } from 'primeng/divider';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';
import { Product } from '@core/models';

interface WarehouseStock {
  warehouse_name: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  status: 'normal' | 'low' | 'overstock';
}

interface StockMovement {
  id: number;
  date: string;
  type: 'in' | 'out' | 'adjust';
  type_name: string;
  reference: string;
  quantity: number;
  balance: number;
  warehouse: string;
  operator: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ButtonModule, TableModule, TagModule,
    ImageModule, DividerModule, ChartModule, ProgressBarModule, TooltipModule,
    ConfirmDialogModule, SelectButtonModule, PageHeaderComponent, CurrencyPipe, DatePipe, DecimalPipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      [title]="product()?.name || '商品詳情'"
      [subtitle]="'商品編號：' + (product()?.code || '-')"
      [breadcrumbs]="[
        { label: '基礎資料', routerLink: '/base-data' },
        { label: '商品管理', routerLink: '/base-data/products' },
        { label: product()?.name || '商品詳情' }
      ]"
    >
      <button pButton label="返回列表" icon="pi pi-arrow-left" class="p-button-outlined" routerLink="/base-data/products"></button>
      <button pButton label="編輯" icon="pi pi-pencil" [routerLink]="['/base-data/products', productId, 'edit']"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    @if (loading()) {
      <div class="loading-container">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
        <p>載入中...</p>
      </div>
    } @else if (product()) {
      <!-- 統計卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stock"><i class="pi pi-box"></i></div>
          <div class="stat-content">
            <span class="stat-label">總庫存</span>
            <span class="stat-value">{{ getTotalStock() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon sales"><i class="pi pi-shopping-cart"></i></div>
          <div class="stat-content">
            <span class="stat-label">本月銷量</span>
            <span class="stat-value">{{ monthlySales() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revenue"><i class="pi pi-dollar"></i></div>
          <div class="stat-content">
            <span class="stat-label">本月營收</span>
            <span class="stat-value">{{ monthlyRevenue() | currency:'TWD':'symbol':'1.0-0' }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon profit"><i class="pi pi-chart-line"></i></div>
          <div class="stat-content">
            <span class="stat-label">毛利率</span>
            <span class="stat-value">{{ getProfitMargin() | number:'1.1-1' }}%</span>
          </div>
        </div>
      </div>

      <!-- Tab 選擇器 -->
      <div class="tab-selector">
        <p-selectButton [options]="tabOptions" [(ngModel)]="activeTab" optionLabel="label" optionValue="value"></p-selectButton>
      </div>

      <!-- 基本資訊 -->
      @if (activeTab === 'info') {
        <div class="info-grid">
          <div class="info-section">
            <h3>商品資訊</h3>
            <div class="info-list">
              <div class="info-item"><span class="info-label">商品編號</span><span class="info-value">{{ product()?.code }}</span></div>
              <div class="info-item"><span class="info-label">商品名稱</span><span class="info-value">{{ product()?.name }}</span></div>
              <div class="info-item"><span class="info-label">條碼</span><span class="info-value">{{ product()?.barcode || '-' }}</span></div>
              <div class="info-item"><span class="info-label">分類</span><span class="info-value">{{ product()?.category?.name || '-' }}</span></div>
              <div class="info-item"><span class="info-label">單位</span><span class="info-value">{{ product()?.unit?.name || '-' }}</span></div>
              <div class="info-item">
                <span class="info-label">狀態</span>
                <span class="info-value"><p-tag [value]="product()?.is_active ? '啟用' : '停用'" [severity]="product()?.is_active ? 'success' : 'danger'"></p-tag></span>
              </div>
              <div class="info-item full-width"><span class="info-label">描述</span><span class="info-value">{{ product()?.description || '無描述' }}</span></div>
            </div>
          </div>
          <div class="info-section">
            <h3>價格與庫存</h3>
            <div class="info-list">
              <div class="info-item"><span class="info-label">成本價</span><span class="info-value price">{{ product()?.cost_price | currency:'TWD':'symbol':'1.0-0' }}</span></div>
              <div class="info-item"><span class="info-label">售價</span><span class="info-value price highlight">{{ product()?.selling_price | currency:'TWD':'symbol':'1.0-0' }}</span></div>
              <div class="info-item"><span class="info-label">毛利</span><span class="info-value" [class.positive]="getProfit() > 0">{{ getProfit() | currency:'TWD':'symbol':'1.0-0' }}</span></div>
              <div class="info-item"><span class="info-label">毛利率</span><span class="info-value" [class.positive]="getProfitMargin() > 0">{{ getProfitMargin() | number:'1.1-1' }}%</span></div>
              <div class="info-item"><span class="info-label">安全庫存量</span><span class="info-value">{{ product()?.min_stock || '-' }}</span></div>
              <div class="info-item"><span class="info-label">最大庫存量</span><span class="info-value">{{ product()?.max_stock || '-' }}</span></div>
            </div>
          </div>
        </div>
      }

      <!-- 庫存分布 -->
      @if (activeTab === 'stock') {
        <div class="stock-section">
          <p-table [value]="warehouseStocks()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>倉庫</th>
                <th style="width: 300px">庫存水位</th>
                <th style="text-align: right">現有庫存</th>
                <th style="text-align: right">安全庫存</th>
                <th style="text-align: center">狀態</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-stock>
              <tr>
                <td>{{ stock.warehouse_name }}</td>
                <td><p-progressBar [value]="getStockPercentage(stock)" [showValue]="false" [style]="{ height: '8px' }"></p-progressBar></td>
                <td style="text-align: right; font-weight: 600">{{ stock.quantity }}</td>
                <td style="text-align: right">{{ stock.min_stock }}</td>
                <td style="text-align: center"><p-tag [value]="getStockStatusLabel(stock.status)" [severity]="getStockStatusSeverity(stock.status)"></p-tag></td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <!-- 異動紀錄 -->
      @if (activeTab === 'movement') {
        <div class="movement-section">
          <p-table [value]="stockMovements()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 120px">日期</th>
                <th style="width: 100px">類型</th>
                <th>參考單號</th>
                <th>倉庫</th>
                <th style="text-align: right">異動數量</th>
                <th style="text-align: right">結存</th>
                <th>操作人員</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-m>
              <tr>
                <td>{{ m.date | date:'MM/dd HH:mm' }}</td>
                <td><p-tag [value]="m.type_name" [severity]="getMovementSeverity(m.type)"></p-tag></td>
                <td><span class="link">{{ m.reference }}</span></td>
                <td>{{ m.warehouse }}</td>
                <td style="text-align: right" [class.positive]="m.quantity > 0" [class.negative]="m.quantity < 0">{{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}</td>
                <td style="text-align: right; font-weight: 500">{{ m.balance }}</td>
                <td>{{ m.operator }}</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <!-- 銷售趨勢 -->
      @if (activeTab === 'trend') {
        <div class="chart-section">
          <h3>近 30 天銷售趨勢</h3>
          <p-chart type="line" [data]="salesChartData()" [options]="chartOptions"></p-chart>
        </div>
      }

      <!-- 操作按鈕 -->
      <div class="action-bar">
        <button pButton type="button" label="刪除商品" icon="pi pi-trash" class="p-button-danger p-button-outlined" (click)="confirmDelete()"></button>
      </div>
    } @else {
      <div class="not-found">
        <i class="pi pi-exclamation-circle"></i>
        <h2>找不到商品</h2>
        <button pButton label="返回商品列表" routerLink="/base-data/products"></button>
      </div>
    }
  `,
  styles: [`
    .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: var(--text-color-secondary); }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { display: flex; align-items: center; gap: 1rem; background: var(--surface-card); border-radius: 8px; padding: 1.25rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-icon.stock { background: var(--blue-100); color: var(--blue-600); }
    .stat-icon.sales { background: var(--green-100); color: var(--green-600); }
    .stat-icon.revenue { background: var(--orange-100); color: var(--orange-600); }
    .stat-icon.profit { background: var(--purple-100); color: var(--purple-600); }
    .stat-content { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .tab-selector { margin-bottom: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
    .info-section { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .info-section h3 { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; }
    .info-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .info-item.full-width { grid-column: span 2; }
    .info-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .info-value { font-size: 0.9375rem; font-weight: 500; }
    .info-value.price { font-size: 1.125rem; }
    .info-value.highlight { color: var(--primary-color); }
    .positive { color: var(--green-500); }
    .negative { color: var(--red-500); }
    .stock-section, .movement-section, .chart-section { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .chart-section h3 { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; }
    .link { color: var(--primary-color); cursor: pointer; }
    .action-bar { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding: 1rem; background: var(--surface-card); border-radius: 8px; }
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; text-align: center; }
    .not-found i { font-size: 4rem; color: var(--orange-500); margin-bottom: 1rem; }
  `],
})
export class ProductDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  loading = signal(true);
  product = signal<Product | null>(null);
  productId: number = 0;
  activeTab = 'info';

  tabOptions = [
    { label: '基本資訊', value: 'info' },
    { label: '庫存分布', value: 'stock' },
    { label: '異動紀錄', value: 'movement' },
    { label: '銷售趨勢', value: 'trend' },
  ];

  monthlySales = signal(0);
  monthlyRevenue = signal(0);
  warehouseStocks = signal<WarehouseStock[]>([]);
  stockMovements = signal<StockMovement[]>([]);
  salesChartData = signal<any>({});

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId = +id;
      this.loadProduct(this.productId);
    }
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    setTimeout(() => {
      const mockProduct: Product = {
        id, code: 'P001', barcode: '4710088012345', name: '有機鮮奶 1L',
        description: '來自台灣在地牧場的有機鮮奶，新鮮直送，營養豐富。',
        category_id: 1, category: { id: 1, code: 'C01', name: '乳製品', level: 1, sort_order: 1, is_active: true, created_at: '', updated_at: '' },
        unit_id: 4, unit: { id: 4, code: 'BTL', name: '瓶', is_active: true, created_at: '', updated_at: '' },
        tax_type_id: 1, cost_price: 55, selling_price: 70, min_stock: 20, max_stock: 200,
        is_active: true, is_combo: false, image_url: '', variants: [],
        created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-20T14:30:00Z',
      };
      this.product.set(mockProduct);
      this.monthlySales.set(156);
      this.monthlyRevenue.set(10920);
      this.warehouseStocks.set([
        { warehouse_name: '總倉', quantity: 150, min_stock: 50, max_stock: 300, status: 'normal' },
        { warehouse_name: '台北門市', quantity: 25, min_stock: 20, max_stock: 100, status: 'normal' },
        { warehouse_name: '台中門市', quantity: 15, min_stock: 20, max_stock: 100, status: 'low' },
      ]);
      this.stockMovements.set([
        { id: 1, date: '2024-01-20T14:30:00Z', type: 'out', type_name: '銷售出貨', reference: 'SO-20240120-001', quantity: -5, balance: 215, warehouse: '台北門市', operator: '王小明' },
        { id: 2, date: '2024-01-20T10:15:00Z', type: 'in', type_name: '採購入庫', reference: 'PO-20240118-003', quantity: 50, balance: 220, warehouse: '總倉', operator: '李小華' },
        { id: 3, date: '2024-01-19T16:45:00Z', type: 'adjust', type_name: '盤點調整', reference: 'ADJ-20240118-001', quantity: -3, balance: 190, warehouse: '總倉', operator: '陳小玲' },
      ]);
      const labels: string[] = [], salesData: number[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
        salesData.push(Math.floor(Math.random() * 10) + 2);
      }
      this.salesChartData.set({
        labels,
        datasets: [{ label: '銷售數量', data: salesData, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4, fill: true }],
      });
      this.loading.set(false);
    }, 500);
  }

  getProfit(): number {
    const p = this.product();
    return p ? p.selling_price - p.cost_price : 0;
  }

  getProfitMargin(): number {
    const p = this.product();
    if (!p || p.selling_price === 0) return 0;
    return ((p.selling_price - p.cost_price) / p.selling_price) * 100;
  }

  getTotalStock(): number {
    return this.warehouseStocks().reduce((sum, s) => sum + s.quantity, 0);
  }

  getStockPercentage(stock: WarehouseStock): number {
    return stock.max_stock === 0 ? 0 : Math.min((stock.quantity / stock.max_stock) * 100, 100);
  }

  getStockStatusLabel(status: string): string {
    const labels: Record<string, string> = { normal: '正常', low: '偏低', overstock: '過量' };
    return labels[status] || status;
  }

  getStockStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'warn' | 'danger'> = { normal: 'success', low: 'warn', overstock: 'danger' };
    return severities[status] || 'info';
  }

  getMovementSeverity(type: string): 'success' | 'warn' | 'info' | 'secondary' | 'danger' | 'contrast' {
    const severities: Record<string, 'success' | 'warn' | 'info'> = { in: 'success', out: 'warn', adjust: 'info' };
    return severities[type] || 'info';
  }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: `確定要刪除商品「${this.product()?.name}」嗎？`,
      header: '確認刪除', icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除', rejectLabel: '取消', acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: '商品已刪除' });
        this.router.navigate(['/base-data/products']);
      },
    });
  }
}
