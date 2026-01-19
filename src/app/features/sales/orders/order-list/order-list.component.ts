/**
 * 訂單列表頁面元件
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
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';
import { Order, OrderStatus, PaymentStatus } from '@core/models';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, TagModule, SelectModule, DatePickerModule, TooltipModule,
    IconFieldModule, InputIconModule, DialogModule, ConfirmDialogModule,
    PageHeaderComponent, CurrencyPipe, DatePipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="訂單管理"
      subtitle="管理所有銷售訂單"
      [breadcrumbs]="[{ label: '銷售管理' }, { label: '訂單管理' }]"
    >
      <button pButton label="新增訂單" icon="pi pi-plus" routerLink="/sales/pos"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="orders()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋訂單編號..." />
              </p-iconField>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="訂單狀態" [showClear]="true"></p-select>
              <p-select [options]="paymentStatusOptions" [(ngModel)]="selectedPaymentStatus" placeholder="付款狀態" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-download" label="匯出" class="p-button-outlined"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 130px">訂單編號</th>
            <th style="width: 150px">建立時間</th>
            <th>客戶</th>
            <th style="width: 100px">門市</th>
            <th style="width: 120px; text-align: right">金額</th>
            <th style="width: 90px; text-align: center">訂單狀態</th>
            <th style="width: 90px; text-align: center">付款狀態</th>
            <th style="width: 140px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-order>
          <tr>
            <td>
              <a [routerLink]="[order.id]" class="order-link">{{ order.order_no }}</a>
            </td>
            <td>{{ order.created_at | date:'yyyy/MM/dd HH:mm' }}</td>
            <td>{{ order.customer?.name || '一般客戶' }}</td>
            <td>{{ order.store?.name || '-' }}</td>
            <td class="text-right">{{ order.total_amount | currency:'TWD':'symbol':'1.0-0' }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(order.status)" [severity]="getStatusSeverity(order.status)"></p-tag>
            </td>
            <td class="text-center">
              <p-tag [value]="getPaymentStatusLabel(order.payment_status)" [severity]="getPaymentStatusSeverity(order.payment_status)"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" [routerLink]="[order.id]" pTooltip="檢視"></button>
              <button pButton icon="pi pi-print" class="p-button-text p-button-sm" (click)="printOrder(order)" pTooltip="列印"></button>
              @if (order.status !== 'cancelled' && order.status !== 'completed') {
                <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" (click)="confirmCancel(order)" pTooltip="取消"></button>
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="8" class="text-center p-4">尚無訂單資料</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .order-link { color: var(--primary-color); text-decoration: none; font-weight: 500; }
    .order-link:hover { text-decoration: underline; }
  `],
})
export class OrderListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  orders = signal<Order[]>([]);
  loading = signal(false);
  searchValue = '';
  selectedStatus: OrderStatus | null = null;
  selectedPaymentStatus: PaymentStatus | null = null;

  statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '待處理', value: 'pending' },
    { label: '已確認', value: 'confirmed' },
    { label: '處理中', value: 'processing' },
    { label: '已完成', value: 'completed' },
    { label: '已取消', value: 'cancelled' },
  ];

  paymentStatusOptions = [
    { label: '未付款', value: 'unpaid' },
    { label: '部分付款', value: 'partial' },
    { label: '已付款', value: 'paid' },
    { label: '已退款', value: 'refunded' },
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.orders.set([
        { id: 1, order_no: 'SO20260119001', store_id: 1, store: { id: 1, code: 'ST001', name: '台北旗艦店', is_active: true, created_at: '', updated_at: '' }, user_id: 1, status: 'completed', payment_status: 'paid', subtotal: 520, discount_amount: 0, tax_amount: 26, total_amount: 546, paid_amount: 546, items: [], payments: [], created_at: '2026-01-19T10:30:00', updated_at: '' },
        { id: 2, order_no: 'SO20260119002', store_id: 1, store: { id: 1, code: 'ST001', name: '台北旗艦店', is_active: true, created_at: '', updated_at: '' }, user_id: 1, customer: { id: 1, code: 'CU001', name: '王小明', points: 100, total_spent: 5000, is_active: true, created_at: '', updated_at: '' }, status: 'completed', payment_status: 'paid', subtotal: 1200, discount_amount: 120, tax_amount: 54, total_amount: 1134, paid_amount: 1134, items: [], payments: [], created_at: '2026-01-19T11:15:00', updated_at: '' },
        { id: 3, order_no: 'SO20260119003', store_id: 2, store: { id: 2, code: 'ST002', name: '新北板橋店', is_active: true, created_at: '', updated_at: '' }, user_id: 2, status: 'pending', payment_status: 'unpaid', subtotal: 350, discount_amount: 0, tax_amount: 18, total_amount: 368, paid_amount: 0, items: [], payments: [], created_at: '2026-01-19T14:20:00', updated_at: '' },
        { id: 4, order_no: 'SO20260118001', store_id: 1, store: { id: 1, code: 'ST001', name: '台北旗艦店', is_active: true, created_at: '', updated_at: '' }, user_id: 1, status: 'cancelled', payment_status: 'refunded', subtotal: 800, discount_amount: 0, tax_amount: 40, total_amount: 840, paid_amount: 0, items: [], payments: [], created_at: '2026-01-18T16:45:00', updated_at: '' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      draft: '草稿', pending: '待處理', confirmed: '已確認',
      processing: '處理中', completed: '已完成', cancelled: '已取消',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: OrderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<OrderStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      draft: 'secondary', pending: 'warn', confirmed: 'info',
      processing: 'info', completed: 'success', cancelled: 'danger',
    };
    return severities[status] || 'info';
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      unpaid: '未付款', partial: '部分付款', paid: '已付款', refunded: '已退款',
    };
    return labels[status] || status;
  }

  getPaymentStatusSeverity(status: PaymentStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<PaymentStatus, 'success' | 'warn' | 'danger' | 'secondary'> = {
      unpaid: 'danger', partial: 'warn', paid: 'success', refunded: 'secondary',
    };
    return severities[status] || 'info';
  }

  printOrder(order: Order): void {
    this.messageService.add({ severity: 'info', summary: '列印', detail: `正在列印訂單 ${order.order_no}` });
  }

  confirmCancel(order: Order): void {
    this.confirmationService.confirm({
      message: `確定要取消訂單「${order.order_no}」嗎？`,
      header: '確認取消',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '確定取消',
      rejectLabel: '返回',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `訂單 ${order.order_no} 已取消` });
        this.loadOrders();
      },
    });
  }
}
