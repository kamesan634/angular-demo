/**
 * 報表範本列表頁面元件
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
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type TemplateType = 'sales' | 'inventory' | 'financial' | 'custom';
type TemplateStatus = 'active' | 'draft' | 'archived';

interface ReportField {
  name: string;
  label: string;
  selected: boolean;
}

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  type: TemplateType;
  status: TemplateStatus;
  fields: string[];
  filters: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, TextareaModule, CheckboxModule, ConfirmDialogModule, PageHeaderComponent, DatePipe,
  ],
  template: `
    <app-page-header
      title="報表範本"
      subtitle="管理報表範本"
      [breadcrumbs]="[{ label: '報表中心' }, { label: '報表範本' }]"
    >
      <button pButton label="新增範本" icon="pi pi-plus" (click)="openNewDialog()"></button>
    </app-page-header>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-file"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalTemplates }}</div>
          <div class="stat-label">總範本數</div>
        </div>
      </div>
      <div class="stat-card active">
        <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().activeCount }}</div>
          <div class="stat-label">啟用中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-chart-bar"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalUsage }}</div>
          <div class="stat-label">總使用次數</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-star"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().mostUsedTemplate }}</div>
          <div class="stat-label">最常用範本</div>
        </div>
      </div>
    </div>

    <div class="card">
      <p-table [value]="templates()" [paginator]="true" [rows]="10" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋範本名稱..." />
              </p-iconField>
              <p-select [options]="typeOptions" [(ngModel)]="selectedType" placeholder="報表類型" [showClear]="true"></p-select>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-filter-slash" label="清除篩選" class="p-button-text" (click)="clearFilters()"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th>範本名稱</th>
            <th style="width: 100px">報表類型</th>
            <th style="width: 200px">說明</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 100px; text-align: right">使用次數</th>
            <th style="width: 100px">建立日期</th>
            <th style="width: 80px">建立者</th>
            <th style="width: 140px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-t>
          <tr>
            <td>
              <div class="template-name">
                <i [class]="getTypeIcon(t.type)"></i>
                <span>{{ t.name }}</span>
              </div>
            </td>
            <td>
              <p-tag [value]="getTypeLabel(t.type)" [severity]="getTypeSeverity(t.type)"></p-tag>
            </td>
            <td class="text-secondary">{{ t.description }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(t.status)" [severity]="getStatusSeverity(t.status)"></p-tag>
            </td>
            <td class="text-right">{{ t.usage_count }}</td>
            <td>{{ t.created_at | date:'yyyy/MM/dd' }}</td>
            <td>{{ t.created_by }}</td>
            <td class="text-center">
              <button pButton icon="pi pi-play" class="p-button-success p-button-text p-button-sm" pTooltip="產生報表" (click)="generateReport(t)"></button>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="編輯" (click)="editTemplate(t)"></button>
              <button pButton icon="pi pi-copy" class="p-button-text p-button-sm" pTooltip="複製" (click)="copyTemplate(t)"></button>
              <button pButton icon="pi pi-trash" class="p-button-danger p-button-text p-button-sm" pTooltip="刪除" (click)="deleteTemplate(t)"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="8" class="text-center p-4">尚無報表範本</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 新增/編輯對話框 -->
    <p-dialog [(visible)]="dialogVisible" [header]="editingTemplate ? '編輯範本' : '新增範本'" [modal]="true" [style]="{width: '600px'}" [closable]="true">
      <div class="form-grid">
        <div class="form-row">
          <label>範本名稱 <span class="required">*</span></label>
          <input pInputText [(ngModel)]="formData.name" placeholder="輸入範本名稱" [style]="{width: '100%'}" />
        </div>
        <div class="form-row">
          <label>報表類型 <span class="required">*</span></label>
          <p-select [options]="typeOptions" [(ngModel)]="formData.type" placeholder="選擇類型" (onChange)="onTypeChange()" [style]="{width: '100%'}"></p-select>
        </div>
        <div class="form-row full">
          <label>說明</label>
          <textarea pTextarea [(ngModel)]="formData.description" rows="2" placeholder="範本說明" [style]="{width: '100%'}"></textarea>
        </div>
        <div class="form-row full">
          <label>選擇欄位</label>
          <div class="field-list">
            @for (field of availableFields; track field.name) {
              <div class="field-item">
                <p-checkbox [(ngModel)]="field.selected" [binary]="true" [inputId]="field.name"></p-checkbox>
                <label [for]="field.name">{{ field.label }}</label>
              </div>
            }
          </div>
        </div>
        <div class="form-row">
          <label>狀態</label>
          <p-select [options]="statusOptions" [(ngModel)]="formData.status" [style]="{width: '100%'}"></p-select>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" icon="pi pi-check" (click)="saveTemplate()"></button>
      </ng-template>
    </p-dialog>

    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [`
    .card { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--surface-card); border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--surface-ground); color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.active .stat-icon { background: var(--green-100); color: var(--green-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); font-size: 0.875rem; }
    .template-name { display: flex; align-items: center; gap: 0.5rem; }
    .template-name i { color: var(--text-color-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-row.full { grid-column: 1 / -1; }
    .form-row label { font-weight: 500; font-size: 0.875rem; }
    .required { color: var(--red-500); }
    .field-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; padding: 1rem; background: var(--surface-ground); border-radius: 8px; max-height: 200px; overflow-y: auto; }
    .field-item { font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
    .field-item label { cursor: pointer; }
  `],
})
export class TemplateListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  templates = signal<ReportTemplate[]>([]);
  loading = signal(false);
  stats = signal({ totalTemplates: 0, activeCount: 0, totalUsage: 0, mostUsedTemplate: '' });
  dialogVisible = false;
  editingTemplate: ReportTemplate | null = null;
  searchValue = '';
  selectedType: TemplateType | null = null;
  selectedStatus: TemplateStatus | null = null;

  formData: { name: string; type: TemplateType | null; description: string; status: TemplateStatus } = {
    name: '', type: null, description: '', status: 'active',
  };

  availableFields: ReportField[] = [];

  typeOptions = [
    { label: '銷售報表', value: 'sales' },
    { label: '庫存報表', value: 'inventory' },
    { label: '財務報表', value: 'financial' },
    { label: '自訂報表', value: 'custom' },
  ];

  statusOptions = [
    { label: '啟用', value: 'active' },
    { label: '草稿', value: 'draft' },
    { label: '封存', value: 'archived' },
  ];

  salesFields: ReportField[] = [
    { name: 'date', label: '日期', selected: true },
    { name: 'store', label: '門市', selected: true },
    { name: 'orders', label: '訂單數', selected: true },
    { name: 'revenue', label: '營收', selected: true },
    { name: 'cost', label: '成本', selected: false },
    { name: 'profit', label: '毛利', selected: true },
    { name: 'avg_order', label: '平均客單價', selected: false },
    { name: 'products', label: '商品明細', selected: false },
    { name: 'payment', label: '付款方式', selected: false },
  ];

  inventoryFields: ReportField[] = [
    { name: 'product', label: '商品', selected: true },
    { name: 'category', label: '類別', selected: true },
    { name: 'warehouse', label: '倉庫', selected: true },
    { name: 'stock_qty', label: '庫存數量', selected: true },
    { name: 'safety_stock', label: '安全庫存', selected: false },
    { name: 'stock_value', label: '庫存金額', selected: true },
    { name: 'turnover', label: '週轉率', selected: false },
    { name: 'last_movement', label: '最後異動', selected: false },
  ];

  financialFields: ReportField[] = [
    { name: 'date', label: '日期', selected: true },
    { name: 'revenue', label: '營收', selected: true },
    { name: 'cost', label: '成本', selected: true },
    { name: 'gross_profit', label: '毛利', selected: true },
    { name: 'expense', label: '費用', selected: true },
    { name: 'net_profit', label: '淨利', selected: true },
    { name: 'cash_flow', label: '現金流', selected: false },
    { name: 'ar', label: '應收帳款', selected: false },
    { name: 'ap', label: '應付帳款', selected: false },
  ];

  ngOnInit(): void {
    this.loadTemplates();
    this.availableFields = [...this.salesFields];
  }

  loadTemplates(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: ReportTemplate[] = [
        { id: 1, name: '每日銷售彙總', description: '每日各門市銷售數據彙總', type: 'sales', status: 'active', fields: ['date', 'store', 'orders', 'revenue', 'profit'], filters: ['dateRange', 'store'], created_by: '系統管理員', created_at: '2025-12-01', updated_at: '2026-01-15', usage_count: 156 },
        { id: 2, name: '商品銷售排行', description: '依銷售量排序的商品列表', type: 'sales', status: 'active', fields: ['product', 'quantity', 'revenue', 'profit'], filters: ['dateRange', 'category'], created_by: '系統管理員', created_at: '2025-12-01', updated_at: '2026-01-10', usage_count: 89 },
        { id: 3, name: '庫存狀態報表', description: '各倉庫庫存現況', type: 'inventory', status: 'active', fields: ['product', 'category', 'warehouse', 'stock_qty', 'stock_value'], filters: ['warehouse', 'category', 'status'], created_by: '系統管理員', created_at: '2025-12-01', updated_at: '2026-01-18', usage_count: 124 },
        { id: 4, name: '低庫存預警', description: '低於安全庫存的商品清單', type: 'inventory', status: 'active', fields: ['product', 'stock_qty', 'safety_stock', 'shortage'], filters: ['warehouse'], created_by: '倉管主管', created_at: '2026-01-05', updated_at: '2026-01-05', usage_count: 67 },
        { id: 5, name: '月度損益表', description: '每月損益明細', type: 'financial', status: 'active', fields: ['revenue', 'cost', 'gross_profit', 'expense', 'net_profit'], filters: ['year', 'month'], created_by: '財務主管', created_at: '2025-12-15', updated_at: '2026-01-01', usage_count: 45 },
        { id: 6, name: '現金流量表', description: '現金收支明細', type: 'financial', status: 'draft', fields: ['date', 'income', 'expense', 'balance'], filters: ['dateRange'], created_by: '財務主管', created_at: '2026-01-10', updated_at: '2026-01-10', usage_count: 0 },
      ];
      this.templates.set(data);
      this.calculateStats(data);
      this.loading.set(false);
    }, 500);
  }

  calculateStats(data: ReportTemplate[]): void {
    const mostUsed = data.reduce((max, t) => t.usage_count > max.usage_count ? t : max, data[0]);
    this.stats.set({
      totalTemplates: data.length,
      activeCount: data.filter(t => t.status === 'active').length,
      totalUsage: data.reduce((sum, t) => sum + t.usage_count, 0),
      mostUsedTemplate: mostUsed?.name || '-',
    });
  }

  getTypeLabel(type: TemplateType): string {
    const labels: Record<TemplateType, string> = { sales: '銷售', inventory: '庫存', financial: '財務', custom: '自訂' };
    return labels[type];
  }

  getTypeSeverity(type: TemplateType): 'info' | 'success' | 'warn' | 'secondary' {
    const severities: Record<TemplateType, 'info' | 'success' | 'warn' | 'secondary'> = { sales: 'info', inventory: 'success', financial: 'warn', custom: 'secondary' };
    return severities[type];
  }

  getTypeIcon(type: TemplateType): string {
    const icons: Record<TemplateType, string> = { sales: 'pi pi-shopping-cart', inventory: 'pi pi-box', financial: 'pi pi-dollar', custom: 'pi pi-file' };
    return icons[type];
  }

  getStatusLabel(status: TemplateStatus): string {
    const labels: Record<TemplateStatus, string> = { active: '啟用', draft: '草稿', archived: '封存' };
    return labels[status];
  }

  getStatusSeverity(status: TemplateStatus): 'success' | 'warn' | 'secondary' {
    const severities: Record<TemplateStatus, 'success' | 'warn' | 'secondary'> = { active: 'success', draft: 'warn', archived: 'secondary' };
    return severities[status];
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedType = null;
    this.selectedStatus = null;
  }

  openNewDialog(): void {
    this.editingTemplate = null;
    this.formData = { name: '', type: null, description: '', status: 'active' };
    this.availableFields = [...this.salesFields];
    this.dialogVisible = true;
  }

  editTemplate(t: ReportTemplate): void {
    this.editingTemplate = t;
    this.formData = { name: t.name, type: t.type, description: t.description, status: t.status };
    this.onTypeChange();
    this.dialogVisible = true;
  }

  onTypeChange(): void {
    switch (this.formData.type) {
      case 'sales': this.availableFields = [...this.salesFields]; break;
      case 'inventory': this.availableFields = [...this.inventoryFields]; break;
      case 'financial': this.availableFields = [...this.financialFields]; break;
      default: this.availableFields = [...this.salesFields];
    }
  }

  saveTemplate(): void {
    if (!this.formData.name || !this.formData.type) {
      this.messageService.add({ severity: 'warn', summary: '警告', detail: '請填寫必要欄位' });
      return;
    }
    this.dialogVisible = false;
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.editingTemplate ? '範本已更新' : '範本已建立' });
  }

  copyTemplate(t: ReportTemplate): void {
    this.messageService.add({ severity: 'success', summary: '成功', detail: `已複製範本：${t.name}（副本）` });
  }

  deleteTemplate(t: ReportTemplate): void {
    this.confirmationService.confirm({
      message: `確定要刪除範本「${t.name}」？`,
      header: '刪除確認',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.templates.update(list => list.filter(item => item.id !== t.id));
        this.calculateStats(this.templates());
        this.messageService.add({ severity: 'success', summary: '成功', detail: '範本已刪除' });
      },
    });
  }

  generateReport(t: ReportTemplate): void {
    this.messageService.add({ severity: 'info', summary: '產生報表', detail: `正在使用範本「${t.name}」產生報表...` });
  }
}
