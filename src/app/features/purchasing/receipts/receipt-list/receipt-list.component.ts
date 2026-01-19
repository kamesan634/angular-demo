/**
 * 驗收管理列表頁面元件
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
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type ReceiptStatus = 'pending' | 'inspecting' | 'passed' | 'rejected' | 'partial' | 'completed';

interface ReceiptItem {
  product_id: number;
  product_code: string;
  product_name: string;
  ordered_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  unit_cost: number;
  reject_reason?: string;
}

interface Receipt {
  id: number;
  receipt_no: string;
  po_no: string;
  po_id: number;
  supplier_id: number;
  supplier_name: string;
  warehouse_id: number;
  warehouse_name: string;
  status: ReceiptStatus;
  items: ReceiptItem[];
  total_ordered: number;
  total_received: number;
  total_accepted: number;
  received_by: string;
  received_at: string;
  inspected_by?: string;
  inspected_at?: string;
  remark?: string;
}

@Component({
  selector: 'app-receipt-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, InputNumberModule, TextareaModule, ProgressBarModule,
    ConfirmDialogModule, PageHeaderComponent, DatePipe,
  ],
  template: `
    <app-page-header
      title="驗收管理"
      subtitle="管理採購驗收"
      [breadcrumbs]="[{ label: '採購管理' }, { label: '驗收管理' }]"
    >
      <button pButton label="新增驗收" icon="pi pi-plus" (click)="openNewDialog()"></button>
    </app-page-header>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card pending">
        <div class="stat-icon"><i class="pi pi-inbox"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().pendingCount }}</div>
          <div class="stat-label">待驗收</div>
        </div>
      </div>
      <div class="stat-card inspecting">
        <div class="stat-icon"><i class="pi pi-search"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().inspectingCount }}</div>
          <div class="stat-label">驗收中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().completedCount }}</div>
          <div class="stat-label">今日完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-percentage"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().acceptRate }}%</div>
          <div class="stat-label">合格率</div>
        </div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="receipts()" [paginator]="true" [rows]="15" [loading]="loading()" [rowHover]="true" dataKey="id" [expandedRowKeys]="expandedRows" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋驗收單號或採購單號..." />
              </p-iconField>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
              <p-select [options]="supplierOptions" [(ngModel)]="selectedSupplier" placeholder="供應商" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-filter-slash" label="清除篩選" class="p-button-text" (click)="clearFilters()"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 50px"></th>
            <th style="width: 130px">驗收單號</th>
            <th style="width: 130px">採購單號</th>
            <th style="width: 100px">供應商</th>
            <th style="width: 80px">入庫倉</th>
            <th style="width: 150px">驗收進度</th>
            <th style="width: 100px; text-align: center">狀態</th>
            <th style="width: 100px">驗收日期</th>
            <th style="width: 80px">驗收人</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-r let-expanded="expanded">
          <tr>
            <td>
              <button type="button" pButton pRipple [pRowToggler]="r" class="p-button-text p-button-rounded p-button-plain" [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></button>
            </td>
            <td><span class="receipt-no">{{ r.receipt_no }}</span></td>
            <td><a class="po-link" (click)="viewPO(r)">{{ r.po_no }}</a></td>
            <td>{{ r.supplier_name }}</td>
            <td>{{ r.warehouse_name }}</td>
            <td>
              <div class="progress-cell">
                <p-progressBar [value]="getProgressValue(r)" [showValue]="false" [style]="{height: '8px'}"></p-progressBar>
                <span class="progress-text">{{ r.total_accepted }}/{{ r.total_ordered }}</span>
              </div>
            </td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(r.status)" [severity]="getStatusSeverity(r.status)"></p-tag>
            </td>
            <td>{{ r.received_at | date:'MM/dd HH:mm' }}</td>
            <td>{{ r.received_by }}</td>
            <td class="text-center">
              @switch (r.status) {
                @case ('pending') {
                  <button pButton icon="pi pi-play" class="p-button-text p-button-sm" pTooltip="開始驗收" (click)="startInspection(r)"></button>
                }
                @case ('inspecting') {
                  <button pButton icon="pi pi-check-circle" class="p-button-success p-button-text p-button-sm" pTooltip="完成驗收" (click)="openInspectionDialog(r)"></button>
                }
                @case ('partial') {
                  <button pButton icon="pi pi-refresh" class="p-button-text p-button-sm" pTooltip="繼續驗收" (click)="openInspectionDialog(r)"></button>
                }
                @default {
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="查看" (click)="toggleExpand(r)"></button>
                  @if (r.status === 'passed' || r.status === 'completed') {
                    <button pButton icon="pi pi-print" class="p-button-text p-button-sm" pTooltip="列印" (click)="printReceipt(r)"></button>
                  }
                }
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="rowexpansion" let-r>
          <tr>
            <td colspan="10">
              <div class="receipt-detail">
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>商品編號</th>
                      <th>商品名稱</th>
                      <th class="text-right">訂購數量</th>
                      <th class="text-right">到貨數量</th>
                      <th class="text-right">合格數量</th>
                      <th class="text-right">不合格</th>
                      <th>不合格原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of r.items; track item.product_id) {
                      <tr>
                        <td><span class="product-code">{{ item.product_code }}</span></td>
                        <td>{{ item.product_name }}</td>
                        <td class="text-right">{{ item.ordered_qty }}</td>
                        <td class="text-right">{{ item.received_qty }}</td>
                        <td class="text-right text-success">{{ item.accepted_qty }}</td>
                        <td class="text-right" [class.text-danger]="item.rejected_qty > 0">{{ item.rejected_qty }}</td>
                        <td class="text-secondary">{{ item.reject_reason || '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (r.remark) {
                  <div class="remark">備註：{{ r.remark }}</div>
                }
                @if (r.inspected_by) {
                  <div class="inspection-info">
                    驗收完成：{{ r.inspected_by }} / {{ r.inspected_at | date:'yyyy/MM/dd HH:mm' }}
                  </div>
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="10" class="text-center p-4">尚無驗收資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 驗收作業對話框 -->
    <p-dialog [(visible)]="inspectionDialogVisible" header="驗收作業" [modal]="true" [style]="{width: '800px'}" [closable]="true">
      @if (currentReceipt) {
        <div class="inspection-form">
          <div class="form-info">
            <span><strong>驗收單號：</strong>{{ currentReceipt.receipt_no }}</span>
            <span><strong>供應商：</strong>{{ currentReceipt.supplier_name }}</span>
            <span><strong>採購單：</strong>{{ currentReceipt.po_no }}</span>
          </div>
          <table class="inspection-table">
            <thead>
              <tr>
                <th>商品</th>
                <th class="text-right" style="width: 80px">訂購</th>
                <th class="text-right" style="width: 80px">到貨</th>
                <th style="width: 100px">合格數量</th>
                <th style="width: 100px">不合格數量</th>
                <th style="width: 150px">不合格原因</th>
              </tr>
            </thead>
            <tbody>
              @for (item of inspectionItems; track item.product_id) {
                <tr>
                  <td>
                    <span class="product-code">{{ item.product_code }}</span>
                    <span class="product-name">{{ item.product_name }}</span>
                  </td>
                  <td class="text-right">{{ item.ordered_qty }}</td>
                  <td class="text-right">{{ item.received_qty }}</td>
                  <td>
                    <p-inputNumber [(ngModel)]="item.accepted_qty" [min]="0" [max]="item.received_qty" [showButtons]="true" [style]="{width: '100%'}"></p-inputNumber>
                  </td>
                  <td>
                    <p-inputNumber [(ngModel)]="item.rejected_qty" [min]="0" [max]="item.received_qty" [showButtons]="true" [style]="{width: '100%'}"></p-inputNumber>
                  </td>
                  <td>
                    <input pInputText [(ngModel)]="item.reject_reason" placeholder="原因" [disabled]="!item.rejected_qty" [style]="{width: '100%'}" />
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <div class="form-row">
            <label>備註</label>
            <textarea pTextarea [(ngModel)]="inspectionRemark" rows="2" [style]="{width: '100%'}"></textarea>
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="inspectionDialogVisible = false"></button>
        <button pButton label="儲存" class="p-button-secondary" icon="pi pi-save" (click)="saveInspection(false)"></button>
        <button pButton label="完成驗收" icon="pi pi-check" (click)="saveInspection(true)"></button>
      </ng-template>
    </p-dialog>

    <!-- 新增驗收對話框 -->
    <p-dialog [(visible)]="newDialogVisible" header="新增驗收" [modal]="true" [style]="{width: '500px'}" [closable]="true">
      <div class="form-grid">
        <div class="form-row">
          <label>採購單 <span class="required">*</span></label>
          <p-select [options]="poOptions" [(ngModel)]="newReceiptPO" placeholder="選擇採購單" [style]="{width: '100%'}"></p-select>
        </div>
        <div class="form-row">
          <label>入庫倉庫 <span class="required">*</span></label>
          <p-select [options]="warehouseOptions" [(ngModel)]="newReceiptWarehouse" placeholder="選擇倉庫" [style]="{width: '100%'}"></p-select>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="newDialogVisible = false"></button>
        <button pButton label="建立" icon="pi pi-check" (click)="createReceipt()"></button>
      </ng-template>
    </p-dialog>

    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-ground); color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.pending .stat-icon { background: var(--yellow-100); color: var(--yellow-700); }
    .stat-card.inspecting .stat-icon { background: var(--blue-100); color: var(--blue-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .text-success { color: var(--green-600); }
    .text-danger { color: var(--red-600); }
    .receipt-no { font-family: monospace; font-weight: 500; color: var(--primary-color); }
    .po-link { color: var(--primary-color); cursor: pointer; text-decoration: none; }
    .po-link:hover { text-decoration: underline; }
    .product-code { font-family: monospace; font-size: 0.875rem; }
    .progress-cell { display: flex; align-items: center; gap: 0.5rem; }
    .progress-text { font-size: 0.75rem; white-space: nowrap; color: var(--text-color-secondary); }
    .receipt-detail { padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .detail-table th, .detail-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--surface-border); }
    .detail-table th { font-weight: 600; color: var(--text-color-secondary); }
    .remark { margin-top: 1rem; padding: 0.75rem; background: var(--surface-card); border-radius: 4px; font-size: 0.875rem; color: var(--text-color-secondary); }
    .inspection-info { margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-color-secondary); }
    .form-grid { display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-row label { font-weight: 500; font-size: 0.875rem; }
    .required { color: var(--red-500); }
    .inspection-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-info { display: flex; gap: 2rem; padding: 1rem; background: var(--surface-ground); border-radius: 8px; font-size: 0.875rem; }
    .inspection-table { width: 100%; border-collapse: collapse; }
    .inspection-table th, .inspection-table td { padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--surface-border); }
    .inspection-table th { font-weight: 600; font-size: 0.875rem; color: var(--text-color-secondary); text-align: left; }
    .product-name { display: block; font-size: 0.875rem; color: var(--text-color); }
  `],
})
export class ReceiptListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  receipts = signal<Receipt[]>([]);
  loading = signal(false);
  stats = signal({ pendingCount: 0, inspectingCount: 0, completedCount: 0, acceptRate: 0 });
  expandedRows: { [key: number]: boolean } = {};
  inspectionDialogVisible = false;
  newDialogVisible = false;
  currentReceipt: Receipt | null = null;
  inspectionItems: ReceiptItem[] = [];
  inspectionRemark = '';
  newReceiptPO: number | null = null;
  newReceiptWarehouse: number | null = null;
  searchValue = '';
  selectedStatus: ReceiptStatus | null = null;
  selectedSupplier: number | null = null;

  statusOptions = [
    { label: '待驗收', value: 'pending' },
    { label: '驗收中', value: 'inspecting' },
    { label: '已合格', value: 'passed' },
    { label: '已退貨', value: 'rejected' },
    { label: '部分合格', value: 'partial' },
    { label: '已完成', value: 'completed' },
  ];

  supplierOptions = [
    { label: '大統飲料', value: 1 },
    { label: '好吃食品', value: 2 },
    { label: '日用品批發', value: 3 },
    { label: '水源公司', value: 4 },
  ];

  warehouseOptions = [
    { label: '總倉', value: 1 },
    { label: '北區倉庫', value: 2 },
    { label: '中區倉庫', value: 3 },
    { label: '南區倉庫', value: 4 },
  ];

  poOptions = [
    { label: 'PO20260119001 - 大統飲料', value: 1 },
    { label: 'PO20260118002 - 好吃食品', value: 2 },
  ];

  ngOnInit(): void {
    this.loadReceipts();
  }

  loadReceipts(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: Receipt[] = [
        { id: 1, receipt_no: 'REC20260119001', po_no: 'PO20260119001', po_id: 1, supplier_id: 1, supplier_name: '大統飲料', warehouse_id: 1, warehouse_name: '總倉', status: 'pending', items: [
          { product_id: 1, product_code: 'P001', product_name: '可口可樂 330ml', ordered_qty: 200, received_qty: 200, accepted_qty: 0, rejected_qty: 0, unit_cost: 12 },
          { product_id: 2, product_code: 'P002', product_name: '百事可樂 330ml', ordered_qty: 150, received_qty: 150, accepted_qty: 0, rejected_qty: 0, unit_cost: 11 },
        ], total_ordered: 350, total_received: 350, total_accepted: 0, received_by: '張倉管', received_at: '2026-01-19T14:00:00' },
        { id: 2, receipt_no: 'REC20260118001', po_no: 'PO20260118002', po_id: 2, supplier_id: 2, supplier_name: '好吃食品', warehouse_id: 1, warehouse_name: '總倉', status: 'inspecting', items: [
          { product_id: 3, product_code: 'P003', product_name: '樂事洋芋片', ordered_qty: 100, received_qty: 100, accepted_qty: 60, rejected_qty: 0, unit_cost: 25 },
        ], total_ordered: 100, total_received: 100, total_accepted: 60, received_by: '張倉管', received_at: '2026-01-18T10:00:00' },
        { id: 3, receipt_no: 'REC20260117001', po_no: 'PO20260117001', po_id: 3, supplier_id: 1, supplier_name: '大統飲料', warehouse_id: 1, warehouse_name: '總倉', status: 'completed', items: [
          { product_id: 5, product_code: 'P005', product_name: '御茶園綠茶', ordered_qty: 150, received_qty: 150, accepted_qty: 148, rejected_qty: 2, unit_cost: 15, reject_reason: '包裝破損' },
        ], total_ordered: 150, total_received: 150, total_accepted: 148, received_by: '李倉管', received_at: '2026-01-17T09:00:00', inspected_by: '張倉管', inspected_at: '2026-01-17T11:00:00' },
        { id: 4, receipt_no: 'REC20260116001', po_no: 'PO20260116001', po_id: 4, supplier_id: 3, supplier_name: '日用品批發', warehouse_id: 2, warehouse_name: '北區倉庫', status: 'partial', items: [
          { product_id: 4, product_code: 'P004', product_name: '舒潔衛生紙', ordered_qty: 200, received_qty: 200, accepted_qty: 180, rejected_qty: 20, unit_cost: 65, reject_reason: '外包裝受潮' },
        ], total_ordered: 200, total_received: 200, total_accepted: 180, received_by: '王倉管', received_at: '2026-01-16T14:00:00', inspected_by: '王倉管', inspected_at: '2026-01-16T16:00:00', remark: '已通知供應商處理不合格品' },
      ];
      this.receipts.set(data);
      this.calculateStats(data);
      this.loading.set(false);
    }, 500);
  }

  calculateStats(data: Receipt[]): void {
    const totalAccepted = data.reduce((sum, r) => sum + r.total_accepted, 0);
    const totalReceived = data.reduce((sum, r) => sum + r.total_received, 0);
    this.stats.set({
      pendingCount: data.filter(r => r.status === 'pending').length,
      inspectingCount: data.filter(r => r.status === 'inspecting').length,
      completedCount: data.filter(r => ['passed', 'completed', 'partial'].includes(r.status)).length,
      acceptRate: totalReceived > 0 ? Math.round((totalAccepted / totalReceived) * 100) : 0,
    });
  }

  getStatusLabel(status: ReceiptStatus): string {
    const labels: Record<ReceiptStatus, string> = { pending: '待驗收', inspecting: '驗收中', passed: '已合格', rejected: '已退貨', partial: '部分合格', completed: '已完成' };
    return labels[status];
  }

  getStatusSeverity(status: ReceiptStatus): 'warn' | 'info' | 'success' | 'danger' | 'secondary' {
    const severities: Record<ReceiptStatus, 'warn' | 'info' | 'success' | 'danger' | 'secondary'> = { pending: 'warn', inspecting: 'info', passed: 'success', rejected: 'danger', partial: 'warn', completed: 'success' };
    return severities[status];
  }

  getProgressValue(r: Receipt): number {
    return r.total_ordered > 0 ? Math.round((r.total_accepted / r.total_ordered) * 100) : 0;
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedStatus = null;
    this.selectedSupplier = null;
  }

  toggleExpand(r: Receipt): void {
    this.expandedRows[r.id] = !this.expandedRows[r.id];
  }

  openNewDialog(): void {
    this.newReceiptPO = null;
    this.newReceiptWarehouse = null;
    this.newDialogVisible = true;
  }

  createReceipt(): void {
    if (!this.newReceiptPO || !this.newReceiptWarehouse) {
      this.messageService.add({ severity: 'warn', summary: '警告', detail: '請選擇採購單和倉庫' });
      return;
    }
    this.newDialogVisible = false;
    this.messageService.add({ severity: 'success', summary: '成功', detail: '已建立驗收單' });
  }

  startInspection(r: Receipt): void {
    this.receipts.update(list => list.map(item => item.id === r.id ? { ...item, status: 'inspecting' as ReceiptStatus } : item));
    this.calculateStats(this.receipts());
    this.messageService.add({ severity: 'info', summary: '提示', detail: '已開始驗收作業' });
  }

  openInspectionDialog(r: Receipt): void {
    this.currentReceipt = r;
    this.inspectionItems = r.items.map(i => ({ ...i }));
    this.inspectionRemark = r.remark || '';
    this.inspectionDialogVisible = true;
  }

  saveInspection(complete: boolean): void {
    if (!this.currentReceipt) return;

    const totalAccepted = this.inspectionItems.reduce((sum, i) => sum + i.accepted_qty, 0);
    const totalRejected = this.inspectionItems.reduce((sum, i) => sum + i.rejected_qty, 0);
    const totalOrdered = this.currentReceipt.total_ordered;

    let newStatus: ReceiptStatus = 'inspecting';
    if (complete) {
      if (totalRejected === 0 && totalAccepted === totalOrdered) {
        newStatus = 'completed';
      } else if (totalAccepted === 0) {
        newStatus = 'rejected';
      } else {
        newStatus = 'partial';
      }
    }

    this.receipts.update(list => list.map(item => item.id === this.currentReceipt!.id ? {
      ...item,
      status: newStatus,
      items: this.inspectionItems,
      total_accepted: totalAccepted,
      remark: this.inspectionRemark,
      inspected_by: complete ? '當前用戶' : item.inspected_by,
      inspected_at: complete ? new Date().toISOString() : item.inspected_at,
    } : item));

    this.calculateStats(this.receipts());
    this.inspectionDialogVisible = false;
    this.messageService.add({ severity: 'success', summary: '成功', detail: complete ? '驗收已完成' : '驗收進度已儲存' });
  }

  viewPO(r: Receipt): void {
    this.messageService.add({ severity: 'info', summary: '提示', detail: `查看採購單：${r.po_no}` });
  }

  printReceipt(r: Receipt): void {
    this.messageService.add({ severity: 'info', summary: '列印', detail: `列印驗收單：${r.receipt_no}` });
  }
}
