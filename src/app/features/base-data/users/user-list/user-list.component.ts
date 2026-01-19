/**
 * 使用者列表頁面元件
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
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';
import { User, Role } from '@core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ConfirmDialogModule, DialogModule, TooltipModule,
    IconFieldModule, InputIconModule, MultiSelectModule, PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="使用者管理"
      subtitle="管理系統使用者"
      [breadcrumbs]="[{ label: '基礎資料' }, { label: '使用者管理' }]"
    >
      <button pButton label="新增使用者" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="users()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
              <input pInputText [(ngModel)]="searchValue" placeholder="搜尋使用者..." />
            </p-iconField>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 120px">帳號</th>
            <th>姓名</th>
            <th style="width: 200px">Email</th>
            <th style="width: 150px">角色</th>
            <th style="width: 100px">所屬門市</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-user>
          <tr>
            <td>
              {{ user.username }}
              @if (user.is_superuser) {
                <i class="pi pi-star-fill text-warning" pTooltip="超級管理員"></i>
              }
            </td>
            <td>{{ user.full_name }}</td>
            <td>{{ user.email }}</td>
            <td>
              @for (role of user.roles; track role.id) {
                <p-tag [value]="role.name" severity="info" styleClass="mr-1"></p-tag>
              }
            </td>
            <td>{{ user.store?.name || '-' }}</td>
            <td class="text-center">
              <p-tag [value]="user.is_active ? '啟用' : '停用'" [severity]="user.is_active ? 'success' : 'danger'"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editUser(user)" pTooltip="編輯"></button>
              <button pButton icon="pi pi-key" class="p-button-text p-button-sm" (click)="resetPassword(user)" pTooltip="重設密碼"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="confirmDelete(user)" pTooltip="刪除" [disabled]="user.is_superuser"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7" class="text-center p-4">尚無使用者資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="dialogVisible" [header]="isEdit ? '編輯使用者' : '新增使用者'" [modal]="true" [style]="{ width: '500px' }">
      <div class="grid">
        <div class="col-6 form-field">
          <label>帳號</label>
          <input pInputText [(ngModel)]="form.username" class="w-full" [disabled]="isEdit" />
        </div>
        <div class="col-6 form-field">
          <label>姓名</label>
          <input pInputText [(ngModel)]="form.full_name" class="w-full" />
        </div>
        <div class="col-12 form-field">
          <label>Email</label>
          <input pInputText [(ngModel)]="form.email" class="w-full" type="email" />
        </div>
        @if (!isEdit) {
          <div class="col-12 form-field">
            <label>密碼</label>
            <input pInputText [(ngModel)]="form.password" class="w-full" type="password" />
          </div>
        }
        <div class="col-12 form-field">
          <label>角色</label>
          <p-multiSelect [options]="roleOptions" [(ngModel)]="selectedRoles" optionLabel="name" placeholder="選擇角色" styleClass="w-full"></p-multiSelect>
        </div>
        <div class="col-6 form-field">
          <label><input type="checkbox" [(ngModel)]="form.is_active" /> 啟用</label>
        </div>
        <div class="col-6 form-field">
          <label><input type="checkbox" [(ngModel)]="form.is_superuser" /> 超級管理員</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" (click)="saveUser()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .table-header { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .text-center { text-align: center; }
    .text-warning { color: #f59e0b; margin-left: 0.25rem; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .mr-1 { margin-right: 0.25rem; }
    .grid { display: flex; flex-wrap: wrap; margin: -0.5rem; }
    .col-6 { width: 50%; padding: 0.5rem; box-sizing: border-box; }
    .col-12 { width: 100%; padding: 0.5rem; box-sizing: border-box; }
  `],
})
export class UserListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  users = signal<User[]>([]);
  loading = signal(false);
  searchValue = '';
  dialogVisible = false;
  isEdit = false;
  form: Partial<User & { password?: string }> = {};
  selectedRoles: Role[] = [];
  roleOptions: Role[] = [
    { id: 1, name: '管理員', permissions: [], is_active: true, created_at: '', updated_at: '' },
    { id: 2, name: '店長', permissions: [], is_active: true, created_at: '', updated_at: '' },
    { id: 3, name: '收銀員', permissions: [], is_active: true, created_at: '', updated_at: '' },
    { id: 4, name: '倉管人員', permissions: [], is_active: true, created_at: '', updated_at: '' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.users.set([
        { id: 1, username: 'admin', full_name: '系統管理員', email: 'admin@example.com', is_active: true, is_superuser: true, roles: [{ id: 1, name: '管理員', permissions: [], is_active: true, created_at: '', updated_at: '' }], created_at: '', updated_at: '' },
        { id: 2, username: 'manager01', full_name: '王店長', email: 'wang@example.com', is_active: true, is_superuser: false, roles: [{ id: 2, name: '店長', permissions: [], is_active: true, created_at: '', updated_at: '' }], created_at: '', updated_at: '' },
        { id: 3, username: 'cashier01', full_name: '李收銀', email: 'lee@example.com', is_active: true, is_superuser: false, roles: [{ id: 3, name: '收銀員', permissions: [], is_active: true, created_at: '', updated_at: '' }], created_at: '', updated_at: '' },
        { id: 4, username: 'warehouse01', full_name: '張倉管', email: 'chang@example.com', is_active: true, is_superuser: false, roles: [{ id: 4, name: '倉管人員', permissions: [], is_active: true, created_at: '', updated_at: '' }], created_at: '', updated_at: '' },
        { id: 5, username: 'inactive', full_name: '已停用帳號', email: 'inactive@example.com', is_active: false, is_superuser: false, roles: [], created_at: '', updated_at: '' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  openDialog(): void {
    this.isEdit = false;
    this.form = { is_active: true, is_superuser: false };
    this.selectedRoles = [];
    this.dialogVisible = true;
  }

  editUser(user: User): void {
    this.isEdit = true;
    this.form = { ...user };
    this.selectedRoles = [...user.roles];
    this.dialogVisible = true;
  }

  saveUser(): void {
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.isEdit ? '使用者已更新' : '使用者已新增' });
    this.dialogVisible = false;
    this.loadUsers();
  }

  resetPassword(user: User): void {
    this.confirmationService.confirm({
      message: `確定要重設「${user.full_name}」的密碼嗎？`,
      header: '重設密碼',
      icon: 'pi pi-key',
      acceptLabel: '確定',
      rejectLabel: '取消',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: '密碼已重設，新密碼已發送至使用者信箱' });
      },
    });
  }

  confirmDelete(user: User): void {
    this.confirmationService.confirm({
      message: `確定要刪除使用者「${user.full_name}」嗎？`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `使用者「${user.full_name}」已刪除` });
        this.loadUsers();
      },
    });
  }
}
