/**
 * 倉庫列表頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';
import { Warehouse } from '@core/models';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ConfirmDialogModule, DialogModule, TooltipModule,
    IconFieldModule, InputIconModule, PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="倉庫管理"
      subtitle="管理倉庫資料"
      [breadcrumbs]="[{ label: '基礎資料' }, { label: '倉庫管理' }]"
    >
      <button pButton label="新增倉庫" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="warehouses()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
              <input pInputText [(ngModel)]="searchValue" placeholder="搜尋倉庫..." />
            </p-iconField>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 100px">倉庫編號</th>
            <th>倉庫名稱</th>
            <th>地址</th>
            <th style="width: 120px">所屬門市</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-warehouse>
          <tr>
            <td>{{ warehouse.code }}</td>
            <td>{{ warehouse.name }}</td>
            <td>{{ warehouse.address || '-' }}</td>
            <td>{{ warehouse.store?.name || '-' }}</td>
            <td class="text-center">
              <p-tag [value]="warehouse.is_active ? '啟用' : '停用'" [severity]="warehouse.is_active ? 'success' : 'danger'"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editWarehouse(warehouse)" pTooltip="編輯"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="confirmDelete(warehouse)" pTooltip="刪除"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6" class="text-center p-4">尚無倉庫資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="dialogVisible" [header]="isEdit ? '編輯倉庫' : '新增倉庫'" [modal]="true" [style]="{ width: '450px' }">
      <div class="form-field">
        <label>倉庫編號</label>
        <input pInputText [(ngModel)]="form.code" class="w-full" />
      </div>
      <div class="form-field">
        <label>倉庫名稱</label>
        <input pInputText [(ngModel)]="form.name" class="w-full" />
      </div>
      <div class="form-field">
        <label>地址</label>
        <input pInputText [(ngModel)]="form.address" class="w-full" />
      </div>
      <div class="form-field">
        <label><input type="checkbox" [(ngModel)]="form.is_active" /> 啟用</label>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" (click)="saveWarehouse()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .table-header { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .text-center { text-align: center; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
  `],
})
export class WarehouseListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  warehouses = signal<Warehouse[]>([]);
  loading = signal(false);
  searchValue = '';
  dialogVisible = false;
  isEdit = false;
  form: Partial<Warehouse> = {};

  ngOnInit(): void {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.warehouses.set([
        { id: 1, code: 'WH001', name: '總倉', address: '台北市中山區中山北路100號', is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'WH002', name: '北區倉庫', address: '新北市板橋區文化路200號', is_active: true, created_at: '', updated_at: '' },
        { id: 3, code: 'WH003', name: '中區倉庫', address: '台中市西屯區台灣大道300號', is_active: true, created_at: '', updated_at: '' },
        { id: 4, code: 'WH004', name: '南區倉庫', address: '高雄市前鎮區中華路400號', is_active: true, created_at: '', updated_at: '' },
        { id: 5, code: 'WH005', name: '舊倉庫', address: '已停用', is_active: false, created_at: '', updated_at: '' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  openDialog(): void {
    this.isEdit = false;
    this.form = { is_active: true };
    this.dialogVisible = true;
  }

  editWarehouse(warehouse: Warehouse): void {
    this.isEdit = true;
    this.form = { ...warehouse };
    this.dialogVisible = true;
  }

  saveWarehouse(): void {
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.isEdit ? '倉庫已更新' : '倉庫已新增' });
    this.dialogVisible = false;
    this.loadWarehouses();
  }

  confirmDelete(warehouse: Warehouse): void {
    this.confirmationService.confirm({
      message: `確定要刪除倉庫「${warehouse.name}」嗎？`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `倉庫「${warehouse.name}」已刪除` });
        this.loadWarehouses();
      },
    });
  }
}
