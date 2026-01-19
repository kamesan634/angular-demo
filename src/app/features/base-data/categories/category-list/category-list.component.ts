/**
 * 分類列表頁面元件
 */
import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TreeTableModule } from 'primeng/treetable';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';
import { Category } from '@core/models';

interface CategoryForm {
  id?: number;
  code: string;
  name: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
}

@Component({
  selector: 'app-category-list',
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
    TreeTableModule,
    PageHeaderComponent,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="分類管理"
      subtitle="管理商品分類資料"
      [breadcrumbs]="[{ label: '基礎資料' }, { label: '分類管理' }]"
    >
      <button pButton label="新增分類" icon="pi pi-plus" (click)="openDialog()"></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table
        #dt
        [value]="categories()"
        [paginator]="true"
        [rows]="20"
        [loading]="loading()"
        [rowHover]="true"
        dataKey="id"
        styleClass="p-datatable-sm"
      >
        <ng-template pTemplate="caption">
          <div class="table-header">
            <p-iconField iconPosition="left">
              <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
              <input
                pInputText
                type="text"
                [(ngModel)]="searchValue"
                (input)="onSearch()"
                placeholder="搜尋分類..."
              />
            </p-iconField>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 120px">分類編號</th>
            <th>分類名稱</th>
            <th style="width: 100px">層級</th>
            <th style="width: 100px">排序</th>
            <th style="width: 100px; text-align: center">狀態</th>
            <th style="width: 150px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-category>
          <tr>
            <td>{{ category.code }}</td>
            <td>
              <span [style.padding-left.px]="(category.level - 1) * 20">
                {{ category.name }}
              </span>
            </td>
            <td>第 {{ category.level }} 層</td>
            <td>{{ category.sort_order }}</td>
            <td class="text-center">
              <p-tag
                [value]="category.is_active ? '啟用' : '停用'"
                [severity]="category.is_active ? 'success' : 'danger'"
              ></p-tag>
            </td>
            <td class="text-center">
              <button
                pButton
                icon="pi pi-pencil"
                class="p-button-text p-button-sm"
                (click)="editCategory(category)"
                pTooltip="編輯"
              ></button>
              <button
                pButton
                icon="pi pi-trash"
                class="p-button-text p-button-danger p-button-sm"
                (click)="confirmDelete(category)"
                pTooltip="刪除"
              ></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center p-4">
              尚無分類資料
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 編輯對話框 -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="isEdit ? '編輯分類' : '新增分類'"
      [modal]="true"
      [style]="{ width: '450px' }"
    >
      <div class="form-field">
        <label for="code">分類編號</label>
        <input id="code" pInputText [(ngModel)]="form.code" class="w-full" />
      </div>
      <div class="form-field">
        <label for="name">分類名稱</label>
        <input id="name" pInputText [(ngModel)]="form.name" class="w-full" />
      </div>
      <div class="form-field">
        <label for="sort_order">排序</label>
        <input id="sort_order" pInputText type="number" [(ngModel)]="form.sort_order" class="w-full" />
      </div>
      <div class="form-field">
        <label>
          <input type="checkbox" [(ngModel)]="form.is_active" />
          啟用
        </label>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" (click)="saveCategory()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .card {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1.5rem;
    }
    .table-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .text-center { text-align: center; }
    .form-field {
      margin-bottom: 1rem;
    }
    .form-field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .w-full { width: 100%; }
  `],
})
export class CategoryListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  categories = signal<Category[]>([]);
  loading = signal(false);
  searchValue = '';
  dialogVisible = false;
  isEdit = false;
  form: CategoryForm = this.getEmptyForm();

  ngOnInit(): void {
    this.loadCategories();
  }

  private getEmptyForm(): CategoryForm {
    return { code: '', name: '', sort_order: 0, is_active: true };
  }

  loadCategories(): void {
    this.loading.set(true);
    // 模擬資料
    setTimeout(() => {
      this.categories.set([
        { id: 1, code: 'C01', name: '乳製品', level: 1, sort_order: 1, is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'C02', name: '烘焙食品', level: 1, sort_order: 2, is_active: true, created_at: '', updated_at: '' },
        { id: 3, code: 'C03', name: '飲料', level: 1, sort_order: 3, is_active: true, created_at: '', updated_at: '' },
        { id: 4, code: 'C04', name: '生鮮蔬果', level: 1, sort_order: 4, is_active: true, created_at: '', updated_at: '' },
        { id: 5, code: 'C05', name: '零食點心', level: 1, sort_order: 5, is_active: true, created_at: '', updated_at: '' },
        { id: 6, code: 'C06', name: '冷凍食品', level: 1, sort_order: 6, is_active: false, created_at: '', updated_at: '' },
      ]);
      this.loading.set(false);
    }, 500);
  }

  onSearch(): void {
    // 實作搜尋邏輯
  }

  openDialog(): void {
    this.isEdit = false;
    this.form = this.getEmptyForm();
    this.dialogVisible = true;
  }

  editCategory(category: Category): void {
    this.isEdit = true;
    this.form = { ...category };
    this.dialogVisible = true;
  }

  saveCategory(): void {
    this.messageService.add({
      severity: 'success',
      summary: '成功',
      detail: this.isEdit ? '分類已更新' : '分類已新增',
    });
    this.dialogVisible = false;
    this.loadCategories();
  }

  confirmDelete(category: Category): void {
    this.confirmationService.confirm({
      message: `確定要刪除分類「${category.name}」嗎？`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: '成功',
          detail: `分類「${category.name}」已刪除`,
        });
        this.loadCategories();
      },
    });
  }
}
