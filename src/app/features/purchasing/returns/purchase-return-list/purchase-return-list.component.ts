/**
 * 採購退貨列表頁面元件
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type ReturnStatus = 'draft' | 'pending' | 'approved' | 'shipped' | 'received' | 'refunded' | 'rejected' | 'cancelled';
type ReturnReason = 'defective' | 'wrong_item' | 'damaged' | 'quality_issue' | 'over_delivery' | 'other';

interface ReturnItem {
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  reason: ReturnReason;
  remark?: string;
}

interface PurchaseReturn {
  id: number;
  return_no: string;
  po_no: string;
  po_id: number;
  receipt_no?: string;
  supplier_id: number;
  supplier_name: string;
  status: ReturnStatus;
  items: ReturnItem[];
  total_amount: number;
  refund_amount?: number;
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  shipped_at?: string;
  received_at?: string;
  refunded_at?: string;
  remark?: string;
}

@Component({
  selector: 'app-purchase-return-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, InputNumberModule, TextareaModule, ConfirmDialogModule, PageHeaderComponent, DatePipe,
  ],
  template: `
    <app-page-header
      title="採購退貨"
      subtitle="管理採購退貨"
      [breadcrumbs]="[{ label: '採購管理' }, { label: '採購退貨' }]"
    >
      <button pButton label="新增退貨單" icon="pi pi-plus" (click)="openNewDialog()"></button>
    </app-page-header>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card pending">
        <div class="stat-icon"><i class="pi pi-clock"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().pendingCount }}</div>
          <div class="stat-label">待核准</div>
        </div>
      </div>
      <div class="stat-card processing">
        <div class="stat-icon"><i class="pi pi-truck"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().processingCount }}</div>
          <div class="stat-label">處理中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().completedCount }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-dollar"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalRefund | number:'1.0-0' }}</div>
          <div class="stat-label">本月退款額</div>
        </div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="returns()" [paginator]="true" [rows]="15" [loading]="loading()" [rowHover]="true" dataKey="id" [expandedRowKeys]="expandedRows" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋退貨單號..." />
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
            <th style="width: 130px">退貨單號</th>
            <th style="width: 130px">原採購單</th>
            <th style="width: 100px">供應商</th>
            <th style="width: 80px; text-align: right">品項</th>
            <th style="width: 100px; text-align: right">退貨金額</th>
            <th style="width: 100px; text-align: center">狀態</th>
            <th style="width: 100px">建立日期</th>
            <th style="width: 80px">建立者</th>
            <th style="width: 140px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-r let-expanded="expanded">
          <tr>
            <td>
              <button type="button" pButton pRipple [pRowToggler]="r" class="p-button-text p-button-rounded p-button-plain" [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></button>
            </td>
            <td><span class="return-no">{{ r.return_no }}</span></td>
            <td><a class="po-link" (click)="viewPO(r)">{{ r.po_no }}</a></td>
            <td>{{ r.supplier_name }}</td>
            <td class="text-right">{{ r.items.length }}</td>
            <td class="text-right font-semibold text-danger">{{ r.total_amount | number:'1.0-0' }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(r.status)" [severity]="getStatusSeverity(r.status)"></p-tag>
            </td>
            <td>{{ r.created_at | date:'MM/dd' }}</td>
            <td>{{ r.created_by }}</td>
            <td class="text-center">
              @switch (r.status) {
                @case ('draft') {
                  <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="編輯" (click)="editReturn(r)"></button>
                  <button pButton icon="pi pi-send" class="p-button-success p-button-text p-button-sm" pTooltip="送審" (click)="submitForApproval(r)"></button>
                  <button pButton icon="pi pi-trash" class="p-button-danger p-button-text p-button-sm" pTooltip="刪除" (click)="deleteReturn(r)"></button>
                }
                @case ('pending') {
                  <button pButton icon="pi pi-check" class="p-button-success p-button-text p-button-sm" pTooltip="核准" (click)="approveReturn(r)"></button>
                  <button pButton icon="pi pi-times" class="p-button-danger p-button-text p-button-sm" pTooltip="駁回" (click)="rejectReturn(r)"></button>
                }
                @case ('approved') {
                  <button pButton icon="pi pi-truck" class="p-button-text p-button-sm" pTooltip="出貨給供應商" (click)="shipReturn(r)"></button>
                }
                @case ('shipped') {
                  <button pButton icon="pi pi-inbox" class="p-button-text p-button-sm" pTooltip="供應商已收" (click)="confirmReceived(r)"></button>
                }
                @case ('received') {
                  <button pButton icon="pi pi-dollar" class="p-button-success p-button-text p-button-sm" pTooltip="確認退款" (click)="confirmRefund(r)"></button>
                }
                @default {
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="查看" (click)="toggleExpand(r)"></button>
                }
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="rowexpansion" let-r>
          <tr>
            <td colspan="10">
              <div class="return-detail">
                <div class="detail-timeline">
                  <div class="timeline-item" [class.active]="true">
                    <i class="pi pi-file"></i>
                    <span>建立 {{ r.created_at | date:'MM/dd' }}</span>
                  </div>
                  <div class="timeline-item" [class.active]="r.approved_at">
                    <i class="pi pi-check"></i>
                    <span>核准 {{ r.approved_at | date:'MM/dd' }}</span>
                  </div>
                  <div class="timeline-item" [class.active]="r.shipped_at">
                    <i class="pi pi-truck"></i>
                    <span>出貨 {{ r.shipped_at | date:'MM/dd' }}</span>
                  </div>
                  <div class="timeline-item" [class.active]="r.received_at">
                    <i class="pi pi-inbox"></i>
                    <span>收貨 {{ r.received_at | date:'MM/dd' }}</span>
                  </div>
                  <div class="timeline-item" [class.active]="r.refunded_at">
                    <i class="pi pi-dollar"></i>
                    <span>退款 {{ r.refunded_at | date:'MM/dd' }}</span>
                  </div>
                </div>
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>商品編號</th>
                      <th>商品名稱</th>
                      <th class="text-right">數量</th>
                      <th class="text-right">單價</th>
                      <th class="text-right">小計</th>
                      <th>退貨原因</th>
                      <th>備註</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of r.items; track item.product_id) {
                      <tr>
                        <td><span class="product-code">{{ item.product_code }}</span></td>
                        <td>{{ item.product_name }}</td>
                        <td class="text-right">{{ item.quantity }}</td>
                        <td class="text-right">{{ item.unit_cost | number:'1.0-0' }}</td>
                        <td class="text-right font-semibold">{{ item.subtotal | number:'1.0-0' }}</td>
                        <td><span class="reason-tag">{{ getReasonLabel(item.reason) }}</span></td>
                        <td class="text-secondary">{{ item.remark || '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (r.remark) {
                  <div class="remark">備註：{{ r.remark }}</div>
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="10" class="text-center p-4">尚無退貨單資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 新增/編輯對話框 -->
    <p-dialog [(visible)]="dialogVisible" [header]="editingReturn ? '編輯退貨單' : '新增退貨單'" [modal]="true" [style]="{width: '800px'}" [closable]="true">
      <div class="form-grid">
        <div class="form-row">
          <label>採購單 <span class="required">*</span></label>
          <p-select [options]="poOptions" [(ngModel)]="formData.po_id" placeholder="選擇採購單" [style]="{width: '100%'}"></p-select>
        </div>
        <div class="form-row">
          <label>供應商</label>
          <input pInputText [value]="getSupplierFromPO()" readonly [style]="{width: '100%'}" />
        </div>
        <div class="form-row full">
          <label>退貨商品</label>
          <div class="items-list">
            @for (item of formData.items; track $index) {
              <div class="item-row">
                <p-select [options]="productOptions" [(ngModel)]="item.product_id" placeholder="選擇商品" (onChange)="onProductChange(item)" [style]="{width: '180px'}"></p-select>
                <p-inputNumber [(ngModel)]="item.quantity" [min]="1" placeholder="數量" [style]="{width: '80px'}"></p-inputNumber>
                <p-inputNumber [(ngModel)]="item.unit_cost" [min]="0" placeholder="單價" [style]="{width: '100px'}"></p-inputNumber>
                <p-select [options]="reasonOptions" [(ngModel)]="item.reason" placeholder="原因" [style]="{width: '120px'}"></p-select>
                <input pInputText [(ngModel)]="item.remark" placeholder="備註" [style]="{width: '120px'}" />
                <span class="item-subtotal">{{ (item.quantity || 0) * (item.unit_cost || 0) | number:'1.0-0' }}</span>
                <button pButton icon="pi pi-trash" class="p-button-danger p-button-text" (click)="removeItem($index)"></button>
              </div>
            }
            <button pButton label="新增商品" icon="pi pi-plus" class="p-button-text p-button-sm" (click)="addItem()"></button>
          </div>
        </div>
        <div class="form-row full">
          <label>備註</label>
          <textarea pTextarea [(ngModel)]="formData.remark" rows="2" [style]="{width: '100%'}"></textarea>
        </div>
        <div class="form-row full">
          <div class="total-row">
            <span>退貨總額：</span>
            <span class="total-amount">{{ calculateTotal() | number:'1.0-0' }}</span>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" icon="pi pi-check" (click)="saveReturn()"></button>
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
    .stat-card.processing .stat-icon { background: var(--blue-100); color: var(--blue-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .text-danger { color: var(--red-600); }
    .font-semibold { font-weight: 600; }
    .return-no { font-family: monospace; font-weight: 500; color: var(--primary-color); }
    .po-link { color: var(--primary-color); cursor: pointer; text-decoration: none; }
    .po-link:hover { text-decoration: underline; }
    .product-code { font-family: monospace; font-size: 0.875rem; }
    .return-detail { padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .detail-timeline { display: flex; gap: 1rem; padding: 1rem; margin-bottom: 1rem; background: var(--surface-card); border-radius: 8px; overflow-x: auto; }
    .timeline-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-width: 80px; padding: 0.5rem; border-radius: 8px; color: var(--text-color-secondary); font-size: 0.75rem; }
    .timeline-item.active { color: var(--primary-color); background: var(--primary-100); }
    .timeline-item i { font-size: 1.25rem; }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .detail-table th, .detail-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--surface-border); }
    .detail-table th { font-weight: 600; color: var(--text-color-secondary); }
    .reason-tag { font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--red-100); color: var(--red-700); border-radius: 4px; }
    .remark { margin-top: 1rem; padding: 0.75rem; background: var(--surface-card); border-radius: 4px; font-size: 0.875rem; color: var(--text-color-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-row.full { grid-column: 1 / -1; }
    .form-row label { font-weight: 500; font-size: 0.875rem; }
    .required { color: var(--red-500); }
    .items-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .item-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .item-subtotal { min-width: 80px; text-align: right; font-weight: 600; }
    .total-row { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
    .total-amount { font-size: 1.25rem; font-weight: 700; color: var(--red-600); }
  `],
})
export class PurchaseReturnListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  returns = signal<PurchaseReturn[]>([]);
  loading = signal(false);
  stats = signal({ pendingCount: 0, processingCount: 0, completedCount: 0, totalRefund: 0 });
  expandedRows: { [key: number]: boolean } = {};
  dialogVisible = false;
  editingReturn: PurchaseReturn | null = null;
  searchValue = '';
  selectedStatus: ReturnStatus | null = null;
  selectedSupplier: number | null = null;

  formData: {
    po_id: number | null;
    remark: string;
    items: Array<{ product_id: number | null; product_code: string; product_name: string; quantity: number; unit_cost: number; reason: ReturnReason | null; remark: string }>;
  } = { po_id: null, remark: '', items: [] };

  statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '待核准', value: 'pending' },
    { label: '已核准', value: 'approved' },
    { label: '已出貨', value: 'shipped' },
    { label: '已收貨', value: 'received' },
    { label: '已退款', value: 'refunded' },
    { label: '已駁回', value: 'rejected' },
    { label: '已取消', value: 'cancelled' },
  ];

  supplierOptions = [
    { label: '大統飲料', value: 1 },
    { label: '好吃食品', value: 2 },
    { label: '日用品批發', value: 3 },
    { label: '水源公司', value: 4 },
  ];

  poOptions = [
    { label: 'PO20260118001 - 大統飲料', value: 1, supplier: '大統飲料' },
    { label: 'PO20260116001 - 日用品批發', value: 2, supplier: '日用品批發' },
  ];

  productOptions = [
    { label: 'P001 - 可口可樂 330ml', value: 1, code: 'P001', name: '可口可樂 330ml', cost: 12 },
    { label: 'P002 - 百事可樂 330ml', value: 2, code: 'P002', name: '百事可樂 330ml', cost: 11 },
    { label: 'P004 - 舒潔衛生紙', value: 4, code: 'P004', name: '舒潔衛生紙', cost: 65 },
    { label: 'P005 - 御茶園綠茶', value: 5, code: 'P005', name: '御茶園綠茶', cost: 15 },
  ];

  reasonOptions = [
    { label: '商品瑕疵', value: 'defective' },
    { label: '商品錯誤', value: 'wrong_item' },
    { label: '運送損壞', value: 'damaged' },
    { label: '品質不良', value: 'quality_issue' },
    { label: '超額交貨', value: 'over_delivery' },
    { label: '其他', value: 'other' },
  ];

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: PurchaseReturn[] = [
        { id: 1, return_no: 'PR20260119001', po_no: 'PO20260117001', po_id: 1, receipt_no: 'REC20260117001', supplier_id: 1, supplier_name: '大統飲料', status: 'pending', items: [
          { product_id: 5, product_code: 'P005', product_name: '御茶園綠茶', quantity: 2, unit_cost: 15, subtotal: 30, reason: 'damaged', remark: '包裝破損' },
        ], total_amount: 30, created_by: '張倉管', created_at: '2026-01-19' },
        { id: 2, return_no: 'PR20260118001', po_no: 'PO20260116001', po_id: 2, receipt_no: 'REC20260116001', supplier_id: 3, supplier_name: '日用品批發', status: 'shipped', items: [
          { product_id: 4, product_code: 'P004', product_name: '舒潔衛生紙', quantity: 20, unit_cost: 65, subtotal: 1300, reason: 'quality_issue', remark: '外包裝受潮' },
        ], total_amount: 1300, created_by: '王倉管', created_at: '2026-01-18', approved_by: '張經理', approved_at: '2026-01-18', shipped_at: '2026-01-18' },
        { id: 3, return_no: 'PR20260115001', po_no: 'PO20260110001', po_id: 3, supplier_id: 2, supplier_name: '好吃食品', status: 'refunded', items: [
          { product_id: 3, product_code: 'P003', product_name: '樂事洋芋片', quantity: 10, unit_cost: 25, subtotal: 250, reason: 'defective', remark: '過期商品' },
        ], total_amount: 250, refund_amount: 250, created_by: '李倉管', created_at: '2026-01-15', approved_by: '張經理', approved_at: '2026-01-15', shipped_at: '2026-01-16', received_at: '2026-01-17', refunded_at: '2026-01-18' },
        { id: 4, return_no: 'PR20260119002', po_no: 'PO20260118001', po_id: 1, supplier_id: 1, supplier_name: '大統飲料', status: 'draft', items: [
          { product_id: 1, product_code: 'P001', product_name: '可口可樂 330ml', quantity: 5, unit_cost: 12, subtotal: 60, reason: 'wrong_item' },
        ], total_amount: 60, created_by: '王採購', created_at: '2026-01-19', remark: '送錯規格' },
      ];
      this.returns.set(data);
      this.calculateStats(data);
      this.loading.set(false);
    }, 500);
  }

  calculateStats(data: PurchaseReturn[]): void {
    this.stats.set({
      pendingCount: data.filter(r => r.status === 'pending').length,
      processingCount: data.filter(r => ['approved', 'shipped', 'received'].includes(r.status)).length,
      completedCount: data.filter(r => r.status === 'refunded').length,
      totalRefund: data.filter(r => r.status === 'refunded').reduce((sum, r) => sum + (r.refund_amount || 0), 0),
    });
  }

  getStatusLabel(status: ReturnStatus): string {
    const labels: Record<ReturnStatus, string> = { draft: '草稿', pending: '待核准', approved: '已核准', shipped: '已出貨', received: '已收貨', refunded: '已退款', rejected: '已駁回', cancelled: '已取消' };
    return labels[status];
  }

  getStatusSeverity(status: ReturnStatus): 'secondary' | 'warn' | 'info' | 'success' | 'danger' {
    const severities: Record<ReturnStatus, 'secondary' | 'warn' | 'info' | 'success' | 'danger'> = { draft: 'secondary', pending: 'warn', approved: 'info', shipped: 'info', received: 'info', refunded: 'success', rejected: 'danger', cancelled: 'secondary' };
    return severities[status];
  }

  getReasonLabel(reason: ReturnReason): string {
    const labels: Record<ReturnReason, string> = { defective: '商品瑕疵', wrong_item: '商品錯誤', damaged: '運送損壞', quality_issue: '品質不良', over_delivery: '超額交貨', other: '其他' };
    return labels[reason];
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedStatus = null;
    this.selectedSupplier = null;
  }

  toggleExpand(r: PurchaseReturn): void {
    this.expandedRows[r.id] = !this.expandedRows[r.id];
  }

  openNewDialog(): void {
    this.editingReturn = null;
    this.formData = { po_id: null, remark: '', items: [{ product_id: null, product_code: '', product_name: '', quantity: 1, unit_cost: 0, reason: null, remark: '' }] };
    this.dialogVisible = true;
  }

  editReturn(r: PurchaseReturn): void {
    this.editingReturn = r;
    this.formData = {
      po_id: r.po_id,
      remark: r.remark || '',
      items: r.items.map(i => ({ product_id: i.product_id, product_code: i.product_code, product_name: i.product_name, quantity: i.quantity, unit_cost: i.unit_cost, reason: i.reason, remark: i.remark || '' })),
    };
    this.dialogVisible = true;
  }

  getSupplierFromPO(): string {
    const po = this.poOptions.find(p => p.value === this.formData.po_id);
    return po?.supplier || '';
  }

  onProductChange(item: { product_id: number | null; product_code: string; product_name: string; unit_cost: number }): void {
    const product = this.productOptions.find(p => p.value === item.product_id);
    if (product) {
      item.product_code = product.code;
      item.product_name = product.name;
      item.unit_cost = product.cost;
    }
  }

  addItem(): void {
    this.formData.items.push({ product_id: null, product_code: '', product_name: '', quantity: 1, unit_cost: 0, reason: null, remark: '' });
  }

  removeItem(index: number): void {
    this.formData.items.splice(index, 1);
  }

  calculateTotal(): number {
    return this.formData.items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unit_cost || 0), 0);
  }

  saveReturn(): void {
    if (!this.formData.po_id || this.formData.items.length === 0) {
      this.messageService.add({ severity: 'warn', summary: '警告', detail: '請填寫必要欄位' });
      return;
    }
    this.dialogVisible = false;
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.editingReturn ? '退貨單已更新' : '退貨單已建立' });
  }

  submitForApproval(r: PurchaseReturn): void {
    this.returns.update(list => list.map(item => item.id === r.id ? { ...item, status: 'pending' as ReturnStatus } : item));
    this.calculateStats(this.returns());
    this.messageService.add({ severity: 'success', summary: '成功', detail: '退貨單已送審' });
  }

  approveReturn(r: PurchaseReturn): void {
    this.returns.update(list => list.map(item => item.id === r.id ? { ...item, status: 'approved' as ReturnStatus, approved_by: '當前用戶', approved_at: new Date().toISOString().split('T')[0] } : item));
    this.calculateStats(this.returns());
    this.messageService.add({ severity: 'success', summary: '成功', detail: '退貨單已核准' });
  }

  rejectReturn(r: PurchaseReturn): void {
    this.returns.update(list => list.map(item => item.id === r.id ? { ...item, status: 'rejected' as ReturnStatus } : item));
    this.calculateStats(this.returns());
    this.messageService.add({ severity: 'info', summary: '提示', detail: '退貨單已駁回' });
  }

  shipReturn(r: PurchaseReturn): void {
    this.returns.update(list => list.map(item => item.id === r.id ? { ...item, status: 'shipped' as ReturnStatus, shipped_at: new Date().toISOString().split('T')[0] } : item));
    this.calculateStats(this.returns());
    this.messageService.add({ severity: 'success', summary: '成功', detail: '已出貨給供應商' });
  }

  confirmReceived(r: PurchaseReturn): void {
    this.returns.update(list => list.map(item => item.id === r.id ? { ...item, status: 'received' as ReturnStatus, received_at: new Date().toISOString().split('T')[0] } : item));
    this.calculateStats(this.returns());
    this.messageService.add({ severity: 'success', summary: '成功', detail: '供應商已確認收貨' });
  }

  confirmRefund(r: PurchaseReturn): void {
    this.confirmationService.confirm({
      message: `確定已收到供應商退款 ${r.total_amount} 元？`,
      header: '確認退款',
      icon: 'pi pi-dollar',
      accept: () => {
        this.returns.update(list => list.map(item => item.id === r.id ? { ...item, status: 'refunded' as ReturnStatus, refund_amount: r.total_amount, refunded_at: new Date().toISOString().split('T')[0] } : item));
        this.calculateStats(this.returns());
        this.messageService.add({ severity: 'success', summary: '成功', detail: '退款已確認' });
      },
    });
  }

  deleteReturn(r: PurchaseReturn): void {
    this.confirmationService.confirm({
      message: `確定要刪除退貨單 ${r.return_no}？`,
      header: '刪除確認',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.returns.update(list => list.filter(item => item.id !== r.id));
        this.calculateStats(this.returns());
        this.messageService.add({ severity: 'success', summary: '成功', detail: '退貨單已刪除' });
      },
    });
  }

  viewPO(r: PurchaseReturn): void {
    this.messageService.add({ severity: 'info', summary: '提示', detail: `查看採購單：${r.po_no}` });
  }
}
