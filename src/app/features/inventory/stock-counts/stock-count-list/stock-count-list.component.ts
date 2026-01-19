/**
 * 庫存盤點列表頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type StockCountStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

interface StockCount {
  id: number;
  count_no: string;
  warehouse_id: number;
  warehouse_name: string;
  type: string;
  status: StockCountStatus;
  total_items: number;
  counted_items: number;
  variance_items: number;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

@Component({
  selector: 'app-stock-count-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, ConfirmDialogModule, ProgressBarModule, PageHeaderComponent,
    DatePipe, DecimalPipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="庫存盤點"
      subtitle="管理盤點作業"
      [breadcrumbs]="[{ label: '庫存管理' }, { label: '庫存盤點' }]"
    >
      <button pButton label="新增盤點單" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats().total }}</div>
        <div class="stat-label">盤點單總數</div>
      </div>
      <div class="stat-card progress">
        <div class="stat-value">{{ stats().inProgress }}</div>
        <div class="stat-label">進行中</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-value">{{ stats().completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card variance">
        <div class="stat-value">{{ stats().withVariance }}</div>
        <div class="stat-label">有差異</div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="stockCounts()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋盤點單號..." />
              </p-iconField>
              <p-select [options]="warehouseOptions" [(ngModel)]="selectedWarehouse" placeholder="倉庫" [showClear]="true"></p-select>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 130px">盤點單號</th>
            <th style="width: 100px">倉庫</th>
            <th style="width: 100px">盤點類型</th>
            <th style="width: 180px">盤點進度</th>
            <th style="width: 80px; text-align: center">差異項</th>
            <th style="width: 100px">建立者</th>
            <th style="width: 140px">建立時間</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 140px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-sc>
          <tr>
            <td><span class="count-no">{{ sc.count_no }}</span></td>
            <td>{{ sc.warehouse_name }}</td>
            <td>{{ sc.type }}</td>
            <td>
              <div class="progress-cell">
                <p-progressBar [value]="getProgress(sc)" [showValue]="false" [style]="{ height: '8px' }"></p-progressBar>
                <span class="progress-text">{{ sc.counted_items }} / {{ sc.total_items }}</span>
              </div>
            </td>
            <td class="text-center">
              @if (sc.variance_items > 0) {
                <span class="variance-badge">{{ sc.variance_items }}</span>
              } @else {
                <span class="text-secondary">-</span>
              }
            </td>
            <td>{{ sc.created_by }}</td>
            <td>{{ sc.created_at | date:'yyyy/MM/dd HH:mm' }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(sc.status)" [severity]="getStatusSeverity(sc.status)"></p-tag>
            </td>
            <td class="text-center">
              @if (sc.status === 'draft') {
                <button pButton icon="pi pi-play" class="p-button-text p-button-success p-button-sm" (click)="startCount(sc)" pTooltip="開始盤點"></button>
              }
              @if (sc.status === 'in_progress') {
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="continueCount(sc)" pTooltip="繼續盤點"></button>
                <button pButton icon="pi pi-check" class="p-button-text p-button-success p-button-sm" (click)="completeCount(sc)" pTooltip="完成盤點"></button>
              }
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" (click)="viewDetail(sc)" pTooltip="檢視"></button>
              @if (sc.status === 'draft' || sc.status === 'in_progress') {
                <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" (click)="cancelCount(sc)" pTooltip="取消"></button>
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="9" class="text-center p-4">尚無盤點單資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 新增盤點單對話框 -->
    <p-dialog [(visible)]="dialogVisible" header="新增盤點單" [modal]="true" [style]="{ width: '500px' }">
      <div class="form-field">
        <label>倉庫</label>
        <p-select [options]="warehouseOptions" [(ngModel)]="form.warehouse_id" placeholder="選擇倉庫" class="w-full"></p-select>
      </div>
      <div class="form-field">
        <label>盤點類型</label>
        <p-select [options]="typeOptions" [(ngModel)]="form.type" class="w-full"></p-select>
      </div>
      <div class="form-field">
        <label>盤點範圍</label>
        <p-select [options]="scopeOptions" [(ngModel)]="form.scope" class="w-full"></p-select>
      </div>
      @if (form.scope === 'category') {
        <div class="form-field">
          <label>指定類別</label>
          <p-select [options]="categoryOptions" [(ngModel)]="form.category_id" placeholder="選擇類別" class="w-full"></p-select>
        </div>
      }
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="建立" (click)="createStockCount()"></button>
      </ng-template>
    </p-dialog>

    <!-- 詳情對話框 -->
    <p-dialog [(visible)]="detailVisible" header="盤點單詳情" [modal]="true" [style]="{ width: '700px' }">
      @if (selectedCount) {
        <div class="detail-header">
          <div class="count-info">
            <span class="count-number">{{ selectedCount.count_no }}</span>
            <p-tag [value]="getStatusLabel(selectedCount.status)" [severity]="getStatusSeverity(selectedCount.status)"></p-tag>
          </div>
          <div class="count-meta">
            {{ selectedCount.warehouse_name }} | {{ selectedCount.type }} | {{ selectedCount.created_by }}
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-info">
            <span>盤點進度</span>
            <span>{{ selectedCount.counted_items }} / {{ selectedCount.total_items }} ({{ getProgress(selectedCount) | number:'1.0-0' }}%)</span>
          </div>
          <p-progressBar [value]="getProgress(selectedCount)" [style]="{ height: '12px' }"></p-progressBar>
        </div>

        @if (selectedCount.variance_items > 0) {
          <div class="variance-section">
            <h4>差異項目 ({{ selectedCount.variance_items }})</h4>
            <p-table [value]="varianceItems" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>商品</th>
                  <th style="text-align: right">系統數量</th>
                  <th style="text-align: right">實際數量</th>
                  <th style="text-align: right">差異</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-v>
                <tr>
                  <td>{{ v.product_name }}</td>
                  <td class="text-right">{{ v.system_qty }}</td>
                  <td class="text-right">{{ v.actual_qty }}</td>
                  <td class="text-right" [class.text-success]="v.variance > 0" [class.text-danger]="v.variance < 0">
                    {{ v.variance > 0 ? '+' : '' }}{{ v.variance }}
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }
      }
      <ng-template pTemplate="footer">
        <button pButton label="關閉" class="p-button-text" (click)="detailVisible = false"></button>
        @if (selectedCount?.status === 'completed' && (selectedCount?.variance_items ?? 0) > 0) {
          <button pButton label="產生調整單" icon="pi pi-file" (click)="generateAdjustment()"></button>
        }
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; text-align: center; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
    .stat-card.progress .stat-value { color: var(--blue-500); }
    .stat-card.completed .stat-value { color: var(--green-500); }
    .stat-card.variance .stat-value { color: var(--orange-500); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); margin-top: 0.25rem; }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left { display: flex; gap: 0.5rem; align-items: center; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .text-success { color: var(--green-600); }
    .text-danger { color: var(--red-600); }
    .count-no { font-family: monospace; font-weight: 600; color: var(--primary-color); }
    .progress-cell { display: flex; flex-direction: column; gap: 0.25rem; }
    .progress-text { font-size: 0.75rem; color: var(--text-color-secondary); }
    .variance-badge { background: var(--orange-100); color: var(--orange-700); padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.875rem; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .detail-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--surface-border); }
    .count-info { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .count-number { font-size: 1.25rem; font-weight: 700; font-family: monospace; }
    .count-meta { font-size: 0.875rem; color: var(--text-color-secondary); }
    .progress-section { margin-bottom: 1.5rem; }
    .progress-info { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .variance-section { border-top: 1px solid var(--surface-border); padding-top: 1rem; }
    .variance-section h4 { margin: 0 0 1rem; color: var(--orange-600); }
  `],
})
export class StockCountListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  stockCounts = signal<StockCount[]>([]);
  loading = signal(false);
  stats = signal({ total: 0, inProgress: 0, completed: 0, withVariance: 0 });
  searchValue = '';
  selectedWarehouse: number | null = null;
  selectedStatus: StockCountStatus | null = null;
  dialogVisible = false;
  detailVisible = false;
  selectedCount: StockCount | null = null;
  form: { warehouse_id: number | null; type: string; scope: string; category_id?: number } = { warehouse_id: null, type: 'periodic', scope: 'all' };
  varianceItems: { product_name: string; system_qty: number; actual_qty: number; variance: number }[] = [];

  warehouseOptions = [
    { label: '總倉', value: 1 },
    { label: '北區倉庫', value: 2 },
    { label: '中區倉庫', value: 3 },
  ];

  statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '進行中', value: 'in_progress' },
    { label: '已完成', value: 'completed' },
    { label: '已取消', value: 'cancelled' },
  ];

  typeOptions = [
    { label: '定期盤點', value: 'periodic' },
    { label: '臨時盤點', value: 'ad_hoc' },
    { label: '循環盤點', value: 'cycle' },
  ];

  scopeOptions = [
    { label: '全部商品', value: 'all' },
    { label: '指定類別', value: 'category' },
    { label: '低庫存商品', value: 'low_stock' },
  ];

  categoryOptions = [
    { label: '飲料', value: 1 },
    { label: '零食', value: 2 },
    { label: '日用品', value: 3 },
  ];

  ngOnInit(): void {
    this.loadStockCounts();
  }

  loadStockCounts(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: StockCount[] = [
        { id: 1, count_no: 'SC20260119001', warehouse_id: 1, warehouse_name: '總倉', type: '定期盤點', status: 'in_progress', total_items: 50, counted_items: 35, variance_items: 3, created_by: '張倉管', created_at: '2026-01-19T08:00:00' },
        { id: 2, count_no: 'SC20260118001', warehouse_id: 2, warehouse_name: '北區倉庫', type: '臨時盤點', status: 'completed', total_items: 30, counted_items: 30, variance_items: 2, created_by: '李倉管', created_at: '2026-01-18T09:00:00', completed_at: '2026-01-18T14:30:00' },
        { id: 3, count_no: 'SC20260117001', warehouse_id: 1, warehouse_name: '總倉', type: '循環盤點', status: 'completed', total_items: 20, counted_items: 20, variance_items: 0, created_by: '張倉管', created_at: '2026-01-17T10:00:00', completed_at: '2026-01-17T12:00:00' },
        { id: 4, count_no: 'SC20260120001', warehouse_id: 3, warehouse_name: '中區倉庫', type: '定期盤點', status: 'draft', total_items: 45, counted_items: 0, variance_items: 0, created_by: '王倉管', created_at: '2026-01-19T16:00:00' },
      ];
      this.stockCounts.set(data);
      this.stats.set({
        total: data.length,
        inProgress: data.filter(s => s.status === 'in_progress').length,
        completed: data.filter(s => s.status === 'completed').length,
        withVariance: data.filter(s => s.variance_items > 0).length,
      });
      this.loading.set(false);
    }, 500);
  }

  getProgress(sc: StockCount): number {
    if (sc.total_items === 0) return 0;
    return (sc.counted_items / sc.total_items) * 100;
  }

  getStatusLabel(status: StockCountStatus): string {
    const labels: Record<StockCountStatus, string> = { draft: '草稿', in_progress: '進行中', completed: '已完成', cancelled: '已取消' };
    return labels[status] || status;
  }

  getStatusSeverity(status: StockCountStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<StockCountStatus, 'success' | 'info' | 'warn' | 'secondary'> = { draft: 'secondary', in_progress: 'info', completed: 'success', cancelled: 'warn' };
    return severities[status] || 'info';
  }

  openDialog(): void {
    this.form = { warehouse_id: null, type: 'periodic', scope: 'all' };
    this.dialogVisible = true;
  }

  createStockCount(): void {
    if (!this.form.warehouse_id) {
      this.messageService.add({ severity: 'warn', summary: '提示', detail: '請選擇倉庫' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: '成功', detail: '盤點單已建立' });
    this.dialogVisible = false;
    this.loadStockCounts();
  }

  startCount(sc: StockCount): void {
    this.messageService.add({ severity: 'info', summary: '開始盤點', detail: `盤點單 ${sc.count_no} 已開始` });
    this.loadStockCounts();
  }

  continueCount(sc: StockCount): void {
    this.messageService.add({ severity: 'info', summary: '提示', detail: `繼續盤點 ${sc.count_no}` });
  }

  completeCount(sc: StockCount): void {
    this.confirmationService.confirm({
      message: `確定要完成盤點單「${sc.count_no}」嗎？完成後將無法修改。`,
      header: '確認完成',
      icon: 'pi pi-check-circle',
      acceptLabel: '確定完成',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `盤點單 ${sc.count_no} 已完成` });
        this.loadStockCounts();
      },
    });
  }

  viewDetail(sc: StockCount): void {
    this.selectedCount = sc;
    this.varianceItems = [
      { product_name: '可口可樂 330ml', system_qty: 500, actual_qty: 495, variance: -5 },
      { product_name: '樂事洋芋片', system_qty: 80, actual_qty: 78, variance: -2 },
      { product_name: '百事可樂 330ml', system_qty: 350, actual_qty: 355, variance: 5 },
    ];
    this.detailVisible = true;
  }

  cancelCount(sc: StockCount): void {
    this.confirmationService.confirm({
      message: `確定要取消盤點單「${sc.count_no}」嗎？`,
      header: '確認取消',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '確定取消',
      rejectLabel: '返回',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `盤點單 ${sc.count_no} 已取消` });
        this.loadStockCounts();
      },
    });
  }

  generateAdjustment(): void {
    this.messageService.add({ severity: 'success', summary: '成功', detail: '已產生庫存調整單' });
    this.detailVisible = false;
  }
}
