/**
 * 退貨列表頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

interface ReturnItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  reason: string;
}

interface SalesReturn {
  id: number;
  return_no: string;
  order_no: string;
  order_id: number;
  customer_name: string;
  store_name: string;
  status: ReturnStatus;
  total_amount: number;
  items: ReturnItem[];
  reason: string;
  created_at: string;
  processed_at?: string;
}

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, TagModule, SelectModule, TooltipModule,
    IconFieldModule, InputIconModule, DialogModule, ConfirmDialogModule,
    InputNumberModule, TextareaModule, PageHeaderComponent, CurrencyPipe, DatePipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="退貨管理"
      subtitle="管理銷售退貨"
      [breadcrumbs]="[{ label: '銷售管理' }, { label: '退貨管理' }]"
    >
      <button pButton label="新增退貨" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="returns()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋退貨單號..." />
              </p-iconField>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="退貨狀態" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-download" label="匯出" class="p-button-outlined"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 130px">退貨單號</th>
            <th style="width: 130px">原訂單編號</th>
            <th style="width: 150px">申請時間</th>
            <th>客戶</th>
            <th style="width: 100px">門市</th>
            <th style="width: 120px; text-align: right">退貨金額</th>
            <th style="width: 90px; text-align: center">狀態</th>
            <th style="width: 140px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-item>
          <tr>
            <td>
              <span class="return-link" (click)="viewReturn(item)">{{ item.return_no }}</span>
            </td>
            <td>
              <a [routerLink]="['/sales/orders', item.order_id]" class="order-link">{{ item.order_no }}</a>
            </td>
            <td>{{ item.created_at | date:'yyyy/MM/dd HH:mm' }}</td>
            <td>{{ item.customer_name || '一般客戶' }}</td>
            <td>{{ item.store_name }}</td>
            <td class="text-right">{{ item.total_amount | currency:'TWD':'symbol':'1.0-0' }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(item.status)" [severity]="getStatusSeverity(item.status)"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" (click)="viewReturn(item)" pTooltip="檢視"></button>
              @if (item.status === 'pending') {
                <button pButton icon="pi pi-check" class="p-button-text p-button-success p-button-sm" (click)="approveReturn(item)" pTooltip="核准"></button>
                <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" (click)="rejectReturn(item)" pTooltip="駁回"></button>
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="8" class="text-center p-4">尚無退貨資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="dialogVisible" header="新增退貨申請" [modal]="true" [style]="{ width: '600px' }">
      <div class="form-field">
        <label>原訂單編號</label>
        <p-select [options]="orderOptions" [(ngModel)]="form.order_id" placeholder="選擇訂單" optionLabel="label" optionValue="value" class="w-full"></p-select>
      </div>
      <div class="form-field">
        <label>退貨原因</label>
        <textarea pTextarea [(ngModel)]="form.reason" class="w-full" rows="3" placeholder="請說明退貨原因"></textarea>
      </div>
      <div class="form-field">
        <label>退貨金額</label>
        <p-inputNumber [(ngModel)]="form.total_amount" mode="currency" currency="TWD" locale="zh-TW" class="w-full"></p-inputNumber>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="提交申請" (click)="submitReturn()"></button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="detailVisible" header="退貨單詳情" [modal]="true" [style]="{ width: '650px' }">
      @if (selectedReturn) {
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">退貨單號</span>
            <span class="value">{{ selectedReturn.return_no }}</span>
          </div>
          <div class="detail-item">
            <span class="label">原訂單編號</span>
            <span class="value">{{ selectedReturn.order_no }}</span>
          </div>
          <div class="detail-item">
            <span class="label">申請時間</span>
            <span class="value">{{ selectedReturn.created_at | date:'yyyy/MM/dd HH:mm' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">狀態</span>
            <span class="value"><p-tag [value]="getStatusLabel(selectedReturn.status)" [severity]="getStatusSeverity(selectedReturn.status)"></p-tag></span>
          </div>
          <div class="detail-item">
            <span class="label">客戶</span>
            <span class="value">{{ selectedReturn.customer_name || '一般客戶' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">門市</span>
            <span class="value">{{ selectedReturn.store_name }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="label">退貨原因</span>
            <span class="value">{{ selectedReturn.reason }}</span>
          </div>
          <div class="detail-item">
            <span class="label">退貨金額</span>
            <span class="value amount">{{ selectedReturn.total_amount | currency:'TWD':'symbol':'1.0-0' }}</span>
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <button pButton label="關閉" class="p-button-text" (click)="detailVisible = false"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .return-link, .order-link { color: var(--primary-color); text-decoration: none; font-weight: 500; cursor: pointer; }
    .return-link:hover, .order-link:hover { text-decoration: underline; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-item .label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .detail-item .value { font-weight: 500; }
    .detail-item .value.amount { font-size: 1.25rem; color: var(--red-500); }
  `],
})
export class ReturnListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  returns = signal<SalesReturn[]>([]);
  loading = signal(false);
  searchValue = '';
  selectedStatus: ReturnStatus | null = null;
  dialogVisible = false;
  detailVisible = false;
  selectedReturn: SalesReturn | null = null;
  form: { order_id: number | null; reason: string; total_amount: number } = { order_id: null, reason: '', total_amount: 0 };

  statusOptions = [
    { label: '待審核', value: 'pending' },
    { label: '已核准', value: 'approved' },
    { label: '已駁回', value: 'rejected' },
    { label: '已完成', value: 'completed' },
  ];

  orderOptions = [
    { label: 'SO20260119001 - NT$546', value: 1 },
    { label: 'SO20260119002 - NT$1,134', value: 2 },
    { label: 'SO20260119003 - NT$368', value: 3 },
  ];

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.returns.set([
        { id: 1, return_no: 'RT20260119001', order_no: 'SO20260118001', order_id: 4, customer_name: '王小明', store_name: '台北旗艦店', status: 'completed', total_amount: 840, items: [], reason: '商品瑕疵', created_at: '2026-01-19T09:00:00', processed_at: '2026-01-19T10:30:00' },
        { id: 2, return_no: 'RT20260119002', order_no: 'SO20260117001', order_id: 5, customer_name: '李小華', store_name: '新北板橋店', status: 'pending', total_amount: 350, items: [], reason: '尺寸不合', created_at: '2026-01-19T14:20:00' },
        { id: 3, return_no: 'RT20260118001', order_no: 'SO20260116001', order_id: 6, customer_name: '', store_name: '台北旗艦店', status: 'rejected', total_amount: 200, items: [], reason: '已過退貨期限', created_at: '2026-01-18T11:00:00', processed_at: '2026-01-18T15:00:00' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  getStatusLabel(status: ReturnStatus): string {
    const labels: Record<ReturnStatus, string> = {
      pending: '待審核', approved: '已核准', rejected: '已駁回', completed: '已完成',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: ReturnStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<ReturnStatus, 'success' | 'warn' | 'danger' | 'secondary'> = {
      pending: 'warn', approved: 'success', rejected: 'danger', completed: 'secondary',
    };
    return severities[status] || 'info';
  }

  openDialog(): void {
    this.form = { order_id: null, reason: '', total_amount: 0 };
    this.dialogVisible = true;
  }

  submitReturn(): void {
    if (!this.form.order_id || !this.form.reason) {
      this.messageService.add({ severity: 'warn', summary: '提示', detail: '請填寫完整資料' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: '成功', detail: '退貨申請已提交' });
    this.dialogVisible = false;
    this.loadReturns();
  }

  viewReturn(item: SalesReturn): void {
    this.selectedReturn = item;
    this.detailVisible = true;
  }

  approveReturn(item: SalesReturn): void {
    this.confirmationService.confirm({
      message: `確定要核准退貨單「${item.return_no}」嗎？`,
      header: '確認核准',
      icon: 'pi pi-check-circle',
      acceptLabel: '確定核准',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `退貨單 ${item.return_no} 已核准` });
        this.loadReturns();
      },
    });
  }

  rejectReturn(item: SalesReturn): void {
    this.confirmationService.confirm({
      message: `確定要駁回退貨單「${item.return_no}」嗎？`,
      header: '確認駁回',
      icon: 'pi pi-times-circle',
      acceptLabel: '確定駁回',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `退貨單 ${item.return_no} 已駁回` });
        this.loadReturns();
      },
    });
  }
}
