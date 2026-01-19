/**
 * 通用資料表格元件
 * 封裝 PrimeNG Table，提供統一的分頁、排序、篩選功能
 */
import {
  Component,
  input,
  output,
  computed,
  ContentChildren,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginationState, PageEvent, SortEvent, TableQueryParams } from '@core/models';

/**
 * 欄位定義
 */
export interface ColumnDefinition {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'custom';
  format?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
  ],
  template: `
    <div class="data-table-container">
      <!-- 工具列 -->
      @if (showToolbar()) {
        <div class="table-toolbar">
          <div class="toolbar-left">
            <!-- 全域搜尋 -->
            @if (showGlobalFilter()) {
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input
                  pInputText
                  type="text"
                  [placeholder]="searchPlaceholder()"
                  [(ngModel)]="globalFilterValue"
                  (input)="onGlobalFilter($event)"
                />
              </p-iconField>
            }
          </div>

          <div class="toolbar-right">
            <ng-content select="[toolbar-actions]"></ng-content>
          </div>
        </div>
      }

      <!-- 表格 -->
      <p-table
        #dt
        [value]="data()"
        [columns]="columns()"
        [lazy]="lazy()"
        [paginator]="paginator()"
        [rows]="rows()"
        [totalRecords]="totalRecords()"
        [loading]="loading()"
        [rowsPerPageOptions]="rowsPerPageOptions()"
        [showCurrentPageReport]="true"
        [currentPageReportTemplate]="pageReportTemplate()"
        [selectionMode]="selectionMode()"
        [(selection)]="selectedItems"
        [dataKey]="dataKey()"
        [rowHover]="true"
        [scrollable]="scrollable()"
        [scrollHeight]="scrollHeight()"
        [globalFilterFields]="globalFilterFields()"
        (onLazyLoad)="onLazyLoad($event)"
        (onRowSelect)="onRowSelect($event)"
        (onRowUnselect)="onRowUnselect($event)"
        styleClass="p-datatable-sm"
      >
        <!-- 表頭 -->
        <ng-template pTemplate="header">
          <tr>
            @if (selectionMode()) {
              <th style="width: 3rem">
                @if (selectionMode() === 'multiple') {
                  <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
                }
              </th>
            }
            @for (col of columns(); track col.field) {
              <th
                [pSortableColumn]="col.sortable ? col.field : undefined"
                [style.width]="col.width"
                [style.text-align]="col.align || 'left'"
              >
                {{ col.header }}
                @if (col.sortable) {
                  <p-sortIcon [field]="col.field"></p-sortIcon>
                }
              </th>
            }
            @if (showActions()) {
              <th style="width: 120px; text-align: center">操作</th>
            }
          </tr>
        </ng-template>

        <!-- 表身 -->
        <ng-template pTemplate="body" let-rowData let-rowIndex="rowIndex">
          <tr>
            @if (selectionMode()) {
              <td>
                @if (selectionMode() === 'multiple') {
                  <p-tableCheckbox [value]="rowData"></p-tableCheckbox>
                } @else {
                  <p-tableRadioButton [value]="rowData"></p-tableRadioButton>
                }
              </td>
            }
            @for (col of columns(); track col.field) {
              <td [style.text-align]="col.align || 'left'">
                @if (col.type === 'custom' && cellTemplates[col.field]) {
                  <ng-container
                    *ngTemplateOutlet="cellTemplates[col.field]; context: { $implicit: rowData, rowIndex }"
                  ></ng-container>
                } @else {
                  {{ formatCellValue(rowData, col) }}
                }
              </td>
            }
            @if (showActions()) {
              <td class="actions-cell">
                <ng-content select="[row-actions]" *ngTemplateOutlet="actionsTemplate; context: { $implicit: rowData, rowIndex }"></ng-content>
              </td>
            }
          </tr>
        </ng-template>

        <!-- 空資料 -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="totalColumnCount()" class="text-center p-4">
              {{ emptyMessage() }}
            </td>
          </tr>
        </ng-template>

        <!-- 載入中 -->
        <ng-template pTemplate="loadingbody">
          <tr>
            @for (_ of skeletonRows; track $index) {
              <td>
                <p-skeleton></p-skeleton>
              </td>
            }
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .data-table-container {
      background: var(--surface-card);
      border-radius: 8px;
      overflow: hidden;
    }

    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid var(--surface-border);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .actions-cell {
      text-align: center;
    }

    :host ::ng-deep {
      .p-datatable {
        .p-datatable-thead > tr > th {
          background: var(--surface-50);
          font-weight: 600;
        }

        .p-datatable-tbody > tr:hover {
          background: var(--surface-hover);
        }
      }
    }
  `],
})
export class DataTableComponent<T = unknown> {
  // 輸入屬性
  data = input<T[]>([]);
  columns = input<ColumnDefinition[]>([]);
  totalRecords = input(0);
  loading = input(false);
  lazy = input(true);
  paginator = input(true);
  rows = input(20);
  rowsPerPageOptions = input([10, 20, 50, 100]);
  selectionMode = input<'single' | 'multiple' | null>(null);
  dataKey = input('id');
  scrollable = input(false);
  scrollHeight = input<string | undefined>(undefined);
  showToolbar = input(true);
  showGlobalFilter = input(true);
  showActions = input(true);
  globalFilterFields = input<string[]>([]);
  searchPlaceholder = input('搜尋...');
  emptyMessage = input('查無資料');
  pageReportTemplate = input('顯示 {first} 至 {last} 筆，共 {totalRecords} 筆');

  // 輸出事件
  lazyLoad = output<TableQueryParams>();
  rowSelect = output<T>();
  rowUnselect = output<T>();
  selectionChange = output<T | T[]>();

  // 內部狀態
  globalFilterValue = '';
  selectedItems: T | T[] | null = null;
  cellTemplates: Record<string, TemplateRef<unknown>> = {};
  actionsTemplate: TemplateRef<unknown> | null = null;
  skeletonRows = Array(5).fill(0);

  // 計算屬性
  totalColumnCount = computed(() => {
    let count = this.columns().length;
    if (this.selectionMode()) count++;
    if (this.showActions()) count++;
    return count;
  });

  /**
   * Lazy Load 事件處理
   */
  onLazyLoad(event: TableLazyLoadEvent): void {
    const params: TableQueryParams = {
      page: event.first !== undefined && event.rows ? Math.floor(event.first / event.rows) + 1 : 1,
      page_size: event.rows || this.rows(),
    };

    if (event.sortField) {
      params['sort_by'] = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
      params['sort_order'] = event.sortOrder === 1 ? 'asc' : 'desc';
    }

    if (this.globalFilterValue) {
      params['search'] = this.globalFilterValue;
    }

    this.lazyLoad.emit(params);
  }

  /**
   * 全域篩選
   */
  onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue = value;

    // 觸發 lazy load
    const params: TableQueryParams = {
      page: 1,
      page_size: this.rows(),
      search: value,
    };
    this.lazyLoad.emit(params);
  }

  /**
   * 選取列事件
   */
  onRowSelect(event: { data?: T | T[] }): void {
    if (event.data && !Array.isArray(event.data)) {
      this.rowSelect.emit(event.data);
    }
    this.selectionChange.emit(this.selectedItems as T | T[]);
  }

  /**
   * 取消選取列事件
   */
  onRowUnselect(event: { data?: T | T[] }): void {
    if (event.data && !Array.isArray(event.data)) {
      this.rowUnselect.emit(event.data);
    }
    this.selectionChange.emit(this.selectedItems as T | T[]);
  }

  /**
   * 格式化儲存格值
   */
  formatCellValue(rowData: T, col: ColumnDefinition): string {
    const value = this.getNestedValue(rowData, col.field);

    if (value === null || value === undefined) {
      return '-';
    }

    switch (col.type) {
      case 'date':
        return this.formatDate(value, col.format);
      case 'number':
        return this.formatNumber(value, col.format);
      case 'currency':
        return this.formatCurrency(value);
      case 'boolean':
        return value ? '是' : '否';
      default:
        return String(value);
    }
  }

  /**
   * 取得巢狀物件值
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  /**
   * 格式化日期
   */
  private formatDate(value: unknown, format?: string): string {
    if (!value) return '-';
    const date = new Date(String(value));
    if (isNaN(date.getTime())) return String(value);

    // 簡單格式化，實際應用可使用 date-fns 或 luxon
    return date.toLocaleDateString('zh-TW');
  }

  /**
   * 格式化數字
   */
  private formatNumber(value: unknown, format?: string): string {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString('zh-TW');
  }

  /**
   * 格式化貨幣
   */
  private formatCurrency(value: unknown): string {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(num);
  }
}
