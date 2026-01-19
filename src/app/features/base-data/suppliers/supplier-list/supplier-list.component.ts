/**
 * 供應商列表頁面元件
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
import { Supplier } from '@core/models';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ConfirmDialogModule,
    DialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="供應商管理"
      subtitle="管理供應商資料"
      [breadcrumbs]="[{ label: '基礎資料' }, { label: '供應商管理' }]"
    >
      <button pButton label="新增供應商" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="suppliers()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
              <input pInputText [(ngModel)]="searchValue" placeholder="搜尋供應商..." />
            </p-iconField>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 100px">供應商編號</th>
            <th>供應商名稱</th>
            <th style="width: 100px">聯絡人</th>
            <th style="width: 120px">電話</th>
            <th style="width: 180px">Email</th>
            <th style="width: 100px">統一編號</th>
            <th style="width: 80px; text-align: center">付款天數</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-supplier>
          <tr>
            <td>{{ supplier.code }}</td>
            <td>{{ supplier.name }}</td>
            <td>{{ supplier.contact_name || '-' }}</td>
            <td>{{ supplier.phone || '-' }}</td>
            <td>{{ supplier.email || '-' }}</td>
            <td>{{ supplier.tax_id || '-' }}</td>
            <td class="text-center">{{ supplier.payment_terms || '-' }}</td>
            <td class="text-center">
              <p-tag [value]="supplier.is_active ? '啟用' : '停用'" [severity]="supplier.is_active ? 'success' : 'danger'"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editSupplier(supplier)" pTooltip="編輯"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="confirmDelete(supplier)" pTooltip="刪除"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="9" class="text-center p-4">尚無供應商資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="dialogVisible" [header]="isEdit ? '編輯供應商' : '新增供應商'" [modal]="true" [style]="{ width: '550px' }">
      <div class="grid">
        <div class="col-6 form-field">
          <label>供應商編號</label>
          <input pInputText [(ngModel)]="form.code" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>供應商名稱</label>
          <input pInputText [(ngModel)]="form.name" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>聯絡人</label>
          <input pInputText [(ngModel)]="form.contact_name" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>電話</label>
          <input pInputText [(ngModel)]="form.phone" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>Email</label>
          <input pInputText [(ngModel)]="form.email" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>統一編號</label>
          <input pInputText [(ngModel)]="form.tax_id" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>付款天數</label>
          <input pInputText type="number" [(ngModel)]="form.payment_terms" class="w-full" />
        </div>
        <div class="col-12 form-field">
          <label>地址</label>
          <input pInputText [(ngModel)]="form.address" class="w-full" />
        </div>
        <div class="col-12 form-field">
          <label><input type="checkbox" [(ngModel)]="form.is_active" /> 啟用</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" (click)="saveSupplier()"></button>
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
    .grid { display: flex; flex-wrap: wrap; margin: -0.5rem; }
    .col-6 { width: 50%; padding: 0.5rem; box-sizing: border-box; }
    .col-12 { width: 100%; padding: 0.5rem; box-sizing: border-box; }
  `],
})
export class SupplierListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  suppliers = signal<Supplier[]>([]);
  loading = signal(false);
  searchValue = '';
  dialogVisible = false;
  isEdit = false;
  form: Partial<Supplier> = {};

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.suppliers.set([
        { id: 1, code: 'S001', name: '大同食品公司', contact_name: '王經理', phone: '02-12345678', email: 'datong@example.com', tax_id: '12345678', payment_terms: 30, is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'S002', name: '統一物流', contact_name: '李主任', phone: '02-23456789', email: 'uni@example.com', tax_id: '23456789', payment_terms: 45, is_active: true, created_at: '', updated_at: '' },
        { id: 3, code: 'S003', name: '味全食品', contact_name: '陳小姐', phone: '02-34567890', email: 'weichuan@example.com', tax_id: '34567890', payment_terms: 30, is_active: true, created_at: '', updated_at: '' },
        { id: 4, code: 'S004', name: '光泉牧場', contact_name: '林先生', phone: '02-45678901', email: 'kuangchuan@example.com', tax_id: '45678901', payment_terms: 15, is_active: true, created_at: '', updated_at: '' },
        { id: 5, code: 'S005', name: '舊供應商', contact_name: '張經理', phone: '02-56789012', payment_terms: 30, is_active: false, created_at: '', updated_at: '' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  openDialog(): void {
    this.isEdit = false;
    this.form = { is_active: true, payment_terms: 30 };
    this.dialogVisible = true;
  }

  editSupplier(supplier: Supplier): void {
    this.isEdit = true;
    this.form = { ...supplier };
    this.dialogVisible = true;
  }

  saveSupplier(): void {
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.isEdit ? '供應商已更新' : '供應商已新增' });
    this.dialogVisible = false;
    this.loadSuppliers();
  }

  confirmDelete(supplier: Supplier): void {
    this.confirmationService.confirm({
      message: `確定要刪除供應商「${supplier.name}」嗎？`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `供應商「${supplier.name}」已刪除` });
        this.loadSuppliers();
      },
    });
  }
}
