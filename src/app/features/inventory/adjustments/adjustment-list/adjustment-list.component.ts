/**
 * 庫存調整列表頁面元件
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

type AdjustmentType = 'increase' | 'decrease' | 'damage' | 'expired' | 'correction';
type AdjustmentStatus = 'pending' | 'approved' | 'rejected' | 'completed';

interface Adjustment {
  id: number;
  adjustment_no: string;
  warehouse_name: string;
  warehouse_id: number;
  type: AdjustmentType;
  status: AdjustmentStatus;
  items_count: number;
  total_quantity: number;
  reason: string;
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

@Component({
  selector: 'app-adjustment-list',
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
      title="庫存調整"
      subtitle="調整庫存數量"
      [breadcrumbs]="[{ label: '庫存管理' }, { label: '庫存調整' }]"
    >
      <button pButton label="新增調整單" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="adjustments()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋調整單號..." />
              </p-iconField>
              <p-select [options]="typeOptions" [(ngModel)]="selectedType" placeholder="調整類型" [showClear]="true"></p-select>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-download" label="匯出" class="p-button-outlined"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 130px">調整單號</th>
            <th style="width: 100px">倉庫</th>
            <th style="width: 100px">調整類型</th>
            <th style="width: 80px; text-align: center">項目數</th>
            <th style="width: 100px; text-align: right">調整數量</th>
            <th>原因說明</th>
            <th style="width: 100px">建立者</th>
            <th style="width: 140px">建立時間</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-adj>
          <tr>
            <td><span class="adjustment-no">{{ adj.adjustment_no }}</span></td>
            <td>{{ adj.warehouse_name }}</td>
            <td><p-tag [value]="getTypeLabel(adj.type)" [severity]="getTypeSeverity(adj.type)"></p-tag></td>
            <td class="text-center">{{ adj.items_count }}</td>
            <td class="text-right" [class.text-success]="adj.total_quantity > 0" [class.text-danger]="adj.total_quantity < 0">
              {{ adj.total_quantity > 0 ? '+' : '' }}{{ adj.total_quantity }}
            </td>
            <td>{{ adj.reason }}</td>
            <td>{{ adj.created_by }}</td>
            <td>{{ adj.created_at | date:'yyyy/MM/dd HH:mm' }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(adj.status)" [severity]="getStatusSeverity(adj.status)"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" (click)="viewDetail(adj)" pTooltip="檢視"></button>
              @if (adj.status === 'pending') {
                <button pButton icon="pi pi-check" class="p-button-text p-button-success p-button-sm" (click)="approveAdjustment(adj)" pTooltip="核准"></button>
                <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" (click)="rejectAdjustment(adj)" pTooltip="駁回"></button>
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="10" class="text-center p-4">尚無調整單資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 新增調整單對話框 -->
    <p-dialog [(visible)]="dialogVisible" header="新增庫存調整單" [modal]="true" [style]="{ width: '650px' }">
      <div class="grid">
        <div class="col-6 form-field">
          <label>倉庫</label>
          <p-select [options]="warehouseOptions" [(ngModel)]="form.warehouse_id" placeholder="選擇倉庫" class="w-full"></p-select>
        </div>
        <div class="col-6 form-field">
          <label>調整類型</label>
          <p-select [options]="typeOptions" [(ngModel)]="form.type" class="w-full"></p-select>
        </div>
        <div class="col-12 form-field">
          <label>調整原因</label>
          <textarea pTextarea [(ngModel)]="form.reason" class="w-full" rows="2" placeholder="請說明調整原因"></textarea>
        </div>
      </div>

      <div class="items-section">
        <div class="items-header">
          <h4>調整項目</h4>
          <button pButton label="新增項目" icon="pi pi-plus" class="p-button-sm p-button-outlined" (click)="addItem()"></button>
        </div>
        <p-table [value]="formItems" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>商品</th>
              <th style="width: 120px">調整數量</th>
              <th style="width: 60px"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item let-i="rowIndex">
            <tr>
              <td>
                <p-select [options]="productOptions" [(ngModel)]="item.product_id" placeholder="選擇商品" class="w-full"></p-select>
              </td>
              <td>
                <p-inputNumber [(ngModel)]="item.quantity" class="w-full" [showButtons]="true"></p-inputNumber>
              </td>
              <td>
                <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="removeItem(i)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="3" class="text-center p-3">請新增調整項目</td></tr>
          </ng-template>
        </p-table>
      </div>

      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="提交" (click)="submitAdjustment()"></button>
      </ng-template>
    </p-dialog>

    <!-- 詳情對話框 -->
    <p-dialog [(visible)]="detailVisible" header="調整單詳情" [modal]="true" [style]="{ width: '600px' }">
      @if (selectedAdjustment) {
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">調整單號</span>
            <span class="value">{{ selectedAdjustment.adjustment_no }}</span>
          </div>
          <div class="detail-item">
            <span class="label">倉庫</span>
            <span class="value">{{ selectedAdjustment.warehouse_name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">調整類型</span>
            <span class="value"><p-tag [value]="getTypeLabel(selectedAdjustment.type)" [severity]="getTypeSeverity(selectedAdjustment.type)"></p-tag></span>
          </div>
          <div class="detail-item">
            <span class="label">狀態</span>
            <span class="value"><p-tag [value]="getStatusLabel(selectedAdjustment.status)" [severity]="getStatusSeverity(selectedAdjustment.status)"></p-tag></span>
          </div>
          <div class="detail-item full-width">
            <span class="label">原因說明</span>
            <span class="value">{{ selectedAdjustment.reason }}</span>
          </div>
          <div class="detail-item">
            <span class="label">建立者</span>
            <span class="value">{{ selectedAdjustment.created_by }}</span>
          </div>
          <div class="detail-item">
            <span class="label">建立時間</span>
            <span class="value">{{ selectedAdjustment.created_at | date:'yyyy/MM/dd HH:mm' }}</span>
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
    .text-success { color: var(--green-600); font-weight: 600; }
    .text-danger { color: var(--red-600); font-weight: 600; }
    .adjustment-no { font-family: monospace; font-weight: 600; color: var(--primary-color); }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .grid { display: flex; flex-wrap: wrap; margin: -0.5rem; }
    .col-6 { width: 50%; padding: 0.5rem; box-sizing: border-box; }
    .col-12 { width: 100%; padding: 0.5rem; box-sizing: border-box; }
    .items-section { margin-top: 1rem; border-top: 1px solid var(--surface-border); padding-top: 1rem; }
    .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .items-header h4 { margin: 0; font-size: 1rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-item .label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .detail-item .value { font-weight: 500; }
  `],
})
export class AdjustmentListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  adjustments = signal<Adjustment[]>([]);
  loading = signal(false);
  searchValue = '';
  selectedType: AdjustmentType | null = null;
  selectedStatus: AdjustmentStatus | null = null;
  dialogVisible = false;
  detailVisible = false;
  selectedAdjustment: Adjustment | null = null;
  form: { warehouse_id: number | null; type: AdjustmentType; reason: string } = { warehouse_id: null, type: 'correction', reason: '' };
  formItems: { product_id: number | null; quantity: number }[] = [];

  typeOptions = [
    { label: '增加', value: 'increase' },
    { label: '減少', value: 'decrease' },
    { label: '報損', value: 'damage' },
    { label: '過期', value: 'expired' },
    { label: '盤點校正', value: 'correction' },
  ];

  statusOptions = [
    { label: '待審核', value: 'pending' },
    { label: '已核准', value: 'approved' },
    { label: '已駁回', value: 'rejected' },
    { label: '已完成', value: 'completed' },
  ];

  warehouseOptions = [
    { label: '總倉', value: 1 },
    { label: '北區倉庫', value: 2 },
    { label: '中區倉庫', value: 3 },
  ];

  productOptions = [
    { label: 'P001 - 可口可樂 330ml', value: 1 },
    { label: 'P002 - 百事可樂 330ml', value: 2 },
    { label: 'P003 - 樂事洋芋片', value: 3 },
    { label: 'P004 - 舒潔衛生紙', value: 4 },
  ];

  ngOnInit(): void {
    this.loadAdjustments();
  }

  loadAdjustments(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.adjustments.set([
        { id: 1, adjustment_no: 'ADJ20260119001', warehouse_id: 1, warehouse_name: '總倉', type: 'damage', status: 'completed', items_count: 2, total_quantity: -15, reason: '商品包裝破損', created_by: '張倉管', created_at: '2026-01-19T09:30:00', approved_by: '王店長', approved_at: '2026-01-19T10:00:00' },
        { id: 2, adjustment_no: 'ADJ20260119002', warehouse_id: 1, warehouse_name: '總倉', type: 'expired', status: 'pending', items_count: 3, total_quantity: -28, reason: '商品過期需報廢', created_by: '張倉管', created_at: '2026-01-19T14:15:00' },
        { id: 3, adjustment_no: 'ADJ20260118001', warehouse_id: 2, warehouse_name: '北區倉庫', type: 'correction', status: 'completed', items_count: 5, total_quantity: 12, reason: '盤點後庫存校正', created_by: '李倉管', created_at: '2026-01-18T16:00:00', approved_by: '王店長', approved_at: '2026-01-18T17:30:00' },
        { id: 4, adjustment_no: 'ADJ20260117001', warehouse_id: 1, warehouse_name: '總倉', type: 'increase', status: 'rejected', items_count: 1, total_quantity: 50, reason: '發現多出庫存', created_by: '張倉管', created_at: '2026-01-17T11:00:00' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  getTypeLabel(type: AdjustmentType): string {
    const labels: Record<AdjustmentType, string> = { increase: '增加', decrease: '減少', damage: '報損', expired: '過期', correction: '盤點校正' };
    return labels[type] || type;
  }

  getTypeSeverity(type: AdjustmentType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<AdjustmentType, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = { increase: 'success', decrease: 'danger', damage: 'warn', expired: 'warn', correction: 'info' };
    return severities[type] || 'info';
  }

  getStatusLabel(status: AdjustmentStatus): string {
    const labels: Record<AdjustmentStatus, string> = { pending: '待審核', approved: '已核准', rejected: '已駁回', completed: '已完成' };
    return labels[status] || status;
  }

  getStatusSeverity(status: AdjustmentStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<AdjustmentStatus, 'success' | 'warn' | 'danger' | 'secondary'> = { pending: 'warn', approved: 'success', rejected: 'danger', completed: 'secondary' };
    return severities[status] || 'info';
  }

  openDialog(): void {
    this.form = { warehouse_id: null, type: 'correction', reason: '' };
    this.formItems = [];
    this.dialogVisible = true;
  }

  addItem(): void {
    this.formItems.push({ product_id: null, quantity: 0 });
  }

  removeItem(index: number): void {
    this.formItems.splice(index, 1);
  }

  submitAdjustment(): void {
    if (!this.form.warehouse_id || this.formItems.length === 0) {
      this.messageService.add({ severity: 'warn', summary: '提示', detail: '請填寫完整資料並新增調整項目' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: '成功', detail: '調整單已提交審核' });
    this.dialogVisible = false;
    this.loadAdjustments();
  }

  viewDetail(adj: Adjustment): void {
    this.selectedAdjustment = adj;
    this.detailVisible = true;
  }

  approveAdjustment(adj: Adjustment): void {
    this.confirmationService.confirm({
      message: `確定要核准調整單「${adj.adjustment_no}」嗎？`,
      header: '確認核准',
      icon: 'pi pi-check-circle',
      acceptLabel: '確定',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `調整單 ${adj.adjustment_no} 已核准` });
        this.loadAdjustments();
      },
    });
  }

  rejectAdjustment(adj: Adjustment): void {
    this.confirmationService.confirm({
      message: `確定要駁回調整單「${adj.adjustment_no}」嗎？`,
      header: '確認駁回',
      icon: 'pi pi-times-circle',
      acceptLabel: '駁回',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `調整單 ${adj.adjustment_no} 已駁回` });
        this.loadAdjustments();
      },
    });
  }
}
