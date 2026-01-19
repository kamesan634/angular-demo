/**
 * 角色列表頁面元件
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
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';
import { Role } from '@core/models';

interface PermissionGroup {
  name: string;
  permissions: { key: string; label: string; checked: boolean }[];
}

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ConfirmDialogModule, DialogModule, TooltipModule,
    IconFieldModule, InputIconModule, CheckboxModule, TextareaModule, PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="角色管理"
      subtitle="管理系統角色與權限"
      [breadcrumbs]="[{ label: '基礎資料' }, { label: '角色管理' }]"
    >
      <button pButton label="新增角色" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="roles()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>角色名稱</th>
            <th>說明</th>
            <th style="width: 200px">權限數量</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-role>
          <tr>
            <td>
              <span class="font-semibold">{{ role.name }}</span>
            </td>
            <td>{{ role.description || '-' }}</td>
            <td>
              <p-tag [value]="role.permissions.length + ' 項權限'" severity="info"></p-tag>
            </td>
            <td class="text-center">
              <p-tag [value]="role.is_active ? '啟用' : '停用'" [severity]="role.is_active ? 'success' : 'danger'"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editRole(role)" pTooltip="編輯"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="confirmDelete(role)" pTooltip="刪除"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="5" class="text-center p-4">尚無角色資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="dialogVisible" [header]="isEdit ? '編輯角色' : '新增角色'" [modal]="true" [style]="{ width: '650px' }">
      <div class="form-field">
        <label>角色名稱</label>
        <input pInputText [(ngModel)]="form.name" class="w-full" />
      </div>
      <div class="form-field">
        <label>說明</label>
        <textarea pTextarea [(ngModel)]="form.description" class="w-full" rows="2"></textarea>
      </div>
      <div class="form-field">
        <label>權限設定</label>
        <div class="permission-groups">
          @for (group of permissionGroups; track group.name) {
            <div class="permission-group">
              <div class="group-header">{{ group.name }}</div>
              <div class="group-permissions">
                @for (perm of group.permissions; track perm.key) {
                  <label class="permission-item">
                    <p-checkbox [(ngModel)]="perm.checked" [binary]="true"></p-checkbox>
                    <span>{{ perm.label }}</span>
                  </label>
                }
              </div>
            </div>
          }
        </div>
      </div>
      <div class="form-field">
        <label><input type="checkbox" [(ngModel)]="form.is_active" /> 啟用</label>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" (click)="saveRole()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .text-center { text-align: center; }
    .font-semibold { font-weight: 600; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .permission-groups { border: 1px solid var(--surface-border); border-radius: 6px; }
    .permission-group { border-bottom: 1px solid var(--surface-border); }
    .permission-group:last-child { border-bottom: none; }
    .group-header { background: var(--surface-ground); padding: 0.75rem 1rem; font-weight: 600; }
    .group-permissions { padding: 0.75rem 1rem; display: flex; flex-wrap: wrap; gap: 1rem; }
    .permission-item { display: flex; align-items: center; gap: 0.5rem; min-width: 140px; }
  `],
})
export class RoleListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  roles = signal<Role[]>([]);
  loading = signal(false);
  dialogVisible = false;
  isEdit = false;
  form: Partial<Role> = {};
  permissionGroups: PermissionGroup[] = [
    { name: '商品管理', permissions: [
      { key: 'product:read', label: '查看', checked: false },
      { key: 'product:create', label: '新增', checked: false },
      { key: 'product:update', label: '編輯', checked: false },
      { key: 'product:delete', label: '刪除', checked: false },
    ]},
    { name: '訂單管理', permissions: [
      { key: 'order:read', label: '查看', checked: false },
      { key: 'order:create', label: '新增', checked: false },
      { key: 'order:update', label: '編輯', checked: false },
      { key: 'order:cancel', label: '取消', checked: false },
    ]},
    { name: '庫存管理', permissions: [
      { key: 'inventory:read', label: '查看', checked: false },
      { key: 'inventory:adjust', label: '調整', checked: false },
      { key: 'inventory:transfer', label: '調撥', checked: false },
      { key: 'inventory:count', label: '盤點', checked: false },
    ]},
    { name: '報表查詢', permissions: [
      { key: 'report:sales', label: '銷售報表', checked: false },
      { key: 'report:inventory', label: '庫存報表', checked: false },
      { key: 'report:financial', label: '財務報表', checked: false },
    ]},
    { name: '系統管理', permissions: [
      { key: 'system:user', label: '使用者管理', checked: false },
      { key: 'system:role', label: '角色管理', checked: false },
      { key: 'system:settings', label: '系統設定', checked: false },
    ]},
  ];

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.roles.set([
        { id: 1, name: '管理員', description: '系統管理員，擁有所有權限', permissions: ['product:read', 'product:create', 'product:update', 'product:delete', 'order:read', 'order:create', 'order:update', 'order:cancel', 'inventory:read', 'inventory:adjust', 'inventory:transfer', 'inventory:count', 'report:sales', 'report:inventory', 'report:financial', 'system:user', 'system:role', 'system:settings'], is_active: true, created_at: '', updated_at: '' },
        { id: 2, name: '店長', description: '門市店長，管理門市營運', permissions: ['product:read', 'order:read', 'order:create', 'order:update', 'inventory:read', 'inventory:adjust', 'report:sales', 'report:inventory'], is_active: true, created_at: '', updated_at: '' },
        { id: 3, name: '收銀員', description: '門市收銀人員', permissions: ['product:read', 'order:read', 'order:create'], is_active: true, created_at: '', updated_at: '' },
        { id: 4, name: '倉管人員', description: '倉庫管理人員', permissions: ['product:read', 'inventory:read', 'inventory:adjust', 'inventory:transfer', 'inventory:count'], is_active: true, created_at: '', updated_at: '' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  openDialog(): void {
    this.isEdit = false;
    this.form = { is_active: true };
    this.resetPermissions();
    this.dialogVisible = true;
  }

  editRole(role: Role): void {
    this.isEdit = true;
    this.form = { ...role };
    this.resetPermissions();
    role.permissions.forEach(perm => {
      this.permissionGroups.forEach(group => {
        const found = group.permissions.find(p => p.key === perm);
        if (found) found.checked = true;
      });
    });
    this.dialogVisible = true;
  }

  resetPermissions(): void {
    this.permissionGroups.forEach(group => {
      group.permissions.forEach(perm => perm.checked = false);
    });
  }

  saveRole(): void {
    const selectedPermissions: string[] = [];
    this.permissionGroups.forEach(group => {
      group.permissions.forEach(perm => {
        if (perm.checked) selectedPermissions.push(perm.key);
      });
    });
    this.form.permissions = selectedPermissions;
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.isEdit ? '角色已更新' : '角色已新增' });
    this.dialogVisible = false;
    this.loadRoles();
  }

  confirmDelete(role: Role): void {
    this.confirmationService.confirm({
      message: `確定要刪除角色「${role.name}」嗎？`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `角色「${role.name}」已刪除` });
        this.loadRoles();
      },
    });
  }
}
