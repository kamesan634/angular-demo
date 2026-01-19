/**
 * 採購單管理列表頁面元件
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
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type OrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'partial_received' | 'received' | 'cancelled';

interface OrderItem {
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  received_qty: number;
  unit_cost: number;
  subtotal: number;
}

interface PurchaseOrder {
  id: number;
  order_no: string;
  supplier_id: number;
  supplier_name: string;
  status: OrderStatus;
  items: OrderItem[];
  total_amount: number;
  expected_date: string;
  remark?: string;
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, InputNumberModule, DatePickerModule, TextareaModule,
    ConfirmDialogModule, PageHeaderComponent, DatePipe,
  ],
  template: `
    <app-page-header
      title="採購單管理"
      subtitle="管理採購訂單"
      [breadcrumbs]="[{ label: '採購管理' }, { label: '採購單管理' }]"
    >
      <button pButton label="新增採購單" icon="pi pi-plus" (click)="openNewDialog()"></button>
    </app-page-header>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-file-edit"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().draftCount }}</div>
          <div class="stat-label">草稿</div>
        </div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon"><i class="pi pi-clock"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().pendingCount }}</div>
          <div class="stat-label">待核准</div>
        </div>
      </div>
      <div class="stat-card active">
        <div class="stat-icon"><i class="pi pi-truck"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().activeCount }}</div>
          <div class="stat-label">進行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-dollar"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalAmount | number:'1.0-0' }}</div>
          <div class="stat-label">本月採購額</div>
        </div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="orders()" [paginator]="true" [rows]="15" [loading]="loading()" [rowHover]="true" dataKey="id" [expandedRowKeys]="expandedRows" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋單號或供應商..." />
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
            <th style="width: 130px">採購單號</th>
            <th style="width: 120px">供應商</th>
            <th style="width: 80px; text-align: right">品項數</th>
            <th style="width: 100px; text-align: right">金額</th>
            <th style="width: 100px">預計到貨</th>
            <th style="width: 100px; text-align: center">狀態</th>
            <th style="width: 100px">建立日期</th>
            <th style="width: 80px">建立者</th>
            <th style="width: 140px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-o let-expanded="expanded">
          <tr>
            <td>
              <button type="button" pButton pRipple [pRowToggler]="o" class="p-button-text p-button-rounded p-button-plain" [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></button>
            </td>
            <td><span class="order-no">{{ o.order_no }}</span></td>
            <td>{{ o.supplier_name }}</td>
            <td class="text-right">{{ o.items.length }}</td>
            <td class="text-right font-semibold">{{ o.total_amount | number:'1.0-0' }}</td>
            <td>{{ o.expected_date | date:'MM/dd' }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(o.status)" [severity]="getStatusSeverity(o.status)"></p-tag>
            </td>
            <td>{{ o.created_at | date:'MM/dd' }}</td>
            <td>{{ o.created_by }}</td>
            <td class="text-center">
              @switch (o.status) {
                @case ('draft') {
                  <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="編輯" (click)="editOrder(o)"></button>
                  <button pButton icon="pi pi-send" class="p-button-success p-button-text p-button-sm" pTooltip="送審" (click)="submitForApproval(o)"></button>
                  <button pButton icon="pi pi-trash" class="p-button-danger p-button-text p-button-sm" pTooltip="刪除" (click)="deleteOrder(o)"></button>
                }
                @case ('pending') {
                  <button pButton icon="pi pi-check" class="p-button-success p-button-text p-button-sm" pTooltip="核准" (click)="approveOrder(o)"></button>
                  <button pButton icon="pi pi-times" class="p-button-danger p-button-text p-button-sm" pTooltip="退回" (click)="rejectOrder(o)"></button>
                }
                @case ('approved') {
                  <button pButton icon="pi pi-truck" class="p-button-text p-button-sm" pTooltip="下單給供應商" (click)="placeOrder(o)"></button>
                }
                @case ('ordered') {
                  <button pButton icon="pi pi-inbox" class="p-button-text p-button-sm" pTooltip="驗收" (click)="receiveOrder(o)"></button>
                }
                @case ('partial_received') {
                  <button pButton icon="pi pi-inbox" class="p-button-text p-button-sm" pTooltip="繼續驗收" (click)="receiveOrder(o)"></button>
                }
                @default {
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="查看" (click)="viewOrder(o)"></button>
                }
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="rowexpansion" let-o>
          <tr>
            <td colspan="10">
              <div class="order-detail">
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>商品編號</th>
                      <th>商品名稱</th>
                      <th class="text-right">訂購數量</th>
                      <th class="text-right">已收數量</th>
                      <th class="text-right">單價</th>
                      <th class="text-right">小計</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of o.items; track item.product_id) {
                      <tr>
                        <td><span class="product-code">{{ item.product_code }}</span></td>
                        <td>{{ item.product_name }}</td>
                        <td class="text-right">{{ item.quantity }}</td>
                        <td class="text-right" [class.text-success]="item.received_qty === item.quantity" [class.text-warn]="item.received_qty > 0 && item.received_qty < item.quantity">{{ item.received_qty }}</td>
                        <td class="text-right">{{ item.unit_cost | number:'1.0-0' }}</td>
                        <td class="text-right font-semibold">{{ item.subtotal | number:'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (o.remark) {
                  <div class="remark">備註：{{ o.remark }}</div>
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="10" class="text-center p-4">尚無採購單資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 新增/編輯對話框 -->
    <p-dialog [(visible)]="dialogVisible" [header]="editingOrder ? '編輯採購單' : '新增採購單'" [modal]="true" [style]="{width: '700px'}" [closable]="true">
      <div class="form-grid">
        <div class="form-row">
          <label>供應商 <span class="required">*</span></label>
          <p-select [options]="supplierOptions" [(ngModel)]="formData.supplier_id" placeholder="選擇供應商" [style]="{width: '100%'}"></p-select>
        </div>
        <div class="form-row">
          <label>預計到貨日</label>
          <p-datepicker [(ngModel)]="formData.expected_date" dateFormat="yy/mm/dd" [showIcon]="true" [style]="{width: '100%'}"></p-datepicker>
        </div>
        <div class="form-row full">
          <label>備註</label>
          <textarea pTextarea [(ngModel)]="formData.remark" rows="2" [style]="{width: '100%'}"></textarea>
        </div>
        <div class="form-row full">
          <label>訂購商品</label>
          <div class="items-list">
            @for (item of formData.items; track $index) {
              <div class="item-row">
                <p-select [options]="productOptions" [(ngModel)]="item.product_id" placeholder="選擇商品" (onChange)="onProductChange(item)" [style]="{width: '200px'}"></p-select>
                <p-inputNumber [(ngModel)]="item.quantity" [min]="1" placeholder="數量" [style]="{width: '100px'}"></p-inputNumber>
                <p-inputNumber [(ngModel)]="item.unit_cost" [min]="0" placeholder="單價" mode="currency" currency="TWD" locale="zh-TW" [style]="{width: '120px'}"></p-inputNumber>
                <span class="item-subtotal">{{ (item.quantity || 0) * (item.unit_cost || 0) | number:'1.0-0' }}</span>
                <button pButton icon="pi pi-trash" class="p-button-danger p-button-text" (click)="removeItem($index)"></button>
              </div>
            }
            <button pButton label="新增商品" icon="pi pi-plus" class="p-button-text p-button-sm" (click)="addItem()"></button>
          </div>
        </div>
        <div class="form-row full">
          <div class="total-row">
            <span>合計金額：</span>
            <span class="total-amount">{{ calculateTotal() | number:'1.0-0' }}</span>
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" icon="pi pi-check" (click)="saveOrder()"></button>
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
    .stat-card.active .stat-icon { background: var(--blue-100); color: var(--blue-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-semibold { font-weight: 600; }
    .order-no { font-family: monospace; font-weight: 500; color: var(--primary-color); }
    .product-code { font-family: monospace; font-size: 0.875rem; }
    .order-detail { padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .detail-table th, .detail-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--surface-border); }
    .detail-table th { font-weight: 600; color: var(--text-color-secondary); }
    .text-success { color: var(--green-600); }
    .text-warn { color: var(--yellow-700); }
    .remark { margin-top: 1rem; padding: 0.75rem; background: var(--surface-card); border-radius: 4px; font-size: 0.875rem; color: var(--text-color-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-row.full { grid-column: 1 / -1; }
    .form-row label { font-weight: 500; font-size: 0.875rem; }
    .required { color: var(--red-500); }
    .items-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .item-row { display: flex; gap: 0.5rem; align-items: center; }
    .item-subtotal { min-width: 80px; text-align: right; font-weight: 600; }
    .total-row { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
    .total-amount { font-size: 1.25rem; font-weight: 700; color: var(--primary-color); }
  `],
})
export class PurchaseOrderListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  orders = signal<PurchaseOrder[]>([]);
  loading = signal(false);
  stats = signal({ draftCount: 0, pendingCount: 0, activeCount: 0, totalAmount: 0 });
  expandedRows: { [key: number]: boolean } = {};
  dialogVisible = false;
  editingOrder: PurchaseOrder | null = null;
  searchValue = '';
  selectedStatus: OrderStatus | null = null;
  selectedSupplier: number | null = null;

  formData: {
    supplier_id: number | null;
    expected_date: Date | null;
    remark: string;
    items: Array<{ product_id: number | null; product_code: string; product_name: string; quantity: number; unit_cost: number }>;
  } = { supplier_id: null, expected_date: null, remark: '', items: [] };

  statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '待核准', value: 'pending' },
    { label: '已核准', value: 'approved' },
    { label: '已下單', value: 'ordered' },
    { label: '部分到貨', value: 'partial_received' },
    { label: '已完成', value: 'received' },
    { label: '已取消', value: 'cancelled' },
  ];

  supplierOptions = [
    { label: '大統飲料', value: 1 },
    { label: '好吃食品', value: 2 },
    { label: '日用品批發', value: 3 },
    { label: '水源公司', value: 4 },
  ];

  productOptions = [
    { label: 'P001 - 可口可樂 330ml', value: 1, code: 'P001', name: '可口可樂 330ml', cost: 12 },
    { label: 'P002 - 百事可樂 330ml', value: 2, code: 'P002', name: '百事可樂 330ml', cost: 11 },
    { label: 'P003 - 樂事洋芋片', value: 3, code: 'P003', name: '樂事洋芋片', cost: 25 },
    { label: 'P004 - 舒潔衛生紙', value: 4, code: 'P004', name: '舒潔衛生紙', cost: 65 },
    { label: 'P005 - 御茶園綠茶', value: 5, code: 'P005', name: '御茶園綠茶', cost: 15 },
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: PurchaseOrder[] = [
        { id: 1, order_no: 'PO20260119001', supplier_id: 1, supplier_name: '大統飲料', status: 'ordered', items: [
          { product_id: 1, product_code: 'P001', product_name: '可口可樂 330ml', quantity: 200, received_qty: 0, unit_cost: 12, subtotal: 2400 },
          { product_id: 2, product_code: 'P002', product_name: '百事可樂 330ml', quantity: 150, received_qty: 0, unit_cost: 11, subtotal: 1650 },
        ], total_amount: 4050, expected_date: '2026-01-22', created_by: '王採購', created_at: '2026-01-19', approved_by: '張經理', approved_at: '2026-01-19' },
        { id: 2, order_no: 'PO20260118002', supplier_id: 2, supplier_name: '好吃食品', status: 'partial_received', items: [
          { product_id: 3, product_code: 'P003', product_name: '樂事洋芋片', quantity: 100, received_qty: 60, unit_cost: 25, subtotal: 2500 },
        ], total_amount: 2500, expected_date: '2026-01-20', created_by: '王採購', created_at: '2026-01-18', approved_by: '張經理', approved_at: '2026-01-18' },
        { id: 3, order_no: 'PO20260118001', supplier_id: 1, supplier_name: '大統飲料', status: 'received', items: [
          { product_id: 5, product_code: 'P005', product_name: '御茶園綠茶', quantity: 150, received_qty: 150, unit_cost: 15, subtotal: 2250 },
        ], total_amount: 2250, expected_date: '2026-01-19', created_by: '王採購', created_at: '2026-01-18', approved_by: '張經理', approved_at: '2026-01-18' },
        { id: 4, order_no: 'PO20260119002', supplier_id: 3, supplier_name: '日用品批發', status: 'pending', items: [
          { product_id: 4, product_code: 'P004', product_name: '舒潔衛生紙', quantity: 300, received_qty: 0, unit_cost: 65, subtotal: 19500 },
        ], total_amount: 19500, expected_date: '2026-01-25', created_by: '李採購', created_at: '2026-01-19' },
        { id: 5, order_no: 'PO20260119003', supplier_id: 4, supplier_name: '水源公司', status: 'draft', items: [
          { product_id: 7, product_code: 'P007', product_name: '礦泉水 600ml', quantity: 500, received_qty: 0, unit_cost: 5, subtotal: 2500 },
        ], total_amount: 2500, expected_date: '2026-01-21', remark: '急件，儘速處理', created_by: '王採購', created_at: '2026-01-19' },
      ];
      this.orders.set(data);
      this.calculateStats(data);
      this.loading.set(false);
    }, 500);
  }

  calculateStats(data: PurchaseOrder[]): void {
    this.stats.set({
      draftCount: data.filter(o => o.status === 'draft').length,
      pendingCount: data.filter(o => o.status === 'pending').length,
      activeCount: data.filter(o => ['approved', 'ordered', 'partial_received'].includes(o.status)).length,
      totalAmount: data.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0),
    });
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = { draft: '草稿', pending: '待核准', approved: '已核准', ordered: '已下單', partial_received: '部分到貨', received: '已完成', cancelled: '已取消' };
    return labels[status];
  }

  getStatusSeverity(status: OrderStatus): 'secondary' | 'warn' | 'info' | 'success' | 'danger' {
    const severities: Record<OrderStatus, 'secondary' | 'warn' | 'info' | 'success' | 'danger'> = { draft: 'secondary', pending: 'warn', approved: 'info', ordered: 'info', partial_received: 'warn', received: 'success', cancelled: 'danger' };
    return severities[status];
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedStatus = null;
    this.selectedSupplier = null;
  }

  openNewDialog(): void {
    this.editingOrder = null;
    this.formData = { supplier_id: null, expected_date: null, remark: '', items: [{ product_id: null, product_code: '', product_name: '', quantity: 1, unit_cost: 0 }] };
    this.dialogVisible = true;
  }

  editOrder(o: PurchaseOrder): void {
    this.editingOrder = o;
    this.formData = {
      supplier_id: o.supplier_id,
      expected_date: new Date(o.expected_date),
      remark: o.remark || '',
      items: o.items.map(i => ({ product_id: i.product_id, product_code: i.product_code, product_name: i.product_name, quantity: i.quantity, unit_cost: i.unit_cost })),
    };
    this.dialogVisible = true;
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
    this.formData.items.push({ product_id: null, product_code: '', product_name: '', quantity: 1, unit_cost: 0 });
  }

  removeItem(index: number): void {
    this.formData.items.splice(index, 1);
  }

  calculateTotal(): number {
    return this.formData.items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unit_cost || 0), 0);
  }

  saveOrder(): void {
    if (!this.formData.supplier_id || this.formData.items.length === 0) {
      this.messageService.add({ severity: 'warn', summary: '警告', detail: '請填寫必要欄位' });
      return;
    }
    this.dialogVisible = false;
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.editingOrder ? '採購單已更新' : '採購單已建立' });
  }

  submitForApproval(o: PurchaseOrder): void {
    this.orders.update(list => list.map(item => item.id === o.id ? { ...item, status: 'pending' as OrderStatus } : item));
    this.calculateStats(this.orders());
    this.messageService.add({ severity: 'success', summary: '成功', detail: '採購單已送審' });
  }

  approveOrder(o: PurchaseOrder): void {
    this.orders.update(list => list.map(item => item.id === o.id ? { ...item, status: 'approved' as OrderStatus, approved_by: '當前用戶', approved_at: new Date().toISOString() } : item));
    this.calculateStats(this.orders());
    this.messageService.add({ severity: 'success', summary: '成功', detail: '採購單已核准' });
  }

  rejectOrder(o: PurchaseOrder): void {
    this.orders.update(list => list.map(item => item.id === o.id ? { ...item, status: 'draft' as OrderStatus } : item));
    this.calculateStats(this.orders());
    this.messageService.add({ severity: 'info', summary: '提示', detail: '採購單已退回' });
  }

  placeOrder(o: PurchaseOrder): void {
    this.orders.update(list => list.map(item => item.id === o.id ? { ...item, status: 'ordered' as OrderStatus } : item));
    this.calculateStats(this.orders());
    this.messageService.add({ severity: 'success', summary: '成功', detail: '已下單給供應商' });
  }

  receiveOrder(o: PurchaseOrder): void {
    this.messageService.add({ severity: 'info', summary: '提示', detail: '請至驗收管理進行驗收作業' });
  }

  viewOrder(o: PurchaseOrder): void {
    this.expandedRows[o.id] = !this.expandedRows[o.id];
  }

  deleteOrder(o: PurchaseOrder): void {
    this.confirmationService.confirm({
      message: `確定要刪除採購單 ${o.order_no}？`,
      header: '刪除確認',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orders.update(list => list.filter(item => item.id !== o.id));
        this.calculateStats(this.orders());
        this.messageService.add({ severity: 'success', summary: '成功', detail: '採購單已刪除' });
      },
    });
  }
}
