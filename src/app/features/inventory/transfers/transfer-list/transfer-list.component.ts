/**
 * 庫存調撥列表頁面元件
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled';

interface Transfer {
  id: number;
  transfer_no: string;
  from_warehouse_id: number;
  from_warehouse_name: string;
  to_warehouse_id: number;
  to_warehouse_name: string;
  status: TransferStatus;
  items_count: number;
  total_quantity: number;
  reason: string;
  created_by: string;
  created_at: string;
  shipped_at?: string;
  received_at?: string;
}

@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, ConfirmDialogModule, InputNumberModule, TextareaModule,
    PageHeaderComponent, DatePipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="庫存調撥"
      subtitle="管理倉庫間調撥"
      [breadcrumbs]="[{ label: '庫存管理' }, { label: '庫存調撥' }]"
    >
      <button pButton label="新增調撥單" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="transfers()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋調撥單號..." />
              </p-iconField>
              <p-select [options]="warehouseOptions" [(ngModel)]="selectedWarehouse" placeholder="倉庫" [showClear]="true"></p-select>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-download" label="匯出" class="p-button-outlined"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 130px">調撥單號</th>
            <th style="width: 200px">調撥路徑</th>
            <th style="width: 80px; text-align: center">項目數</th>
            <th style="width: 80px; text-align: right">總數量</th>
            <th>調撥原因</th>
            <th style="width: 100px">建立者</th>
            <th style="width: 140px">建立時間</th>
            <th style="width: 90px; text-align: center">狀態</th>
            <th style="width: 140px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-t>
          <tr>
            <td><span class="transfer-no">{{ t.transfer_no }}</span></td>
            <td>
              <div class="transfer-path">
                <span class="warehouse from">{{ t.from_warehouse_name }}</span>
                <i class="pi pi-arrow-right"></i>
                <span class="warehouse to">{{ t.to_warehouse_name }}</span>
              </div>
            </td>
            <td class="text-center">{{ t.items_count }}</td>
            <td class="text-right">{{ t.total_quantity }}</td>
            <td>{{ t.reason }}</td>
            <td>{{ t.created_by }}</td>
            <td>{{ t.created_at | date:'yyyy/MM/dd HH:mm' }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(t.status)" [severity]="getStatusSeverity(t.status)"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" (click)="viewDetail(t)" pTooltip="檢視"></button>
              @if (t.status === 'pending') {
                <button pButton icon="pi pi-check" class="p-button-text p-button-success p-button-sm" (click)="approveTransfer(t)" pTooltip="核准"></button>
                <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" (click)="cancelTransfer(t)" pTooltip="取消"></button>
              }
              @if (t.status === 'approved') {
                <button pButton icon="pi pi-truck" class="p-button-text p-button-sm" (click)="shipTransfer(t)" pTooltip="出貨"></button>
              }
              @if (t.status === 'in_transit') {
                <button pButton icon="pi pi-inbox" class="p-button-text p-button-success p-button-sm" (click)="receiveTransfer(t)" pTooltip="收貨"></button>
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="9" class="text-center p-4">尚無調撥單資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 新增調撥單對話框 -->
    <p-dialog [(visible)]="dialogVisible" header="新增調撥單" [modal]="true" [style]="{ width: '700px' }">
      <div class="grid">
        <div class="col-6 form-field">
          <label>調出倉庫</label>
          <p-select [options]="warehouseOptions" [(ngModel)]="form.from_warehouse_id" placeholder="選擇倉庫" class="w-full"></p-select>
        </div>
        <div class="col-6 form-field">
          <label>調入倉庫</label>
          <p-select [options]="warehouseOptions" [(ngModel)]="form.to_warehouse_id" placeholder="選擇倉庫" class="w-full"></p-select>
        </div>
        <div class="col-12 form-field">
          <label>調撥原因</label>
          <textarea pTextarea [(ngModel)]="form.reason" class="w-full" rows="2" placeholder="請說明調撥原因"></textarea>
        </div>
      </div>

      <div class="items-section">
        <div class="items-header">
          <h4>調撥項目</h4>
          <button pButton label="新增項目" icon="pi pi-plus" class="p-button-sm p-button-outlined" (click)="addItem()"></button>
        </div>
        <p-table [value]="formItems" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>商品</th>
              <th style="width: 100px; text-align: right">可調數量</th>
              <th style="width: 120px">調撥數量</th>
              <th style="width: 60px"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item let-i="rowIndex">
            <tr>
              <td>
                <p-select [options]="productOptions" [(ngModel)]="item.product_id" placeholder="選擇商品" class="w-full" (onChange)="onProductChange(item)"></p-select>
              </td>
              <td class="text-right">{{ item.available_qty || '-' }}</td>
              <td>
                <p-inputNumber [(ngModel)]="item.quantity" [min]="1" [max]="item.available_qty" class="w-full"></p-inputNumber>
              </td>
              <td>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="removeItem(i)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="4" class="text-center p-3">請新增調撥項目</td></tr>
          </ng-template>
        </p-table>
      </div>

      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="提交" (click)="submitTransfer()"></button>
      </ng-template>
    </p-dialog>

    <!-- 詳情對話框 -->
    <p-dialog [(visible)]="detailVisible" header="調撥單詳情" [modal]="true" [style]="{ width: '650px' }">
      @if (selectedTransfer) {
        <div class="detail-header">
          <div class="transfer-number">{{ selectedTransfer.transfer_no }}</div>
          <p-tag [value]="getStatusLabel(selectedTransfer.status)" [severity]="getStatusSeverity(selectedTransfer.status)"></p-tag>
        </div>

        <div class="transfer-route">
          <div class="route-node">
            <div class="node-label">調出倉庫</div>
            <div class="node-value">{{ selectedTransfer.from_warehouse_name }}</div>
          </div>
          <div class="route-arrow">
            <i class="pi pi-arrow-right"></i>
          </div>
          <div class="route-node">
            <div class="node-label">調入倉庫</div>
            <div class="node-value">{{ selectedTransfer.to_warehouse_name }}</div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">項目數</span>
            <span class="value">{{ selectedTransfer.items_count }}</span>
          </div>
          <div class="detail-item">
            <span class="label">總數量</span>
            <span class="value">{{ selectedTransfer.total_quantity }}</span>
          </div>
          <div class="detail-item">
            <span class="label">建立者</span>
            <span class="value">{{ selectedTransfer.created_by }}</span>
          </div>
          <div class="detail-item">
            <span class="label">建立時間</span>
            <span class="value">{{ selectedTransfer.created_at | date:'yyyy/MM/dd HH:mm' }}</span>
          </div>
          @if (selectedTransfer.shipped_at) {
            <div class="detail-item">
              <span class="label">出貨時間</span>
              <span class="value">{{ selectedTransfer.shipped_at | date:'yyyy/MM/dd HH:mm' }}</span>
            </div>
          }
          @if (selectedTransfer.received_at) {
            <div class="detail-item">
              <span class="label">收貨時間</span>
              <span class="value">{{ selectedTransfer.received_at | date:'yyyy/MM/dd HH:mm' }}</span>
            </div>
          }
          <div class="detail-item full-width">
            <span class="label">調撥原因</span>
            <span class="value">{{ selectedTransfer.reason }}</span>
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <button pButton label="關閉" class="p-button-text" (click)="detailVisible = false"></button>
        <button pButton label="列印" icon="pi pi-print" class="p-button-outlined"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .transfer-no { font-family: monospace; font-weight: 600; color: var(--primary-color); }
    .transfer-path { display: flex; align-items: center; gap: 0.5rem; }
    .transfer-path .warehouse { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
    .transfer-path .from { background: var(--blue-100); color: var(--blue-700); }
    .transfer-path .to { background: var(--green-100); color: var(--green-700); }
    .transfer-path .pi { color: var(--text-color-secondary); font-size: 0.75rem; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .grid { display: flex; flex-wrap: wrap; margin: -0.5rem; }
    .col-6 { width: 50%; padding: 0.5rem; box-sizing: border-box; }
    .col-12 { width: 100%; padding: 0.5rem; box-sizing: border-box; }
    .items-section { margin-top: 1rem; border-top: 1px solid var(--surface-border); padding-top: 1rem; }
    .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .items-header h4 { margin: 0; font-size: 1rem; }
    .detail-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .transfer-number { font-size: 1.25rem; font-weight: 700; font-family: monospace; }
    .transfer-route { display: flex; align-items: center; justify-content: center; gap: 1.5rem; padding: 1.5rem; background: var(--surface-ground); border-radius: 8px; margin-bottom: 1.5rem; }
    .route-node { text-align: center; }
    .route-node .node-label { font-size: 0.75rem; color: var(--text-color-secondary); margin-bottom: 0.25rem; }
    .route-node .node-value { font-size: 1rem; font-weight: 600; }
    .route-arrow { color: var(--primary-color); font-size: 1.5rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-item .label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .detail-item .value { font-weight: 500; }
  `],
})
export class TransferListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  transfers = signal<Transfer[]>([]);
  loading = signal(false);
  searchValue = '';
  selectedWarehouse: number | null = null;
  selectedStatus: TransferStatus | null = null;
  dialogVisible = false;
  detailVisible = false;
  selectedTransfer: Transfer | null = null;
  form: { from_warehouse_id: number | null; to_warehouse_id: number | null; reason: string } = { from_warehouse_id: null, to_warehouse_id: null, reason: '' };
  formItems: { product_id: number | null; quantity: number; available_qty: number }[] = [];

  warehouseOptions = [
    { label: '總倉', value: 1 },
    { label: '北區倉庫', value: 2 },
    { label: '中區倉庫', value: 3 },
    { label: '南區倉庫', value: 4 },
  ];

  statusOptions = [
    { label: '待審核', value: 'pending' },
    { label: '已核准', value: 'approved' },
    { label: '運送中', value: 'in_transit' },
    { label: '已收貨', value: 'received' },
    { label: '已取消', value: 'cancelled' },
  ];

  productOptions = [
    { label: 'P001 - 可口可樂 330ml', value: 1 },
    { label: 'P002 - 百事可樂 330ml', value: 2 },
    { label: 'P003 - 樂事洋芋片', value: 3 },
    { label: 'P004 - 舒潔衛生紙', value: 4 },
  ];

  ngOnInit(): void {
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.transfers.set([
        { id: 1, transfer_no: 'TF20260119001', from_warehouse_id: 1, from_warehouse_name: '總倉', to_warehouse_id: 2, to_warehouse_name: '北區倉庫', status: 'in_transit', items_count: 5, total_quantity: 200, reason: '補充北區庫存', created_by: '張倉管', created_at: '2026-01-19T09:00:00', shipped_at: '2026-01-19T10:30:00' },
        { id: 2, transfer_no: 'TF20260119002', from_warehouse_id: 1, from_warehouse_name: '總倉', to_warehouse_id: 3, to_warehouse_name: '中區倉庫', status: 'pending', items_count: 3, total_quantity: 100, reason: '中區促銷備貨', created_by: '李倉管', created_at: '2026-01-19T14:00:00' },
        { id: 3, transfer_no: 'TF20260118001', from_warehouse_id: 2, from_warehouse_name: '北區倉庫', to_warehouse_id: 1, to_warehouse_name: '總倉', status: 'received', items_count: 2, total_quantity: 50, reason: '退回滯銷品', created_by: '張倉管', created_at: '2026-01-18T11:00:00', shipped_at: '2026-01-18T14:00:00', received_at: '2026-01-18T16:30:00' },
        { id: 4, transfer_no: 'TF20260117001', from_warehouse_id: 1, from_warehouse_name: '總倉', to_warehouse_id: 4, to_warehouse_name: '南區倉庫', status: 'approved', items_count: 8, total_quantity: 350, reason: '新店開幕備貨', created_by: '王倉管', created_at: '2026-01-17T10:00:00' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  getStatusLabel(status: TransferStatus): string {
    const labels: Record<TransferStatus, string> = { pending: '待審核', approved: '已核准', in_transit: '運送中', received: '已收貨', cancelled: '已取消' };
    return labels[status] || status;
  }

  getStatusSeverity(status: TransferStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<TransferStatus, 'success' | 'info' | 'warn' | 'secondary'> = { pending: 'warn', approved: 'info', in_transit: 'info', received: 'success', cancelled: 'secondary' };
    return severities[status] || 'info';
  }

  openDialog(): void {
    this.form = { from_warehouse_id: null, to_warehouse_id: null, reason: '' };
    this.formItems = [];
    this.dialogVisible = true;
  }

  addItem(): void {
    this.formItems.push({ product_id: null, quantity: 1, available_qty: 0 });
  }

  removeItem(index: number): void {
    this.formItems.splice(index, 1);
  }

  onProductChange(item: { product_id: number | null; available_qty: number }): void {
    item.available_qty = Math.floor(Math.random() * 500) + 50;
  }

  submitTransfer(): void {
    if (!this.form.from_warehouse_id || !this.form.to_warehouse_id || this.formItems.length === 0) {
      this.messageService.add({ severity: 'warn', summary: '提示', detail: '請填寫完整資料並新增調撥項目' });
      return;
    }
    if (this.form.from_warehouse_id === this.form.to_warehouse_id) {
      this.messageService.add({ severity: 'warn', summary: '提示', detail: '調出與調入倉庫不能相同' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: '成功', detail: '調撥單已提交審核' });
    this.dialogVisible = false;
    this.loadTransfers();
  }

  viewDetail(t: Transfer): void {
    this.selectedTransfer = t;
    this.detailVisible = true;
  }

  approveTransfer(t: Transfer): void {
    this.confirmationService.confirm({
      message: `確定要核准調撥單「${t.transfer_no}」嗎？`,
      header: '確認核准',
      icon: 'pi pi-check-circle',
      acceptLabel: '確定',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `調撥單 ${t.transfer_no} 已核准` });
        this.loadTransfers();
      },
    });
  }

  shipTransfer(t: Transfer): void {
    this.confirmationService.confirm({
      message: `確定要出貨調撥單「${t.transfer_no}」嗎？`,
      header: '確認出貨',
      icon: 'pi pi-truck',
      acceptLabel: '確定出貨',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `調撥單 ${t.transfer_no} 已出貨` });
        this.loadTransfers();
      },
    });
  }

  receiveTransfer(t: Transfer): void {
    this.confirmationService.confirm({
      message: `確定已收到調撥單「${t.transfer_no}」的貨品嗎？`,
      header: '確認收貨',
      icon: 'pi pi-inbox',
      acceptLabel: '確定收貨',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `調撥單 ${t.transfer_no} 已完成收貨` });
        this.loadTransfers();
      },
    });
  }

  cancelTransfer(t: Transfer): void {
    this.confirmationService.confirm({
      message: `確定要取消調撥單「${t.transfer_no}」嗎？`,
      header: '確認取消',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '確定取消',
      rejectLabel: '返回',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `調撥單 ${t.transfer_no} 已取消` });
        this.loadTransfers();
      },
    });
  }
}
