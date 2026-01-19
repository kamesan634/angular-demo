/**
 * 採購建議列表頁面元件
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
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type SuggestionReason = 'low_stock' | 'safety_stock' | 'forecast' | 'seasonal' | 'reorder_point';
type SuggestionPriority = 'high' | 'medium' | 'low';
type SuggestionStatus = 'pending' | 'approved' | 'ordered' | 'dismissed';

interface PurchaseSuggestion {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  supplier_id: number;
  supplier_name: string;
  current_stock: number;
  safety_stock: number;
  reorder_point: number;
  suggested_qty: number;
  unit_cost: number;
  reason: SuggestionReason;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  avg_daily_sales: number;
  days_of_stock: number;
  lead_time_days: number;
  created_at: string;
  selected?: boolean;
}

@Component({
  selector: 'app-suggestion-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, CheckboxModule, ProgressBarModule, ConfirmDialogModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="採購建議"
      subtitle="系統自動產生的採購建議"
      [breadcrumbs]="[{ label: '採購管理' }, { label: '採購建議' }]"
    >
      <button pButton label="重新計算建議" icon="pi pi-refresh" class="p-button-outlined" (click)="recalculate()"></button>
      <button pButton label="批次建立採購單" icon="pi pi-shopping-cart" [disabled]="!hasSelectedItems()" (click)="createPurchaseOrders()"></button>
    </app-page-header>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card urgent">
        <div class="stat-icon"><i class="pi pi-exclamation-triangle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().urgentCount }}</div>
          <div class="stat-label">緊急補貨</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-clock"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().pendingCount }}</div>
          <div class="stat-label">待處理建議</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-box"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalProducts }}</div>
          <div class="stat-label">涉及商品數</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-dollar"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalAmount | number:'1.0-0' }}</div>
          <div class="stat-label">預估採購金額</div>
        </div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="suggestions()" [paginator]="true" [rows]="15" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-checkbox [(ngModel)]="selectAll" [binary]="true" (onChange)="toggleSelectAll()" label="全選"></p-checkbox>
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋商品..." />
              </p-iconField>
              <p-select [options]="priorityOptions" [(ngModel)]="selectedPriority" placeholder="優先級" [showClear]="true"></p-select>
              <p-select [options]="reasonOptions" [(ngModel)]="selectedReason" placeholder="建議原因" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              @if (getSelectedCount() > 0) { <span class="selected-info">已選 {{ getSelectedCount() }} 項</span> }
              <button pButton icon="pi pi-check" label="批次核准" class="p-button-success p-button-sm" [disabled]="!hasSelectedItems()" (click)="batchApprove()"></button>
              <button pButton icon="pi pi-times" label="批次忽略" class="p-button-secondary p-button-sm" [disabled]="!hasSelectedItems()" (click)="batchDismiss()"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 50px"></th>
            <th style="width: 80px">優先級</th>
            <th style="width: 90px">商品編號</th>
            <th>商品名稱</th>
            <th style="width: 100px">供應商</th>
            <th style="width: 80px; text-align: right">現有庫存</th>
            <th style="width: 100px">庫存狀態</th>
            <th style="width: 80px; text-align: right">建議數量</th>
            <th style="width: 90px; text-align: right">預估金額</th>
            <th style="width: 90px">建議原因</th>
            <th style="width: 80px">狀態</th>
            <th style="width: 100px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-s>
          <tr>
            <td>
              <p-checkbox [(ngModel)]="s.selected" [binary]="true" [disabled]="s.status !== 'pending'"></p-checkbox>
            </td>
            <td>
              <p-tag [value]="getPriorityLabel(s.priority)" [severity]="getPrioritySeverity(s.priority)"></p-tag>
            </td>
            <td><span class="product-code">{{ s.product_code }}</span></td>
            <td>{{ s.product_name }}</td>
            <td>{{ s.supplier_name }}</td>
            <td class="text-right">{{ s.current_stock }}</td>
            <td>
              <div class="stock-status">
                <p-progressBar [value]="getStockPercentage(s)" [showValue]="false" [style]="{height: '6px'}"></p-progressBar>
                <span class="stock-days">{{ s.days_of_stock }}天</span>
              </div>
            </td>
            <td class="text-right font-semibold">{{ s.suggested_qty }}</td>
            <td class="text-right">{{ s.suggested_qty * s.unit_cost | number:'1.0-0' }}</td>
            <td>
              <span class="reason-badge" [pTooltip]="getReasonTooltip(s)">{{ getReasonLabel(s.reason) }}</span>
            </td>
            <td>
              <p-tag [value]="getStatusLabel(s.status)" [severity]="getStatusSeverity(s.status)"></p-tag>
            </td>
            <td class="text-center">
              @if (s.status === 'pending') {
                <button pButton icon="pi pi-check" class="p-button-success p-button-text p-button-sm" pTooltip="核准" (click)="approve(s)"></button>
                <button pButton icon="pi pi-shopping-cart" class="p-button-text p-button-sm" pTooltip="建立採購單" (click)="createOrder(s)"></button>
                <button pButton icon="pi pi-times" class="p-button-secondary p-button-text p-button-sm" pTooltip="忽略" (click)="dismiss(s)"></button>
              } @else {
                <span class="text-secondary">-</span>
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="12" class="text-center p-4">目前沒有採購建議</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-ground); color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.urgent .stat-icon { background: var(--red-100); color: var(--red-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .selected-info { color: var(--primary-color); font-weight: 500; margin-right: 0.5rem; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .font-semibold { font-weight: 600; }
    .product-code { font-family: monospace; font-size: 0.875rem; }
    .stock-status { display: flex; align-items: center; gap: 0.5rem; }
    .stock-days { font-size: 0.75rem; color: var(--text-color-secondary); white-space: nowrap; }
    .reason-badge { font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--surface-ground); border-radius: 4px; cursor: help; }
  `],
})
export class SuggestionListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  suggestions = signal<PurchaseSuggestion[]>([]);
  loading = signal(false);
  stats = signal({ urgentCount: 0, pendingCount: 0, totalProducts: 0, totalAmount: 0 });
  searchValue = '';
  selectedPriority: SuggestionPriority | null = null;
  selectedReason: SuggestionReason | null = null;
  selectAll = false;

  priorityOptions = [
    { label: '高', value: 'high' },
    { label: '中', value: 'medium' },
    { label: '低', value: 'low' },
  ];

  reasonOptions = [
    { label: '低於安全庫存', value: 'low_stock' },
    { label: '安全庫存預警', value: 'safety_stock' },
    { label: '銷售預測', value: 'forecast' },
    { label: '季節性備貨', value: 'seasonal' },
    { label: '到達再訂購點', value: 'reorder_point' },
  ];

  ngOnInit(): void {
    this.loadSuggestions();
  }

  loadSuggestions(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: PurchaseSuggestion[] = [
        { id: 1, product_id: 1, product_code: 'P001', product_name: '可口可樂 330ml', supplier_id: 1, supplier_name: '大統飲料', current_stock: 50, safety_stock: 100, reorder_point: 80, suggested_qty: 200, unit_cost: 12, reason: 'low_stock', priority: 'high', status: 'pending', avg_daily_sales: 25, days_of_stock: 2, lead_time_days: 3, created_at: '2026-01-19' },
        { id: 2, product_id: 2, product_code: 'P002', product_name: '百事可樂 330ml', supplier_id: 1, supplier_name: '大統飲料', current_stock: 80, safety_stock: 100, reorder_point: 80, suggested_qty: 150, unit_cost: 11, reason: 'reorder_point', priority: 'medium', status: 'pending', avg_daily_sales: 15, days_of_stock: 5, lead_time_days: 3, created_at: '2026-01-19' },
        { id: 3, product_id: 3, product_code: 'P003', product_name: '樂事洋芋片', supplier_id: 2, supplier_name: '好吃食品', current_stock: 30, safety_stock: 50, reorder_point: 40, suggested_qty: 100, unit_cost: 25, reason: 'low_stock', priority: 'high', status: 'pending', avg_daily_sales: 10, days_of_stock: 3, lead_time_days: 2, created_at: '2026-01-19' },
        { id: 4, product_id: 4, product_code: 'P004', product_name: '舒潔衛生紙', supplier_id: 3, supplier_name: '日用品批發', current_stock: 200, safety_stock: 150, reorder_point: 180, suggested_qty: 300, unit_cost: 65, reason: 'forecast', priority: 'low', status: 'pending', avg_daily_sales: 8, days_of_stock: 25, lead_time_days: 5, created_at: '2026-01-18' },
        { id: 5, product_id: 5, product_code: 'P005', product_name: '御茶園綠茶', supplier_id: 1, supplier_name: '大統飲料', current_stock: 45, safety_stock: 80, reorder_point: 60, suggested_qty: 150, unit_cost: 15, reason: 'safety_stock', priority: 'medium', status: 'pending', avg_daily_sales: 12, days_of_stock: 4, lead_time_days: 3, created_at: '2026-01-18' },
        { id: 6, product_id: 6, product_code: 'P006', product_name: '泡麵 5入', supplier_id: 2, supplier_name: '好吃食品', current_stock: 120, safety_stock: 100, reorder_point: 120, suggested_qty: 200, unit_cost: 45, reason: 'seasonal', priority: 'low', status: 'approved', avg_daily_sales: 6, days_of_stock: 20, lead_time_days: 2, created_at: '2026-01-17' },
        { id: 7, product_id: 7, product_code: 'P007', product_name: '礦泉水 600ml', supplier_id: 4, supplier_name: '水源公司', current_stock: 20, safety_stock: 100, reorder_point: 80, suggested_qty: 500, unit_cost: 5, reason: 'low_stock', priority: 'high', status: 'ordered', avg_daily_sales: 30, days_of_stock: 1, lead_time_days: 1, created_at: '2026-01-17' },
      ];
      this.suggestions.set(data);
      this.calculateStats(data);
      this.loading.set(false);
    }, 500);
  }

  calculateStats(data: PurchaseSuggestion[]): void {
    const pending = data.filter(s => s.status === 'pending');
    this.stats.set({
      urgentCount: pending.filter(s => s.priority === 'high').length,
      pendingCount: pending.length,
      totalProducts: new Set(pending.map(s => s.product_id)).size,
      totalAmount: pending.reduce((sum, s) => sum + s.suggested_qty * s.unit_cost, 0),
    });
  }

  getPriorityLabel(priority: SuggestionPriority): string {
    return { high: '高', medium: '中', low: '低' }[priority];
  }

  getPrioritySeverity(priority: SuggestionPriority): 'danger' | 'warn' | 'info' {
    return { high: 'danger', medium: 'warn', low: 'info' }[priority] as 'danger' | 'warn' | 'info';
  }

  getReasonLabel(reason: SuggestionReason): string {
    const labels: Record<SuggestionReason, string> = {
      low_stock: '低庫存',
      safety_stock: '安全庫存',
      forecast: '銷售預測',
      seasonal: '季節備貨',
      reorder_point: '再訂購點',
    };
    return labels[reason];
  }

  getReasonTooltip(s: PurchaseSuggestion): string {
    return `日均銷量: ${s.avg_daily_sales} | 前置時間: ${s.lead_time_days}天 | 安全庫存: ${s.safety_stock}`;
  }

  getStatusLabel(status: SuggestionStatus): string {
    return { pending: '待處理', approved: '已核准', ordered: '已下單', dismissed: '已忽略' }[status];
  }

  getStatusSeverity(status: SuggestionStatus): 'warn' | 'success' | 'info' | 'secondary' {
    return { pending: 'warn', approved: 'success', ordered: 'info', dismissed: 'secondary' }[status] as 'warn' | 'success' | 'info' | 'secondary';
  }

  getStockPercentage(s: PurchaseSuggestion): number {
    return Math.min(100, (s.current_stock / s.safety_stock) * 100);
  }

  hasSelectedItems(): boolean {
    return this.suggestions().some(s => s.selected && s.status === 'pending');
  }

  getSelectedCount(): number {
    return this.suggestions().filter(s => s.selected && s.status === 'pending').length;
  }

  toggleSelectAll(): void {
    this.suggestions.update(list => list.map(s => ({ ...s, selected: s.status === 'pending' ? this.selectAll : s.selected })));
  }

  approve(s: PurchaseSuggestion): void {
    this.suggestions.update(list => list.map(item => item.id === s.id ? { ...item, status: 'approved' as SuggestionStatus, selected: false } : item));
    this.calculateStats(this.suggestions());
    this.messageService.add({ severity: 'success', summary: '成功', detail: '已核准採購建議' });
  }

  dismiss(s: PurchaseSuggestion): void {
    this.suggestions.update(list => list.map(item => item.id === s.id ? { ...item, status: 'dismissed' as SuggestionStatus, selected: false } : item));
    this.calculateStats(this.suggestions());
    this.messageService.add({ severity: 'info', summary: '提示', detail: '已忽略採購建議' });
  }

  createOrder(s: PurchaseSuggestion): void {
    this.suggestions.update(list => list.map(item => item.id === s.id ? { ...item, status: 'ordered' as SuggestionStatus, selected: false } : item));
    this.calculateStats(this.suggestions());
    this.messageService.add({ severity: 'success', summary: '成功', detail: `已建立採購單，商品：${s.product_name}` });
  }

  batchApprove(): void {
    const selected = this.suggestions().filter(s => s.selected && s.status === 'pending');
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      message: `確定要核准 ${selected.length} 筆採購建議？`,
      header: '批次核准確認',
      icon: 'pi pi-check',
      accept: () => {
        this.suggestions.update(list => list.map(s => selected.some(sel => sel.id === s.id) ? { ...s, status: 'approved' as SuggestionStatus, selected: false } : s));
        this.calculateStats(this.suggestions());
        this.selectAll = false;
        this.messageService.add({ severity: 'success', summary: '成功', detail: `已批次核准 ${selected.length} 筆建議` });
      },
    });
  }

  batchDismiss(): void {
    const selected = this.suggestions().filter(s => s.selected && s.status === 'pending');
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      message: `確定要忽略 ${selected.length} 筆採購建議？`,
      header: '批次忽略確認',
      icon: 'pi pi-times',
      accept: () => {
        this.suggestions.update(list => list.map(s => selected.some(sel => sel.id === s.id) ? { ...s, status: 'dismissed' as SuggestionStatus, selected: false } : s));
        this.calculateStats(this.suggestions());
        this.selectAll = false;
        this.messageService.add({ severity: 'info', summary: '提示', detail: `已批次忽略 ${selected.length} 筆建議` });
      },
    });
  }

  createPurchaseOrders(): void {
    const selected = this.suggestions().filter(s => s.selected && s.status === 'pending');
    if (selected.length === 0) return;

    const suppliers = [...new Set(selected.map(s => s.supplier_name))];
    this.confirmationService.confirm({
      message: `將為 ${suppliers.length} 家供應商建立採購單，共 ${selected.length} 項商品，是否繼續？`,
      header: '建立採購單',
      icon: 'pi pi-shopping-cart',
      accept: () => {
        this.suggestions.update(list => list.map(s => selected.some(sel => sel.id === s.id) ? { ...s, status: 'ordered' as SuggestionStatus, selected: false } : s));
        this.calculateStats(this.suggestions());
        this.selectAll = false;
        this.messageService.add({ severity: 'success', summary: '成功', detail: `已建立 ${suppliers.length} 張採購單` });
      },
    });
  }

  recalculate(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.messageService.add({ severity: 'info', summary: '完成', detail: '已重新計算採購建議' });
    }, 1000);
  }
}
