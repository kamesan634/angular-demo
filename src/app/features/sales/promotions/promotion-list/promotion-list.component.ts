/**
 * 促銷活動列表頁面元件
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';
type PromotionStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';

interface Promotion {
  id: number;
  name: string;
  code: string;
  type: PromotionType;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  start_date: string;
  end_date: string;
  status: PromotionStatus;
  usage_count: number;
  usage_limit?: number;
  is_active: boolean;
  description?: string;
}

@Component({
  selector: 'app-promotion-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, ConfirmDialogModule, InputNumberModule, TextareaModule,
    DatePickerModule, CheckboxModule, PageHeaderComponent, DatePipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="促銷管理"
      subtitle="管理促銷活動"
      [breadcrumbs]="[{ label: '銷售管理' }, { label: '促銷管理' }]"
    >
      <button pButton label="新增促銷" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="promotions()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋促銷活動..." />
              </p-iconField>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
              <p-select [options]="typeOptions" [(ngModel)]="selectedType" placeholder="類型" [showClear]="true"></p-select>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 100px">代碼</th>
            <th>活動名稱</th>
            <th style="width: 100px">類型</th>
            <th style="width: 100px; text-align: right">折扣</th>
            <th style="width: 180px">活動期間</th>
            <th style="width: 100px; text-align: center">使用次數</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-promo>
          <tr>
            <td><span class="code-badge">{{ promo.code }}</span></td>
            <td>
              <div class="promo-name">{{ promo.name }}</div>
              @if (promo.description) {
                <div class="promo-desc">{{ promo.description }}</div>
              }
            </td>
            <td><p-tag [value]="getTypeLabel(promo.type)" severity="info"></p-tag></td>
            <td class="text-right">
              @if (promo.type === 'percentage') {
                {{ promo.discount_value }}% off
              } @else if (promo.type === 'fixed') {
                NT$ {{ promo.discount_value }} off
              } @else if (promo.type === 'buy_x_get_y') {
                買 {{ promo.discount_value }} 送1
              } @else {
                組合價
              }
            </td>
            <td>
              <div class="date-range">
                <span>{{ promo.start_date | date:'MM/dd' }}</span>
                <span>~</span>
                <span>{{ promo.end_date | date:'MM/dd' }}</span>
              </div>
            </td>
            <td class="text-center">
              {{ promo.usage_count }}
              @if (promo.usage_limit) {
                / {{ promo.usage_limit }}
              }
            </td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(promo.status)" [severity]="getStatusSeverity(promo.status)"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editPromotion(promo)" pTooltip="編輯"></button>
              @if (promo.status === 'active') {
                <button pButton icon="pi pi-pause" class="p-button-text p-button-warning p-button-sm" (click)="pausePromotion(promo)" pTooltip="暫停"></button>
              } @else if (promo.status === 'draft' || promo.status === 'scheduled') {
                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="confirmDelete(promo)" pTooltip="刪除"></button>
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="8" class="text-center p-4">尚無促銷活動</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="dialogVisible" [header]="isEdit ? '編輯促銷活動' : '新增促銷活動'" [modal]="true" [style]="{ width: '600px' }">
      <div class="grid">
        <div class="col-6 form-field">
          <label>活動代碼</label>
          <input pInputText [(ngModel)]="form.code" class="w-full" [disabled]="isEdit" placeholder="如：SUMMER20" />
        </div>
        <div class="col-6 form-field">
          <label>促銷類型</label>
          <p-select [options]="typeOptions" [(ngModel)]="form.type" class="w-full"></p-select>
        </div>
        <div class="col-12 form-field">
          <label>活動名稱</label>
          <input pInputText [(ngModel)]="form.name" class="w-full" placeholder="如：夏季折扣季" />
        </div>
        <div class="col-6 form-field">
          <label>折扣值</label>
          <p-inputNumber [(ngModel)]="form.discount_value" [min]="0" class="w-full"></p-inputNumber>
          <small>
            @if (form.type === 'percentage') {
              輸入折扣百分比，如 20 表示 20% off
            } @else if (form.type === 'fixed') {
              輸入折扣金額
            } @else if (form.type === 'buy_x_get_y') {
              輸入購買數量，如 2 表示買2送1
            }
          </small>
        </div>
        <div class="col-6 form-field">
          <label>最低消費金額</label>
          <p-inputNumber [(ngModel)]="form.min_purchase" mode="currency" currency="TWD" locale="zh-TW" class="w-full"></p-inputNumber>
        </div>
        <div class="col-6 form-field">
          <label>開始日期</label>
          <p-datepicker [(ngModel)]="form.start_date" dateFormat="yy/mm/dd" class="w-full"></p-datepicker>
        </div>
        <div class="col-6 form-field">
          <label>結束日期</label>
          <p-datepicker [(ngModel)]="form.end_date" dateFormat="yy/mm/dd" class="w-full"></p-datepicker>
        </div>
        <div class="col-6 form-field">
          <label>使用次數上限</label>
          <p-inputNumber [(ngModel)]="form.usage_limit" [min]="0" class="w-full" placeholder="留空表示無限制"></p-inputNumber>
        </div>
        <div class="col-6 form-field">
          <label>最高折扣金額</label>
          <p-inputNumber [(ngModel)]="form.max_discount" mode="currency" currency="TWD" locale="zh-TW" class="w-full"></p-inputNumber>
        </div>
        <div class="col-12 form-field">
          <label>活動說明</label>
          <textarea pTextarea [(ngModel)]="form.description" class="w-full" rows="2"></textarea>
        </div>
        <div class="col-12 form-field">
          <label><input type="checkbox" [(ngModel)]="form.is_active" /> 啟用</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" (click)="savePromotion()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left { display: flex; gap: 0.5rem; align-items: center; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .code-badge { background: var(--surface-ground); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace; font-weight: 600; }
    .promo-name { font-weight: 500; }
    .promo-desc { font-size: 0.875rem; color: var(--text-color-secondary); margin-top: 0.25rem; }
    .date-range { display: flex; gap: 0.25rem; font-size: 0.875rem; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-field small { display: block; margin-top: 0.25rem; color: var(--text-color-secondary); font-size: 0.75rem; }
    .w-full { width: 100%; }
    .grid { display: flex; flex-wrap: wrap; margin: -0.5rem; }
    .col-6 { width: 50%; padding: 0.5rem; box-sizing: border-box; }
    .col-12 { width: 100%; padding: 0.5rem; box-sizing: border-box; }
  `],
})
export class PromotionListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  promotions = signal<Promotion[]>([]);
  loading = signal(false);
  searchValue = '';
  selectedStatus: PromotionStatus | null = null;
  selectedType: PromotionType | null = null;
  dialogVisible = false;
  isEdit = false;
  form: Partial<Promotion> = {};

  statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '排程中', value: 'scheduled' },
    { label: '進行中', value: 'active' },
    { label: '已結束', value: 'ended' },
    { label: '已取消', value: 'cancelled' },
  ];

  typeOptions = [
    { label: '百分比折扣', value: 'percentage' },
    { label: '固定金額折扣', value: 'fixed' },
    { label: '買X送Y', value: 'buy_x_get_y' },
    { label: '組合優惠', value: 'bundle' },
  ];

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.promotions.set([
        { id: 1, name: '新春優惠', code: 'CNY2026', type: 'percentage', discount_value: 15, min_purchase: 500, start_date: '2026-01-15', end_date: '2026-02-15', status: 'active', usage_count: 128, usage_limit: 500, is_active: true, description: '農曆新年全館85折' },
        { id: 2, name: '會員日折扣', code: 'MEMBER10', type: 'percentage', discount_value: 10, start_date: '2026-01-01', end_date: '2026-12-31', status: 'active', usage_count: 456, is_active: true, description: '會員專屬9折優惠' },
        { id: 3, name: '滿千折百', code: 'SAVE100', type: 'fixed', discount_value: 100, min_purchase: 1000, max_discount: 100, start_date: '2026-01-01', end_date: '2026-01-31', status: 'active', usage_count: 89, is_active: true },
        { id: 4, name: '買二送一', code: 'B2G1', type: 'buy_x_get_y', discount_value: 2, start_date: '2026-02-01', end_date: '2026-02-28', status: 'scheduled', usage_count: 0, is_active: true, description: '指定商品買二送一' },
        { id: 5, name: '聖誕特惠', code: 'XMAS25', type: 'percentage', discount_value: 25, start_date: '2025-12-20', end_date: '2025-12-31', status: 'ended', usage_count: 234, usage_limit: 300, is_active: false },
      ]);
      this.loading.set(false);
    }, 500);
  }

  getTypeLabel(type: PromotionType): string {
    const labels: Record<PromotionType, string> = {
      percentage: '百分比', fixed: '固定金額', buy_x_get_y: '買X送Y', bundle: '組合',
    };
    return labels[type] || type;
  }

  getStatusLabel(status: PromotionStatus): string {
    const labels: Record<PromotionStatus, string> = {
      draft: '草稿', scheduled: '排程中', active: '進行中', ended: '已結束', cancelled: '已取消',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: PromotionStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<PromotionStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      draft: 'secondary', scheduled: 'info', active: 'success', ended: 'secondary', cancelled: 'danger',
    };
    return severities[status] || 'info';
  }

  openDialog(): void {
    this.isEdit = false;
    this.form = { type: 'percentage', is_active: true };
    this.dialogVisible = true;
  }

  editPromotion(promo: Promotion): void {
    this.isEdit = true;
    this.form = { ...promo };
    this.dialogVisible = true;
  }

  savePromotion(): void {
    if (!this.form.name || !this.form.code) {
      this.messageService.add({ severity: 'warn', summary: '提示', detail: '請填寫必要欄位' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.isEdit ? '促銷活動已更新' : '促銷活動已新增' });
    this.dialogVisible = false;
    this.loadPromotions();
  }

  pausePromotion(promo: Promotion): void {
    this.confirmationService.confirm({
      message: `確定要暫停促銷活動「${promo.name}」嗎？`,
      header: '確認暫停',
      icon: 'pi pi-pause',
      acceptLabel: '確定',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `促銷活動「${promo.name}」已暫停` });
        this.loadPromotions();
      },
    });
  }

  confirmDelete(promo: Promotion): void {
    this.confirmationService.confirm({
      message: `確定要刪除促銷活動「${promo.name}」嗎？`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `促銷活動「${promo.name}」已刪除` });
        this.loadPromotions();
      },
    });
  }
}
