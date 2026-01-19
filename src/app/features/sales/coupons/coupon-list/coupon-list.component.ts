/**
 * 優惠券列表頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
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
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type CouponType = 'percentage' | 'fixed';
type CouponStatus = 'active' | 'used' | 'expired' | 'cancelled';

interface Coupon {
  id: number;
  code: string;
  type: CouponType;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  customer_name?: string;
  customer_id?: number;
  status: CouponStatus;
  valid_from: string;
  valid_until: string;
  used_at?: string;
  order_no?: string;
  created_at: string;
}

@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, ConfirmDialogModule, InputNumberModule, TextareaModule,
    DatePickerModule, PageHeaderComponent, DatePipe, CurrencyPipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="優惠券管理"
      subtitle="管理優惠券"
      [breadcrumbs]="[{ label: '銷售管理' }, { label: '優惠券管理' }]"
    >
      <button pButton label="批量發放" icon="pi pi-send" class="p-button-outlined mr-2" (click)="openBatchDialog()"></button>
      <button pButton label="新增優惠券" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats().total }}</div>
        <div class="stat-label">總發放數</div>
      </div>
      <div class="stat-card">
        <div class="stat-value active">{{ stats().active }}</div>
        <div class="stat-label">可使用</div>
      </div>
      <div class="stat-card">
        <div class="stat-value used">{{ stats().used }}</div>
        <div class="stat-label">已使用</div>
      </div>
      <div class="stat-card">
        <div class="stat-value expired">{{ stats().expired }}</div>
        <div class="stat-label">已過期</div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="coupons()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋優惠券代碼..." />
              </p-iconField>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
              <p-select [options]="typeOptions" [(ngModel)]="selectedType" placeholder="類型" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-download" label="匯出" class="p-button-outlined"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 140px">優惠券代碼</th>
            <th style="width: 100px">類型</th>
            <th style="width: 100px; text-align: right">折扣</th>
            <th>持有人</th>
            <th style="width: 180px">有效期間</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 130px">使用訂單</th>
            <th style="width: 100px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-coupon>
          <tr>
            <td><span class="code-badge">{{ coupon.code }}</span></td>
            <td>
              <p-tag [value]="coupon.type === 'percentage' ? '百分比' : '固定金額'" severity="info"></p-tag>
            </td>
            <td class="text-right">
              @if (coupon.type === 'percentage') {
                {{ coupon.discount_value }}%
              } @else {
                {{ coupon.discount_value | currency:'TWD':'symbol':'1.0-0' }}
              }
            </td>
            <td>{{ coupon.customer_name || '未指定' }}</td>
            <td>
              <div class="date-range">
                <span>{{ coupon.valid_from | date:'MM/dd' }}</span>
                <span>~</span>
                <span>{{ coupon.valid_until | date:'MM/dd' }}</span>
              </div>
            </td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(coupon.status)" [severity]="getStatusSeverity(coupon.status)"></p-tag>
            </td>
            <td>
              @if (coupon.order_no) {
                <a class="order-link">{{ coupon.order_no }}</a>
              } @else {
                -
              }
            </td>
            <td class="text-center">
              @if (coupon.status === 'active') {
                <button pButton icon="pi pi-ban" class="p-button-text p-button-danger p-button-sm" (click)="confirmCancel(coupon)" pTooltip="作廢"></button>
              }
              <button pButton icon="pi pi-copy" class="p-button-text p-button-sm" (click)="copyCode(coupon)" pTooltip="複製代碼"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="8" class="text-center p-4">尚無優惠券資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 新增優惠券對話框 -->
    <p-dialog [(visible)]="dialogVisible" header="新增優惠券" [modal]="true" [style]="{ width: '500px' }">
      <div class="grid">
        <div class="col-12 form-field">
          <label>優惠券代碼</label>
          <div class="code-input-group">
            <input pInputText [(ngModel)]="form.code" class="flex-1" placeholder="留空自動產生" />
            <button pButton icon="pi pi-refresh" class="p-button-outlined" (click)="generateCode()" pTooltip="產生代碼"></button>
          </div>
        </div>
        <div class="col-6 form-field">
          <label>折扣類型</label>
          <p-select [options]="typeOptions" [(ngModel)]="form.type" class="w-full"></p-select>
        </div>
        <div class="col-6 form-field">
          <label>折扣值</label>
          <p-inputNumber [(ngModel)]="form.discount_value" [min]="0" class="w-full"></p-inputNumber>
        </div>
        <div class="col-6 form-field">
          <label>最低消費</label>
          <p-inputNumber [(ngModel)]="form.min_purchase" mode="currency" currency="TWD" locale="zh-TW" class="w-full"></p-inputNumber>
        </div>
        <div class="col-6 form-field">
          <label>最高折抵</label>
          <p-inputNumber [(ngModel)]="form.max_discount" mode="currency" currency="TWD" locale="zh-TW" class="w-full"></p-inputNumber>
        </div>
        <div class="col-6 form-field">
          <label>生效日期</label>
          <p-datepicker [(ngModel)]="form.valid_from" dateFormat="yy/mm/dd" class="w-full"></p-datepicker>
        </div>
        <div class="col-6 form-field">
          <label>到期日期</label>
          <p-datepicker [(ngModel)]="form.valid_until" dateFormat="yy/mm/dd" class="w-full"></p-datepicker>
        </div>
        <div class="col-12 form-field">
          <label>指定會員（選填）</label>
          <p-select [options]="customerOptions" [(ngModel)]="form.customer_id" placeholder="選擇會員" [showClear]="true" class="w-full"></p-select>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="新增" (click)="saveCoupon()"></button>
      </ng-template>
    </p-dialog>

    <!-- 批量發放對話框 -->
    <p-dialog [(visible)]="batchDialogVisible" header="批量發放優惠券" [modal]="true" [style]="{ width: '500px' }">
      <div class="grid">
        <div class="col-6 form-field">
          <label>折扣類型</label>
          <p-select [options]="typeOptions" [(ngModel)]="batchForm.type" class="w-full"></p-select>
        </div>
        <div class="col-6 form-field">
          <label>折扣值</label>
          <p-inputNumber [(ngModel)]="batchForm.discount_value" [min]="0" class="w-full"></p-inputNumber>
        </div>
        <div class="col-6 form-field">
          <label>發放數量</label>
          <p-inputNumber [(ngModel)]="batchForm.quantity" [min]="1" [max]="1000" class="w-full"></p-inputNumber>
        </div>
        <div class="col-6 form-field">
          <label>代碼前綴</label>
          <input pInputText [(ngModel)]="batchForm.prefix" class="w-full" placeholder="如：NEW" />
        </div>
        <div class="col-6 form-field">
          <label>生效日期</label>
          <p-datepicker [(ngModel)]="batchForm.valid_from" dateFormat="yy/mm/dd" class="w-full"></p-datepicker>
        </div>
        <div class="col-6 form-field">
          <label>到期日期</label>
          <p-datepicker [(ngModel)]="batchForm.valid_until" dateFormat="yy/mm/dd" class="w-full"></p-datepicker>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="batchDialogVisible = false"></button>
        <button pButton label="發放" (click)="batchCreate()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; text-align: center; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
    .stat-value.active { color: var(--green-500); }
    .stat-value.used { color: var(--blue-500); }
    .stat-value.expired { color: var(--text-color-secondary); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); margin-top: 0.25rem; }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .code-badge { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; font-weight: 600; font-size: 0.875rem; }
    .date-range { display: flex; gap: 0.25rem; font-size: 0.875rem; }
    .order-link { color: var(--primary-color); text-decoration: none; cursor: pointer; }
    .order-link:hover { text-decoration: underline; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .mr-2 { margin-right: 0.5rem; }
    .flex-1 { flex: 1; }
    .code-input-group { display: flex; gap: 0.5rem; }
    .grid { display: flex; flex-wrap: wrap; margin: -0.5rem; }
    .col-6 { width: 50%; padding: 0.5rem; box-sizing: border-box; }
    .col-12 { width: 100%; padding: 0.5rem; box-sizing: border-box; }
  `],
})
export class CouponListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  coupons = signal<Coupon[]>([]);
  loading = signal(false);
  stats = signal({ total: 0, active: 0, used: 0, expired: 0 });
  searchValue = '';
  selectedStatus: CouponStatus | null = null;
  selectedType: CouponType | null = null;
  dialogVisible = false;
  batchDialogVisible = false;
  form: Partial<Coupon> = {};
  batchForm = { type: 'percentage' as CouponType, discount_value: 10, quantity: 10, prefix: '', valid_from: null as Date | null, valid_until: null as Date | null };

  statusOptions = [
    { label: '可使用', value: 'active' },
    { label: '已使用', value: 'used' },
    { label: '已過期', value: 'expired' },
    { label: '已作廢', value: 'cancelled' },
  ];

  typeOptions = [
    { label: '百分比折扣', value: 'percentage' },
    { label: '固定金額', value: 'fixed' },
  ];

  customerOptions = [
    { label: '王小明', value: 1 },
    { label: '李小華', value: 2 },
    { label: '張三', value: 3 },
  ];

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: Coupon[] = [
        { id: 1, code: 'NEW2026A1B2', type: 'percentage', discount_value: 10, customer_name: '王小明', customer_id: 1, status: 'active', valid_from: '2026-01-01', valid_until: '2026-03-31', created_at: '2026-01-01' },
        { id: 2, code: 'VIP50OFF', type: 'fixed', discount_value: 50, customer_name: '李小華', customer_id: 2, status: 'used', valid_from: '2026-01-01', valid_until: '2026-01-31', used_at: '2026-01-15', order_no: 'SO20260115001', created_at: '2026-01-01' },
        { id: 3, code: 'WELCOME15', type: 'percentage', discount_value: 15, status: 'active', valid_from: '2026-01-01', valid_until: '2026-06-30', created_at: '2026-01-01' },
        { id: 4, code: 'BDAY100', type: 'fixed', discount_value: 100, min_purchase: 500, customer_name: '張三', customer_id: 3, status: 'expired', valid_from: '2025-12-01', valid_until: '2025-12-31', created_at: '2025-12-01' },
        { id: 5, code: 'SAVE20PCT', type: 'percentage', discount_value: 20, max_discount: 200, status: 'active', valid_from: '2026-01-15', valid_until: '2026-02-15', created_at: '2026-01-15' },
        { id: 6, code: 'FLASH30', type: 'fixed', discount_value: 30, status: 'cancelled', valid_from: '2026-01-01', valid_until: '2026-01-31', created_at: '2026-01-01' },
      ];
      this.coupons.set(data);
      this.stats.set({
        total: data.length,
        active: data.filter(c => c.status === 'active').length,
        used: data.filter(c => c.status === 'used').length,
        expired: data.filter(c => c.status === 'expired').length,
      });
      this.loading.set(false);
    }, 500);
  }

  getStatusLabel(status: CouponStatus): string {
    const labels: Record<CouponStatus, string> = {
      active: '可使用', used: '已使用', expired: '已過期', cancelled: '已作廢',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: CouponStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<CouponStatus, 'success' | 'info' | 'secondary' | 'danger'> = {
      active: 'success', used: 'info', expired: 'secondary', cancelled: 'danger',
    };
    return severities[status] || 'info';
  }

  openDialog(): void {
    this.form = { type: 'percentage', discount_value: 10 };
    this.dialogVisible = true;
  }

  openBatchDialog(): void {
    this.batchForm = { type: 'percentage', discount_value: 10, quantity: 10, prefix: '', valid_from: null, valid_until: null };
    this.batchDialogVisible = true;
  }

  generateCode(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.form.code = code;
  }

  saveCoupon(): void {
    if (!this.form.code) {
      this.generateCode();
    }
    this.messageService.add({ severity: 'success', summary: '成功', detail: '優惠券已新增' });
    this.dialogVisible = false;
    this.loadCoupons();
  }

  batchCreate(): void {
    if (!this.batchForm.quantity || this.batchForm.quantity < 1) {
      this.messageService.add({ severity: 'warn', summary: '提示', detail: '請輸入發放數量' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: '成功', detail: `已發放 ${this.batchForm.quantity} 張優惠券` });
    this.batchDialogVisible = false;
    this.loadCoupons();
  }

  copyCode(coupon: Coupon): void {
    navigator.clipboard.writeText(coupon.code);
    this.messageService.add({ severity: 'info', summary: '已複製', detail: `優惠券代碼 ${coupon.code} 已複製到剪貼簿` });
  }

  confirmCancel(coupon: Coupon): void {
    this.confirmationService.confirm({
      message: `確定要作廢優惠券「${coupon.code}」嗎？此操作無法復原。`,
      header: '確認作廢',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '作廢',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `優惠券 ${coupon.code} 已作廢` });
        this.loadCoupons();
      },
    });
  }
}
