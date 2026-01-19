/**
 * 庫存查詢頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

interface InventoryItem {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  category_name: string;
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  min_quantity: number;
  max_quantity: number;
  unit: string;
  last_movement_at: string;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, ProgressBarModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="庫存查詢"
      subtitle="查詢各倉庫庫存"
      [breadcrumbs]="[{ label: '庫存管理' }, { label: '庫存查詢' }]"
    >
      <button pButton label="匯出報表" icon="pi pi-download" class="p-button-outlined"></button>
    </app-page-header>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-box"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalProducts }}</div>
          <div class="stat-label">商品項目</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-warehouse"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalQuantity | number }}</div>
          <div class="stat-label">總庫存數</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><i class="pi pi-exclamation-triangle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().lowStock }}</div>
          <div class="stat-label">低庫存警示</div>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon"><i class="pi pi-times-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().outOfStock }}</div>
          <div class="stat-label">缺貨商品</div>
        </div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="inventory()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋商品..." />
              </p-iconField>
              <p-select [options]="warehouseOptions" [(ngModel)]="selectedWarehouse" placeholder="倉庫" [showClear]="true"></p-select>
              <p-select [options]="categoryOptions" [(ngModel)]="selectedCategory" placeholder="類別" [showClear]="true"></p-select>
              <p-select [options]="stockStatusOptions" [(ngModel)]="selectedStockStatus" placeholder="庫存狀態" [showClear]="true"></p-select>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 100px">商品編號</th>
            <th>商品名稱</th>
            <th style="width: 100px">類別</th>
            <th style="width: 100px">倉庫</th>
            <th style="width: 100px; text-align: right">庫存數量</th>
            <th style="width: 80px; text-align: right">預留</th>
            <th style="width: 80px; text-align: right">可用</th>
            <th style="width: 150px">庫存水位</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 100px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-item>
          <tr>
            <td><span class="code-text">{{ item.product_code }}</span></td>
            <td>{{ item.product_name }}</td>
            <td>{{ item.category_name }}</td>
            <td>{{ item.warehouse_name }}</td>
            <td class="text-right">{{ item.quantity }} {{ item.unit }}</td>
            <td class="text-right">{{ item.reserved_quantity }}</td>
            <td class="text-right font-semibold">{{ item.available_quantity }}</td>
            <td>
              <div class="stock-level">
                <p-progressBar
                  [value]="getStockPercentage(item)"
                  [showValue]="false"
                  [style]="{ height: '8px' }"
                  [styleClass]="getStockBarClass(item)">
                </p-progressBar>
                <span class="stock-range">{{ item.min_quantity }} - {{ item.max_quantity }}</span>
              </div>
            </td>
            <td class="text-center">
              <p-tag [value]="getStockStatus(item)" [severity]="getStockSeverity(item)"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-history" class="p-button-text p-button-sm" (click)="viewHistory(item)" pTooltip="異動紀錄"></button>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="adjustStock(item)" pTooltip="調整庫存"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="10" class="text-center p-4">尚無庫存資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 異動紀錄對話框 -->
    <p-dialog [(visible)]="historyVisible" header="庫存異動紀錄" [modal]="true" [style]="{ width: '700px' }">
      @if (selectedItem) {
        <div class="history-header">
          <span class="product-name">{{ selectedItem.product_name }}</span>
          <span class="product-code">{{ selectedItem.product_code }}</span>
        </div>
        <p-table [value]="movementHistory" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>時間</th>
              <th>類型</th>
              <th style="text-align: right">數量</th>
              <th>備註</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr>
              <td>{{ m.created_at }}</td>
              <td><p-tag [value]="m.type" [severity]="m.quantity > 0 ? 'success' : 'danger'"></p-tag></td>
              <td class="text-right" [class.text-success]="m.quantity > 0" [class.text-danger]="m.quantity < 0">
                {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
              </td>
              <td>{{ m.remark }}</td>
            </tr>
          </ng-template>
        </p-table>
      }
      <ng-template pTemplate="footer">
        <button pButton label="關閉" class="p-button-text" (click)="historyVisible = false"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--primary-100); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .stat-card.warning .stat-icon { background: var(--yellow-100); color: var(--yellow-600); }
    .stat-card.danger .stat-icon { background: var(--red-100); color: var(--red-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .code-text { font-family: monospace; font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .stock-level { display: flex; flex-direction: column; gap: 0.25rem; }
    .stock-range { font-size: 0.75rem; color: var(--text-color-secondary); }
    .text-success { color: var(--green-600); }
    .text-danger { color: var(--red-600); }
    .history-header { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--surface-border); }
    .history-header .product-name { font-size: 1.125rem; font-weight: 600; display: block; }
    .history-header .product-code { font-size: 0.875rem; color: var(--text-color-secondary); }
    :host ::ng-deep .stock-bar-success .p-progressbar-value { background: var(--green-500); }
    :host ::ng-deep .stock-bar-warning .p-progressbar-value { background: var(--yellow-500); }
    :host ::ng-deep .stock-bar-danger .p-progressbar-value { background: var(--red-500); }
  `],
})
export class InventoryListComponent implements OnInit {
  private readonly messageService = inject(MessageService);

  inventory = signal<InventoryItem[]>([]);
  loading = signal(false);
  stats = signal({ totalProducts: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0 });
  searchValue = '';
  selectedWarehouse: number | null = null;
  selectedCategory: number | null = null;
  selectedStockStatus: string | null = null;
  historyVisible = false;
  selectedItem: InventoryItem | null = null;
  movementHistory: { created_at: string; type: string; quantity: number; remark: string }[] = [];

  warehouseOptions = [
    { label: '總倉', value: 1 },
    { label: '北區倉庫', value: 2 },
    { label: '中區倉庫', value: 3 },
    { label: '南區倉庫', value: 4 },
  ];

  categoryOptions = [
    { label: '飲料', value: 1 },
    { label: '零食', value: 2 },
    { label: '日用品', value: 3 },
    { label: '生鮮', value: 4 },
  ];

  stockStatusOptions = [
    { label: '正常', value: 'normal' },
    { label: '低庫存', value: 'low' },
    { label: '缺貨', value: 'out' },
  ];

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: InventoryItem[] = [
        { id: 1, product_id: 1, product_code: 'P001', product_name: '可口可樂 330ml', category_name: '飲料', warehouse_id: 1, warehouse_name: '總倉', quantity: 500, reserved_quantity: 20, available_quantity: 480, min_quantity: 100, max_quantity: 1000, unit: '罐', last_movement_at: '2026-01-19' },
        { id: 2, product_id: 2, product_code: 'P002', product_name: '百事可樂 330ml', category_name: '飲料', warehouse_id: 1, warehouse_name: '總倉', quantity: 350, reserved_quantity: 0, available_quantity: 350, min_quantity: 100, max_quantity: 800, unit: '罐', last_movement_at: '2026-01-19' },
        { id: 3, product_id: 3, product_code: 'P003', product_name: '樂事洋芋片', category_name: '零食', warehouse_id: 1, warehouse_name: '總倉', quantity: 80, reserved_quantity: 10, available_quantity: 70, min_quantity: 50, max_quantity: 300, unit: '包', last_movement_at: '2026-01-18' },
        { id: 4, product_id: 4, product_code: 'P004', product_name: '舒潔衛生紙', category_name: '日用品', warehouse_id: 2, warehouse_name: '北區倉庫', quantity: 15, reserved_quantity: 0, available_quantity: 15, min_quantity: 30, max_quantity: 200, unit: '串', last_movement_at: '2026-01-17' },
        { id: 5, product_id: 5, product_code: 'P005', product_name: '鮮奶 1L', category_name: '生鮮', warehouse_id: 1, warehouse_name: '總倉', quantity: 0, reserved_quantity: 0, available_quantity: 0, min_quantity: 20, max_quantity: 100, unit: '瓶', last_movement_at: '2026-01-16' },
        { id: 6, product_id: 6, product_code: 'P006', product_name: '泡麵 5入', category_name: '零食', warehouse_id: 3, warehouse_name: '中區倉庫', quantity: 200, reserved_quantity: 30, available_quantity: 170, min_quantity: 50, max_quantity: 500, unit: '組', last_movement_at: '2026-01-19' },
      ];
      this.inventory.set(data);
      this.stats.set({
        totalProducts: data.length,
        totalQuantity: data.reduce((sum, i) => sum + i.quantity, 0),
        lowStock: data.filter(i => i.quantity > 0 && i.quantity <= i.min_quantity).length,
        outOfStock: data.filter(i => i.quantity === 0).length,
      });
      this.loading.set(false);
    }, 500);
  }

  getStockPercentage(item: InventoryItem): number {
    if (item.max_quantity === 0) return 0;
    return Math.min(100, (item.quantity / item.max_quantity) * 100);
  }

  getStockBarClass(item: InventoryItem): string {
    if (item.quantity === 0) return 'stock-bar-danger';
    if (item.quantity <= item.min_quantity) return 'stock-bar-warning';
    return 'stock-bar-success';
  }

  getStockStatus(item: InventoryItem): string {
    if (item.quantity === 0) return '缺貨';
    if (item.quantity <= item.min_quantity) return '低庫存';
    return '正常';
  }

  getStockSeverity(item: InventoryItem): 'success' | 'warn' | 'danger' {
    if (item.quantity === 0) return 'danger';
    if (item.quantity <= item.min_quantity) return 'warn';
    return 'success';
  }

  viewHistory(item: InventoryItem): void {
    this.selectedItem = item;
    this.movementHistory = [
      { created_at: '2026-01-19 14:30', type: '銷售出庫', quantity: -20, remark: '訂單 SO20260119001' },
      { created_at: '2026-01-19 10:00', type: '採購入庫', quantity: 100, remark: '採購單 PO20260118001' },
      { created_at: '2026-01-18 16:20', type: '銷售出庫', quantity: -15, remark: '訂單 SO20260118003' },
      { created_at: '2026-01-18 09:00', type: '調撥入庫', quantity: 50, remark: '從北區倉庫調入' },
    ];
    this.historyVisible = true;
  }

  adjustStock(item: InventoryItem): void {
    this.messageService.add({ severity: 'info', summary: '提示', detail: `請前往庫存調整頁面調整「${item.product_name}」的庫存` });
  }
}
