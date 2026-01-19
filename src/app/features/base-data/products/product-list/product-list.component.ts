/**
 * 商品列表頁面元件
 */
import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';
import { ProductService } from '@core/services';
import { Product, Category, PaginatedResponse } from '@core/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    PageHeaderComponent,
    CurrencyPipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      title="商品管理"
      subtitle="管理所有商品資料"
      [breadcrumbs]="[{ label: '基礎資料' }, { label: '商品管理' }]"
    >
      <button
        pButton
        label="新增商品"
        icon="pi pi-plus"
        routerLink="create"
      ></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    <div class="card">
      <p-table
        #dt
        [value]="products()"
        [lazy]="true"
        [paginator]="true"
        [rows]="pageSize"
        [totalRecords]="totalRecords()"
        [loading]="loading()"
        [rowsPerPageOptions]="[10, 20, 50, 100]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="顯示 {first} 至 {last} 筆，共 {totalRecords} 筆"
        [globalFilterFields]="['code', 'name', 'barcode']"
        (onLazyLoad)="loadProducts($event)"
        [rowHover]="true"
        dataKey="id"
        styleClass="p-datatable-sm"
      >
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="table-header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input
                  pInputText
                  type="text"
                  [(ngModel)]="searchValue"
                  (input)="onSearch($event)"
                  placeholder="搜尋商品編號、名稱、條碼..."
                />
              </p-iconField>

              <p-select
                [options]="statusOptions"
                [(ngModel)]="selectedStatus"
                (onChange)="onFilterChange()"
                placeholder="狀態"
                [showClear]="true"
              ></p-select>
            </div>

            <div class="table-header-right">
              <button
                pButton
                icon="pi pi-download"
                label="匯出"
                class="p-button-outlined"
                (click)="exportProducts()"
              ></button>
              <button
                pButton
                icon="pi pi-upload"
                label="匯入"
                class="p-button-outlined"
                (click)="importProducts()"
              ></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="code" style="width: 120px">
              商品編號
              <p-sortIcon field="code"></p-sortIcon>
            </th>
            <th pSortableColumn="name">
              商品名稱
              <p-sortIcon field="name"></p-sortIcon>
            </th>
            <th style="width: 150px">分類</th>
            <th pSortableColumn="cost_price" style="width: 120px; text-align: right">
              成本價
              <p-sortIcon field="cost_price"></p-sortIcon>
            </th>
            <th pSortableColumn="selling_price" style="width: 120px; text-align: right">
              售價
              <p-sortIcon field="selling_price"></p-sortIcon>
            </th>
            <th style="width: 100px; text-align: center">狀態</th>
            <th style="width: 150px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-product>
          <tr>
            <td>
              <a [routerLink]="[product.id]" class="product-code">{{ product.code }}</a>
            </td>
            <td>
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
                @if (product.barcode) {
                  <small class="product-barcode">條碼: {{ product.barcode }}</small>
                }
              </div>
            </td>
            <td>{{ product.category?.name || '-' }}</td>
            <td class="text-right">{{ product.cost_price | currency:'TWD':'symbol':'1.0-0' }}</td>
            <td class="text-right">{{ product.selling_price | currency:'TWD':'symbol':'1.0-0' }}</td>
            <td class="text-center">
              <p-tag
                [value]="product.is_active ? '啟用' : '停用'"
                [severity]="product.is_active ? 'success' : 'danger'"
              ></p-tag>
            </td>
            <td class="text-center">
              <button
                pButton
                icon="pi pi-pencil"
                class="p-button-text p-button-sm"
                [routerLink]="[product.id, 'edit']"
                pTooltip="編輯"
              ></button>
              <button
                pButton
                icon="pi pi-copy"
                class="p-button-text p-button-sm"
                (click)="duplicateProduct(product)"
                pTooltip="複製"
              ></button>
              <button
                pButton
                icon="pi pi-trash"
                class="p-button-text p-button-danger p-button-sm"
                (click)="confirmDelete(product)"
                pTooltip="刪除"
              ></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="text-center p-4">
              @if (searchValue || selectedStatus) {
                查無符合條件的商品
              } @else {
                尚無商品資料，請點擊「新增商品」按鈕新增
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
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
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .table-header-left,
    .table-header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .product-code {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .product-info {
      display: flex;
      flex-direction: column;
    }

    .product-name {
      font-weight: 500;
    }

    .product-barcode {
      color: var(--text-color-secondary);
      font-size: 0.75rem;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }
  `],
})
export class ProductListComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  private readonly productService = inject(ProductService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  products = signal<Product[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  pageSize = 20;

  searchValue = '';
  selectedStatus: boolean | null = null;

  statusOptions = [
    { label: '啟用', value: true },
    { label: '停用', value: false },
  ];

  ngOnInit(): void {
    // 初始載入由 table 的 lazy load 觸發
  }

  loadProducts(event: TableLazyLoadEvent): void {
    this.loading.set(true);

    const params: Record<string, unknown> = {
      page: event.first !== undefined && event.rows ? Math.floor(event.first / event.rows) + 1 : 1,
      page_size: event.rows || this.pageSize,
    };

    if (event.sortField) {
      params['sort_by'] = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
      params['sort_order'] = event.sortOrder === 1 ? 'asc' : 'desc';
    }

    if (this.searchValue) {
      params['search'] = this.searchValue;
    }

    if (this.selectedStatus !== null) {
      params['is_active'] = this.selectedStatus;
    }

    this.productService.getList(params as any).subscribe({
      next: (response: PaginatedResponse<Product>) => {
        this.products.set(response.items);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // 使用模擬資料
        this.loadMockData();
      },
    });
  }

  private loadMockData(): void {
    // 模擬資料供開發測試用
    const mockProducts: Product[] = [
      {
        id: 1, code: 'P001', barcode: '4710088012345', name: '有機鮮奶 1L',
        category: { id: 1, code: 'C01', name: '乳製品', level: 1, sort_order: 1, is_active: true, created_at: '', updated_at: '' },
        cost_price: 55, selling_price: 70, is_active: true, is_combo: false, created_at: '', updated_at: ''
      },
      {
        id: 2, code: 'P002', barcode: '4710088012346', name: '法式吐司麵包',
        category: { id: 2, code: 'C02', name: '烘焙食品', level: 1, sort_order: 2, is_active: true, created_at: '', updated_at: '' },
        cost_price: 35, selling_price: 50, is_active: true, is_combo: false, created_at: '', updated_at: ''
      },
      {
        id: 3, code: 'P003', barcode: '4710088012347', name: '經典美式咖啡',
        category: { id: 3, code: 'C03', name: '飲料', level: 1, sort_order: 3, is_active: true, created_at: '', updated_at: '' },
        cost_price: 30, selling_price: 50, is_active: true, is_combo: false, created_at: '', updated_at: ''
      },
      {
        id: 4, code: 'P004', name: '停售商品範例',
        cost_price: 100, selling_price: 150, is_active: false, is_combo: false, created_at: '', updated_at: ''
      },
    ];

    this.products.set(mockProducts);
    this.totalRecords.set(mockProducts.length);
  }

  onSearch(event: Event): void {
    // 延遲搜尋，避免過於頻繁的 API 呼叫
    clearTimeout((this as any).searchTimeout);
    (this as any).searchTimeout = setTimeout(() => {
      this.table.reset();
    }, 300);
  }

  onFilterChange(): void {
    this.table.reset();
  }

  confirmDelete(product: Product): void {
    this.confirmationService.confirm({
      message: `確定要刪除商品「${product.name}」嗎？此操作無法復原。`,
      header: '確認刪除',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除',
      rejectLabel: '取消',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteProduct(product);
      },
    });
  }

  private deleteProduct(product: Product): void {
    this.productService.delete(product.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: '成功',
          detail: `商品「${product.name}」已刪除`,
        });
        this.table.reset();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: '錯誤',
          detail: '刪除失敗，請稍後再試',
        });
      },
    });
  }

  duplicateProduct(product: Product): void {
    // TODO: 實作複製商品功能
    this.messageService.add({
      severity: 'info',
      summary: '提示',
      detail: '複製功能開發中',
    });
  }

  exportProducts(): void {
    // TODO: 實作匯出功能
    this.messageService.add({
      severity: 'info',
      summary: '提示',
      detail: '匯出功能開發中',
    });
  }

  importProducts(): void {
    // TODO: 實作匯入功能
    this.messageService.add({
      severity: 'info',
      summary: '提示',
      detail: '匯入功能開發中',
    });
  }
}
