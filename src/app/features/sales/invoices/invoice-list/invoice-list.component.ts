/**
 * 發票列表頁面元件
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
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type InvoiceType = 'b2c' | 'b2b' | 'donation';
type InvoiceStatus = 'issued' | 'void' | 'allowance';

interface Invoice {
  id: number;
  invoice_no: string;
  order_no: string;
  order_id: number;
  type: InvoiceType;
  buyer_name?: string;
  buyer_tax_id?: string;
  carrier_type?: string;
  carrier_no?: string;
  donation_code?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  issued_at: string;
  void_at?: string;
  void_reason?: string;
}

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, TagModule, SelectModule, TooltipModule,
    IconFieldModule, InputIconModule, DialogModule, ConfirmDialogModule,
    DatePickerModule, PageHeaderComponent, CurrencyPipe, DatePipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="發票管理"
      subtitle="管理銷售發票"
      [breadcrumbs]="[{ label: '銷售管理' }, { label: '發票管理' }]"
    >
      <button pButton label="開立發票" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ stats().total }}</div>
        <div class="stat-label">本月開立</div>
      </div>
      <div class="stat-card">
        <div class="stat-value amount">{{ stats().totalAmount | currency:'TWD':'symbol':'1.0-0' }}</div>
        <div class="stat-label">開立金額</div>
      </div>
      <div class="stat-card">
        <div class="stat-value void">{{ stats().void }}</div>
        <div class="stat-label">作廢張數</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats().donation }}</div>
        <div class="stat-label">捐贈張數</div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="invoices()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋發票號碼..." />
              </p-iconField>
              <p-select [options]="typeOptions" [(ngModel)]="selectedType" placeholder="發票類型" [showClear]="true"></p-select>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
              <p-datepicker [(ngModel)]="dateRange" selectionMode="range" placeholder="開立日期" dateFormat="yy/mm/dd" [showIcon]="true"></p-datepicker>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-download" label="匯出" class="p-button-outlined"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 130px">發票號碼</th>
            <th style="width: 130px">訂單編號</th>
            <th style="width: 90px; text-align: center">類型</th>
            <th>買受人</th>
            <th style="width: 150px">載具/捐贈碼</th>
            <th style="width: 120px; text-align: right">金額</th>
            <th style="width: 140px">開立時間</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-invoice>
          <tr>
            <td>
              <span class="invoice-no">{{ invoice.invoice_no }}</span>
            </td>
            <td>
              <a [routerLink]="['/sales/orders', invoice.order_id]" class="order-link">{{ invoice.order_no }}</a>
            </td>
            <td class="text-center">
              <p-tag [value]="getTypeLabel(invoice.type)" [severity]="getTypeSeverity(invoice.type)"></p-tag>
            </td>
            <td>
              @if (invoice.type === 'b2b') {
                <div class="buyer-info">
                  <span class="buyer-name">{{ invoice.buyer_name }}</span>
                  <span class="buyer-tax">{{ invoice.buyer_tax_id }}</span>
                </div>
              } @else if (invoice.type === 'donation') {
                <span class="text-secondary">捐贈</span>
              } @else {
                <span class="text-secondary">一般消費者</span>
              }
            </td>
            <td>
              @if (invoice.type === 'donation') {
                <span class="donation-code">{{ invoice.donation_code }}</span>
              } @else if (invoice.carrier_no) {
                <span class="carrier-info">{{ invoice.carrier_type }}: {{ invoice.carrier_no }}</span>
              } @else {
                -
              }
            </td>
            <td class="text-right">{{ invoice.total_amount | currency:'TWD':'symbol':'1.0-0' }}</td>
            <td>{{ invoice.issued_at | date:'yyyy/MM/dd HH:mm' }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(invoice.status)" [severity]="getStatusSeverity(invoice.status)"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" (click)="viewInvoice(invoice)" pTooltip="檢視"></button>
              <button pButton icon="pi pi-print" class="p-button-text p-button-sm" (click)="printInvoice(invoice)" pTooltip="列印"></button>
              @if (invoice.status === 'issued') {
                <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" (click)="confirmVoid(invoice)" pTooltip="作廢"></button>
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="9" class="text-center p-4">尚無發票資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 發票詳情對話框 -->
    <p-dialog [(visible)]="detailVisible" header="發票詳情" [modal]="true" [style]="{ width: '600px' }">
      @if (selectedInvoice) {
        <div class="invoice-detail">
          <div class="invoice-header">
            <div class="invoice-title">電子發票</div>
            <div class="invoice-number">{{ selectedInvoice.invoice_no }}</div>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">開立日期</span>
              <span class="value">{{ selectedInvoice.issued_at | date:'yyyy年MM月dd日 HH:mm' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">發票類型</span>
              <span class="value">{{ getTypeLabel(selectedInvoice.type) }}</span>
            </div>
            @if (selectedInvoice.type === 'b2b') {
              <div class="detail-item">
                <span class="label">買受人</span>
                <span class="value">{{ selectedInvoice.buyer_name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">統一編號</span>
                <span class="value">{{ selectedInvoice.buyer_tax_id }}</span>
              </div>
            }
            @if (selectedInvoice.type === 'donation') {
              <div class="detail-item">
                <span class="label">捐贈碼</span>
                <span class="value">{{ selectedInvoice.donation_code }}</span>
              </div>
            }
            @if (selectedInvoice.carrier_no) {
              <div class="detail-item">
                <span class="label">載具類型</span>
                <span class="value">{{ selectedInvoice.carrier_type }}</span>
              </div>
              <div class="detail-item">
                <span class="label">載具號碼</span>
                <span class="value">{{ selectedInvoice.carrier_no }}</span>
              </div>
            }
            <div class="detail-item">
              <span class="label">銷售額</span>
              <span class="value">{{ selectedInvoice.amount | currency:'TWD':'symbol':'1.0-0' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">稅額</span>
              <span class="value">{{ selectedInvoice.tax_amount | currency:'TWD':'symbol':'1.0-0' }}</span>
            </div>
            <div class="detail-item total">
              <span class="label">總計</span>
              <span class="value">{{ selectedInvoice.total_amount | currency:'TWD':'symbol':'1.0-0' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">訂單編號</span>
              <span class="value">{{ selectedInvoice.order_no }}</span>
            </div>
            <div class="detail-item">
              <span class="label">狀態</span>
              <span class="value"><p-tag [value]="getStatusLabel(selectedInvoice.status)" [severity]="getStatusSeverity(selectedInvoice.status)"></p-tag></span>
            </div>
            @if (selectedInvoice.void_at) {
              <div class="detail-item full-width">
                <span class="label">作廢時間</span>
                <span class="value">{{ selectedInvoice.void_at | date:'yyyy/MM/dd HH:mm' }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="label">作廢原因</span>
                <span class="value">{{ selectedInvoice.void_reason }}</span>
              </div>
            }
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <button pButton label="關閉" class="p-button-text" (click)="detailVisible = false"></button>
        <button pButton label="列印" icon="pi pi-print" (click)="printInvoice(selectedInvoice!)"></button>
      </ng-template>
    </p-dialog>

    <!-- 開立發票對話框 -->
    <p-dialog [(visible)]="dialogVisible" header="開立發票" [modal]="true" [style]="{ width: '500px' }">
      <div class="grid">
        <div class="col-12 form-field">
          <label>關聯訂單</label>
          <p-select [options]="orderOptions" [(ngModel)]="newInvoice.order_id" placeholder="選擇訂單" class="w-full"></p-select>
        </div>
        <div class="col-12 form-field">
          <label>發票類型</label>
          <p-select [options]="typeOptions" [(ngModel)]="newInvoice.type" class="w-full"></p-select>
        </div>
        @if (newInvoice.type === 'b2b') {
          <div class="col-12 form-field">
            <label>買受人名稱</label>
            <input pInputText [(ngModel)]="newInvoice.buyer_name" class="w-full" />
          </div>
          <div class="col-12 form-field">
            <label>統一編號</label>
            <input pInputText [(ngModel)]="newInvoice.buyer_tax_id" class="w-full" maxlength="8" />
          </div>
        }
        @if (newInvoice.type === 'b2c') {
          <div class="col-6 form-field">
            <label>載具類型</label>
            <p-select [options]="carrierOptions" [(ngModel)]="newInvoice.carrier_type" class="w-full" [showClear]="true"></p-select>
          </div>
          <div class="col-6 form-field">
            <label>載具號碼</label>
            <input pInputText [(ngModel)]="newInvoice.carrier_no" class="w-full" />
          </div>
        }
        @if (newInvoice.type === 'donation') {
          <div class="col-12 form-field">
            <label>捐贈碼</label>
            <p-select [options]="donationOptions" [(ngModel)]="newInvoice.donation_code" class="w-full"></p-select>
          </div>
        }
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="開立" (click)="issueInvoice()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; text-align: center; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
    .stat-value.amount { color: var(--primary-color); font-size: 1.25rem; }
    .stat-value.void { color: var(--red-500); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); margin-top: 0.25rem; }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .invoice-no { font-family: monospace; font-weight: 600; color: var(--primary-color); }
    .order-link { color: var(--primary-color); text-decoration: none; }
    .order-link:hover { text-decoration: underline; }
    .buyer-info { display: flex; flex-direction: column; }
    .buyer-name { font-weight: 500; }
    .buyer-tax { font-size: 0.875rem; color: var(--text-color-secondary); }
    .donation-code, .carrier-info { font-size: 0.875rem; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .grid { display: flex; flex-wrap: wrap; margin: -0.5rem; }
    .col-6 { width: 50%; padding: 0.5rem; box-sizing: border-box; }
    .col-12 { width: 100%; padding: 0.5rem; box-sizing: border-box; }
    .invoice-detail { border: 1px solid var(--surface-border); border-radius: 8px; padding: 1.5rem; }
    .invoice-header { text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px dashed var(--surface-border); }
    .invoice-title { font-size: 1.25rem; font-weight: 600; color: var(--text-color); }
    .invoice-number { font-size: 1.5rem; font-family: monospace; font-weight: 700; color: var(--primary-color); margin-top: 0.5rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-item.total { border-top: 1px solid var(--surface-border); padding-top: 0.75rem; grid-column: 1 / -1; }
    .detail-item.total .value { font-size: 1.25rem; color: var(--primary-color); }
    .detail-item .label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .detail-item .value { font-weight: 500; }
  `],
})
export class InvoiceListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  invoices = signal<Invoice[]>([]);
  loading = signal(false);
  stats = signal({ total: 0, totalAmount: 0, void: 0, donation: 0 });
  searchValue = '';
  selectedType: InvoiceType | null = null;
  selectedStatus: InvoiceStatus | null = null;
  dateRange: Date[] | null = null;
  dialogVisible = false;
  detailVisible = false;
  selectedInvoice: Invoice | null = null;
  newInvoice: Partial<Invoice> = {};

  typeOptions = [
    { label: 'B2C (一般)', value: 'b2c' },
    { label: 'B2B (公司)', value: 'b2b' },
    { label: '捐贈', value: 'donation' },
  ];

  statusOptions = [
    { label: '已開立', value: 'issued' },
    { label: '已作廢', value: 'void' },
    { label: '折讓', value: 'allowance' },
  ];

  carrierOptions = [
    { label: '手機條碼', value: 'mobile' },
    { label: '自然人憑證', value: 'citizen' },
  ];

  donationOptions = [
    { label: '創世基金會 (919)', value: '919' },
    { label: '家扶基金會 (8585)', value: '8585' },
    { label: '伊甸基金會 (25885)', value: '25885' },
  ];

  orderOptions = [
    { label: 'SO20260119001 - NT$546', value: 1 },
    { label: 'SO20260119002 - NT$1,134', value: 2 },
    { label: 'SO20260119003 - NT$368', value: 3 },
  ];

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: Invoice[] = [
        { id: 1, invoice_no: 'AB12345678', order_no: 'SO20260119001', order_id: 1, type: 'b2c', carrier_type: '手機條碼', carrier_no: '/ABC+123', amount: 520, tax_amount: 26, total_amount: 546, status: 'issued', issued_at: '2026-01-19T10:35:00' },
        { id: 2, invoice_no: 'AB12345679', order_no: 'SO20260119002', order_id: 2, type: 'b2b', buyer_name: '龜三有限公司', buyer_tax_id: '12345678', amount: 1080, tax_amount: 54, total_amount: 1134, status: 'issued', issued_at: '2026-01-19T11:20:00' },
        { id: 3, invoice_no: 'AB12345680', order_no: 'SO20260119003', order_id: 3, type: 'donation', donation_code: '919', amount: 350, tax_amount: 18, total_amount: 368, status: 'issued', issued_at: '2026-01-19T14:25:00' },
        { id: 4, invoice_no: 'AB12345670', order_no: 'SO20260118001', order_id: 4, type: 'b2c', amount: 800, tax_amount: 40, total_amount: 840, status: 'void', issued_at: '2026-01-18T16:50:00', void_at: '2026-01-18T17:30:00', void_reason: '客戶退貨' },
        { id: 5, invoice_no: 'AB12345665', order_no: 'SO20260117001', order_id: 5, type: 'b2c', carrier_type: '自然人憑證', carrier_no: 'AB12345678901234', amount: 1500, tax_amount: 75, total_amount: 1575, status: 'issued', issued_at: '2026-01-17T09:15:00' },
      ];
      this.invoices.set(data);
      this.stats.set({
        total: data.filter(i => i.status === 'issued').length,
        totalAmount: data.filter(i => i.status === 'issued').reduce((sum, i) => sum + i.total_amount, 0),
        void: data.filter(i => i.status === 'void').length,
        donation: data.filter(i => i.type === 'donation').length,
      });
      this.loading.set(false);
    }, 500);
  }

  getTypeLabel(type: InvoiceType): string {
    const labels: Record<InvoiceType, string> = { b2c: '一般', b2b: '公司', donation: '捐贈' };
    return labels[type] || type;
  }

  getTypeSeverity(type: InvoiceType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<InvoiceType, 'info' | 'warn' | 'secondary'> = { b2c: 'info', b2b: 'warn', donation: 'secondary' };
    return severities[type] || 'info';
  }

  getStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = { issued: '已開立', void: '已作廢', allowance: '折讓' };
    return labels[status] || status;
  }

  getStatusSeverity(status: InvoiceStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<InvoiceStatus, 'success' | 'danger' | 'warn'> = { issued: 'success', void: 'danger', allowance: 'warn' };
    return severities[status] || 'info';
  }

  openDialog(): void {
    this.newInvoice = { type: 'b2c' };
    this.dialogVisible = true;
  }

  viewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.detailVisible = true;
  }

  printInvoice(invoice: Invoice): void {
    this.messageService.add({ severity: 'info', summary: '列印', detail: `正在列印發票 ${invoice.invoice_no}` });
  }

  issueInvoice(): void {
    if (!this.newInvoice.order_id) {
      this.messageService.add({ severity: 'warn', summary: '提示', detail: '請選擇關聯訂單' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: '成功', detail: '發票已開立' });
    this.dialogVisible = false;
    this.loadInvoices();
  }

  confirmVoid(invoice: Invoice): void {
    this.confirmationService.confirm({
      message: `確定要作廢發票「${invoice.invoice_no}」嗎？此操作無法復原。`,
      header: '確認作廢',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '作廢',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `發票 ${invoice.invoice_no} 已作廢` });
        this.loadInvoices();
      },
    });
  }
}
