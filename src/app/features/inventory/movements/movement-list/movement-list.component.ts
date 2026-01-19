/**
 * 庫存異動紀錄列表頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type MovementType = 'purchase_in' | 'sales_out' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return_in' | 'return_out' | 'damage';

interface Movement {
  id: number;
  movement_no: string;
  warehouse_id: number;
  warehouse_name: string;
  product_id: number;
  product_code: string;
  product_name: string;
  type: MovementType;
  quantity: number;
  before_quantity: number;
  after_quantity: number;
  reference_no?: string;
  reference_type?: string;
  remark?: string;
  created_by: string;
  created_at: string;
}

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DatePickerModule, PageHeaderComponent, DatePipe,
  ],
  template: `
    <app-page-header
      title="異動紀錄"
      subtitle="查詢庫存異動歷史"
      [breadcrumbs]="[{ label: '庫存管理' }, { label: '異動紀錄' }]"
    >
      <button pButton label="匯出報表" icon="pi pi-download" class="p-button-outlined" (click)="exportReport()"></button>
    </app-page-header>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card in">
        <div class="stat-icon"><i class="pi pi-arrow-down"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalIn | number }}</div>
          <div class="stat-label">本日入庫</div>
        </div>
      </div>
      <div class="stat-card out">
        <div class="stat-icon"><i class="pi pi-arrow-up"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalOut | number }}</div>
          <div class="stat-label">本日出庫</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-sync"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalMovements }}</div>
          <div class="stat-label">異動筆數</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-box"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().productsAffected }}</div>
          <div class="stat-label">異動商品數</div>
        </div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="movements()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋商品或單號..." />
              </p-iconField>
              <p-select [options]="warehouseOptions" [(ngModel)]="selectedWarehouse" placeholder="倉庫" [showClear]="true"></p-select>
              <p-select [options]="typeOptions" [(ngModel)]="selectedType" placeholder="異動類型" [showClear]="true"></p-select>
              <p-datepicker [(ngModel)]="dateRange" selectionMode="range" placeholder="日期範圍" dateFormat="yy/mm/dd" [showIcon]="true"></p-datepicker>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-filter-slash" label="清除篩選" class="p-button-text" (click)="clearFilters()"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 140px">異動時間</th>
            <th style="width: 100px">倉庫</th>
            <th style="width: 90px">商品編號</th>
            <th>商品名稱</th>
            <th style="width: 100px; text-align: center">異動類型</th>
            <th style="width: 80px; text-align: right">異動數量</th>
            <th style="width: 80px; text-align: right">異動前</th>
            <th style="width: 80px; text-align: right">異動後</th>
            <th style="width: 130px">關聯單號</th>
            <th style="width: 80px">操作者</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-m>
          <tr>
            <td>{{ m.created_at | date:'MM/dd HH:mm:ss' }}</td>
            <td>{{ m.warehouse_name }}</td>
            <td><span class="product-code">{{ m.product_code }}</span></td>
            <td>{{ m.product_name }}</td>
            <td class="text-center">
              <p-tag [value]="getTypeLabel(m.type)" [severity]="getTypeSeverity(m.type)"></p-tag>
            </td>
            <td class="text-right" [class.quantity-in]="m.quantity > 0" [class.quantity-out]="m.quantity < 0">
              {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
            </td>
            <td class="text-right text-secondary">{{ m.before_quantity }}</td>
            <td class="text-right font-semibold">{{ m.after_quantity }}</td>
            <td>
              @if (m.reference_no) {
                <a class="reference-link" (click)="viewReference(m)">{{ m.reference_no }}</a>
              } @else {
                <span class="text-secondary">-</span>
              }
            </td>
            <td>{{ m.created_by }}</td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="10" class="text-center p-4">尚無異動紀錄</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-ground); color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.in .stat-icon { background: var(--green-100); color: var(--green-600); }
    .stat-card.out .stat-icon { background: var(--red-100); color: var(--red-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .font-semibold { font-weight: 600; }
    .product-code { font-family: monospace; font-size: 0.875rem; }
    .quantity-in { color: var(--green-600); font-weight: 600; }
    .quantity-out { color: var(--red-600); font-weight: 600; }
    .reference-link { color: var(--primary-color); text-decoration: none; cursor: pointer; font-size: 0.875rem; }
    .reference-link:hover { text-decoration: underline; }
  `],
})
export class MovementListComponent implements OnInit {
  private readonly messageService = inject(MessageService);

  movements = signal<Movement[]>([]);
  loading = signal(false);
  stats = signal({ totalIn: 0, totalOut: 0, totalMovements: 0, productsAffected: 0 });
  searchValue = '';
  selectedWarehouse: number | null = null;
  selectedType: MovementType | null = null;
  dateRange: Date[] | null = null;

  warehouseOptions = [
    { label: '總倉', value: 1 },
    { label: '北區倉庫', value: 2 },
    { label: '中區倉庫', value: 3 },
    { label: '南區倉庫', value: 4 },
  ];

  typeOptions = [
    { label: '採購入庫', value: 'purchase_in' },
    { label: '銷售出庫', value: 'sales_out' },
    { label: '調撥入庫', value: 'transfer_in' },
    { label: '調撥出庫', value: 'transfer_out' },
    { label: '庫存調整', value: 'adjustment' },
    { label: '退貨入庫', value: 'return_in' },
    { label: '退貨出庫', value: 'return_out' },
    { label: '報損', value: 'damage' },
  ];

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: Movement[] = [
        { id: 1, movement_no: 'MV20260119001', warehouse_id: 1, warehouse_name: '總倉', product_id: 1, product_code: 'P001', product_name: '可口可樂 330ml', type: 'sales_out', quantity: -20, before_quantity: 520, after_quantity: 500, reference_no: 'SO20260119001', reference_type: 'order', created_by: '系統', created_at: '2026-01-19T14:30:25' },
        { id: 2, movement_no: 'MV20260119002', warehouse_id: 1, warehouse_name: '總倉', product_id: 2, product_code: 'P002', product_name: '百事可樂 330ml', type: 'sales_out', quantity: -10, before_quantity: 360, after_quantity: 350, reference_no: 'SO20260119001', reference_type: 'order', created_by: '系統', created_at: '2026-01-19T14:30:25' },
        { id: 3, movement_no: 'MV20260119003', warehouse_id: 1, warehouse_name: '總倉', product_id: 1, product_code: 'P001', product_name: '可口可樂 330ml', type: 'purchase_in', quantity: 100, before_quantity: 420, after_quantity: 520, reference_no: 'PO20260118001', reference_type: 'purchase', created_by: '張倉管', created_at: '2026-01-19T10:00:00' },
        { id: 4, movement_no: 'MV20260119004', warehouse_id: 2, warehouse_name: '北區倉庫', product_id: 3, product_code: 'P003', product_name: '樂事洋芋片', type: 'transfer_in', quantity: 50, before_quantity: 30, after_quantity: 80, reference_no: 'TF20260119001', reference_type: 'transfer', created_by: '系統', created_at: '2026-01-19T11:30:00' },
        { id: 5, movement_no: 'MV20260119005', warehouse_id: 1, warehouse_name: '總倉', product_id: 3, product_code: 'P003', product_name: '樂事洋芋片', type: 'transfer_out', quantity: -50, before_quantity: 130, after_quantity: 80, reference_no: 'TF20260119001', reference_type: 'transfer', created_by: '系統', created_at: '2026-01-19T10:30:00' },
        { id: 6, movement_no: 'MV20260119006', warehouse_id: 1, warehouse_name: '總倉', product_id: 4, product_code: 'P004', product_name: '舒潔衛生紙', type: 'damage', quantity: -5, before_quantity: 20, after_quantity: 15, reference_no: 'ADJ20260119001', reference_type: 'adjustment', remark: '包裝破損', created_by: '張倉管', created_at: '2026-01-19T09:30:00' },
        { id: 7, movement_no: 'MV20260118001', warehouse_id: 1, warehouse_name: '總倉', product_id: 5, product_code: 'P005', product_name: '鮮奶 1L', type: 'return_in', quantity: 10, before_quantity: 0, after_quantity: 10, reference_no: 'RT20260118001', reference_type: 'return', created_by: '系統', created_at: '2026-01-18T16:00:00' },
        { id: 8, movement_no: 'MV20260118002', warehouse_id: 3, warehouse_name: '中區倉庫', product_id: 6, product_code: 'P006', product_name: '泡麵 5入', type: 'adjustment', quantity: 12, before_quantity: 188, after_quantity: 200, reference_no: 'SC20260118001', reference_type: 'stock_count', remark: '盤點校正', created_by: '李倉管', created_at: '2026-01-18T14:30:00' },
      ];
      this.movements.set(data);

      const inQty = data.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0);
      const outQty = data.filter(m => m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0);
      const products = new Set(data.map(m => m.product_id));

      this.stats.set({
        totalIn: inQty,
        totalOut: outQty,
        totalMovements: data.length,
        productsAffected: products.size,
      });
      this.loading.set(false);
    }, 500);
  }

  getTypeLabel(type: MovementType): string {
    const labels: Record<MovementType, string> = {
      purchase_in: '採購入庫',
      sales_out: '銷售出庫',
      transfer_in: '調撥入庫',
      transfer_out: '調撥出庫',
      adjustment: '庫存調整',
      return_in: '退貨入庫',
      return_out: '退貨出庫',
      damage: '報損',
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: MovementType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const isIn = ['purchase_in', 'transfer_in', 'return_in'].includes(type);
    const isOut = ['sales_out', 'transfer_out', 'return_out'].includes(type);
    if (isIn) return 'success';
    if (isOut) return 'danger';
    if (type === 'damage') return 'warn';
    return 'info';
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedWarehouse = null;
    this.selectedType = null;
    this.dateRange = null;
  }

  viewReference(m: Movement): void {
    this.messageService.add({ severity: 'info', summary: '提示', detail: `查看關聯單據：${m.reference_no}` });
  }

  exportReport(): void {
    this.messageService.add({ severity: 'info', summary: '匯出', detail: '正在產生異動報表...' });
  }
}
