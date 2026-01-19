/**
 * 門市列表頁面元件
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
import { Store } from '@core/models';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ConfirmDialogModule, DialogModule, TooltipModule,
    IconFieldModule, InputIconModule, PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="門市管理"
      subtitle="管理門市資料"
      [breadcrumbs]="[{ label: '基礎資料' }, { label: '門市管理' }]"
    >
      <button pButton label="新增門市" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table [value]="stores()" [paginator]="true" [rows]="20" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
              <input pInputText [(ngModel)]="searchValue" placeholder="搜尋門市..." />
            </p-iconField>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 100px">門市編號</th>
            <th>門市名稱</th>
            <th>地址</th>
            <th style="width: 120px">電話</th>
            <th style="width: 180px">Email</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 120px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-store>
          <tr>
            <td>{{ store.code }}</td>
            <td>{{ store.name }}</td>
            <td>{{ store.address || '-' }}</td>
            <td>{{ store.phone || '-' }}</td>
            <td>{{ store.email || '-' }}</td>
            <td class="text-center">
              <p-tag [value]="store.is_active ? '營業中' : '停業'" [severity]="store.is_active ? 'success' : 'danger'"></p-tag>
            </td>
            <td class="text-center">
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editStore(store)" pTooltip="編輯"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="confirmDelete(store)" pTooltip="刪除"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7" class="text-center p-4">尚無門市資料</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="dialogVisible" [header]="isEdit ? '編輯門市' : '新增門市'" [modal]="true" [style]="{ width: '500px' }">
      <div class="grid">
        <div class="col-6 form-field">
          <label>門市編號</label>
          <input pInputText [(ngModel)]="form.code" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>門市名稱</label>
          <input pInputText [(ngModel)]="form.name" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>電話</label>
          <input pInputText [(ngModel)]="form.phone" class="w-full" />
        </div>
        <div class="col-6 form-field">
          <label>Email</label>
          <input pInputText [(ngModel)]="form.email" class="w-full" />
        </div>
        <div class="col-12 form-field">
          <label>地址</label>
          <input pInputText [(ngModel)]="form.address" class="w-full" />
        </div>
        <div class="col-12 form-field">
          <label><input type="checkbox" [(ngModel)]="form.is_active" /> 營業中</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" (click)="saveStore()"></button>
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
export class StoreListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  stores = signal<Store[]>([]);
  loading = signal(false);
  searchValue = '';
  dialogVisible = false;
  isEdit = false;
  form: Partial<Store> = {};

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.stores.set([
        { id: 1, code: 'ST001', name: '台北旗艦店', address: '台北市信義區忠孝東路100號', phone: '02-27001234', email: 'taipei@example.com', is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'ST002', name: '新北板橋店', address: '新北市板橋區中山路200號', phone: '02-29001234', email: 'banqiao@example.com', is_active: true, created_at: '', updated_at: '' },
        { id: 3, code: 'ST003', name: '台中逢甲店', address: '台中市西屯區福星路300號', phone: '04-27001234', email: 'taichung@example.com', is_active: true, created_at: '', updated_at: '' },
        { id: 4, code: 'ST004', name: '高雄巨蛋店', address: '高雄市左營區博愛路400號', phone: '07-55001234', email: 'kaohsiung@example.com', is_active: true, created_at: '', updated_at: '' },
        { id: 5, code: 'ST005', name: '桃園中壢店', address: '桃園市中壢區中央路500號', phone: '03-42001234', is_active: false, created_at: '', updated_at: '' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  openDialog(): void {
    this.isEdit = false;
    this.form = { is_active: true };
    this.dialogVisible = true;
  }

  editStore(store: Store): void {
    this.isEdit = true;
    this.form = { ...store };
    this.dialogVisible = true;
  }

  saveStore(): void {
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.isEdit ? '門市已更新' : '門市已新增' });
    this.dialogVisible = false;
    this.loadStores();
  }

  confirmDelete(store: Store): void {
    this.confirmationService.confirm({
      message: `確定要刪除門市「${store.name}」嗎？`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: '成功', detail: `門市「${store.name}」已刪除` });
        this.loadStores();
      },
    });
  }
}
