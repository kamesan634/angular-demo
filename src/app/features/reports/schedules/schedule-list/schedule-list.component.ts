/**
 * 排程報表列表頁面元件
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
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
type ScheduleStatus = 'active' | 'paused' | 'error';
type DeliveryMethod = 'email' | 'download' | 'sftp';

interface ReportSchedule {
  id: number;
  name: string;
  template_id: number;
  template_name: string;
  frequency: ScheduleFrequency;
  time: string;
  day_of_week?: number;
  day_of_month?: number;
  status: ScheduleStatus;
  delivery_method: DeliveryMethod;
  recipients: string[];
  last_run?: string;
  next_run: string;
  created_by: string;
  created_at: string;
}

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, TooltipModule, IconFieldModule, InputIconModule,
    DialogModule, InputNumberModule, CheckboxModule, MultiSelectModule,
    ConfirmDialogModule, PageHeaderComponent, DatePipe,
  ],
  template: `
    <app-page-header
      title="排程報表"
      subtitle="管理報表排程"
      [breadcrumbs]="[{ label: '報表中心' }, { label: '排程報表' }]"
    >
      <button pButton label="新增排程" icon="pi pi-plus" (click)="openNewDialog()"></button>
    </app-page-header>

    <!-- 統計卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-clock"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().totalSchedules }}</div>
          <div class="stat-label">總排程數</div>
        </div>
      </div>
      <div class="stat-card active">
        <div class="stat-icon"><i class="pi pi-play"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().activeCount }}</div>
          <div class="stat-label">運行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="pi pi-calendar"></i></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats().todayCount }}</div>
          <div class="stat-label">今日待執行</div>
        </div>
      </div>
      @if (stats().errorCount > 0) {
        <div class="stat-card error">
          <div class="stat-icon"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats().errorCount }}</div>
            <div class="stat-label">執行異常</div>
          </div>
        </div>
      }
    </div>

    <div class="card">
      <p-table [value]="schedules()" [paginator]="true" [rows]="10" [loading]="loading()" [rowHover]="true" dataKey="id" styleClass="p-datatable-sm">
        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input pInputText [(ngModel)]="searchValue" placeholder="搜尋排程名稱..." />
              </p-iconField>
              <p-select [options]="frequencyOptions" [(ngModel)]="selectedFrequency" placeholder="執行頻率" [showClear]="true"></p-select>
              <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" placeholder="狀態" [showClear]="true"></p-select>
            </div>
            <div class="header-right">
              <button pButton icon="pi pi-filter-slash" label="清除篩選" class="p-button-text" (click)="clearFilters()"></button>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th>排程名稱</th>
            <th style="width: 140px">使用範本</th>
            <th style="width: 100px">執行頻率</th>
            <th style="width: 80px">執行時間</th>
            <th style="width: 80px; text-align: center">狀態</th>
            <th style="width: 80px">傳送方式</th>
            <th style="width: 110px">上次執行</th>
            <th style="width: 110px">下次執行</th>
            <th style="width: 140px; text-align: center">操作</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-s>
          <tr>
            <td>
              <div class="schedule-name">
                <i class="pi pi-clock"></i>
                <span>{{ s.name }}</span>
              </div>
            </td>
            <td class="text-secondary">{{ s.template_name }}</td>
            <td>
              <p-tag [value]="getFrequencyLabel(s.frequency)" [severity]="getFrequencySeverity(s.frequency)"></p-tag>
            </td>
            <td>{{ s.time }}</td>
            <td class="text-center">
              <p-tag [value]="getStatusLabel(s.status)" [severity]="getStatusSeverity(s.status)"></p-tag>
            </td>
            <td>
              <i [class]="getDeliveryIcon(s.delivery_method)" [pTooltip]="getDeliveryLabel(s.delivery_method)"></i>
            </td>
            <td class="text-secondary">{{ s.last_run | date:'MM/dd HH:mm' }}</td>
            <td>{{ s.next_run | date:'MM/dd HH:mm' }}</td>
            <td class="text-center">
              @if (s.status === 'active') {
                <button pButton icon="pi pi-pause" class="p-button-warning p-button-text p-button-sm" pTooltip="暫停" (click)="pauseSchedule(s)"></button>
              } @else if (s.status === 'paused') {
                <button pButton icon="pi pi-play" class="p-button-success p-button-text p-button-sm" pTooltip="啟動" (click)="resumeSchedule(s)"></button>
              }
              <button pButton icon="pi pi-refresh" class="p-button-text p-button-sm" pTooltip="立即執行" (click)="runNow(s)"></button>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="編輯" (click)="editSchedule(s)"></button>
              <button pButton icon="pi pi-trash" class="p-button-danger p-button-text p-button-sm" pTooltip="刪除" (click)="deleteSchedule(s)"></button>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr><td colspan="9" class="text-center p-4">尚無排程報表</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- 新增/編輯對話框 -->
    <p-dialog [(visible)]="dialogVisible" [header]="editingSchedule ? '編輯排程' : '新增排程'" [modal]="true" [style]="{width: '600px'}" [closable]="true">
      <div class="form-grid">
        <div class="form-row full">
          <label>排程名稱 <span class="required">*</span></label>
          <input pInputText [(ngModel)]="formData.name" placeholder="輸入排程名稱" [style]="{width: '100%'}" />
        </div>
        <div class="form-row full">
          <label>報表範本 <span class="required">*</span></label>
          <p-select [options]="templateOptions" [(ngModel)]="formData.template_id" placeholder="選擇範本" [style]="{width: '100%'}"></p-select>
        </div>
        <div class="form-row">
          <label>執行頻率 <span class="required">*</span></label>
          <p-select [options]="frequencyOptions" [(ngModel)]="formData.frequency" placeholder="選擇頻率" (onChange)="onFrequencyChange()" [style]="{width: '100%'}"></p-select>
        </div>
        <div class="form-row">
          <label>執行時間 <span class="required">*</span></label>
          <p-select [options]="timeOptions" [(ngModel)]="formData.time" placeholder="選擇時間" [style]="{width: '100%'}"></p-select>
        </div>
        @if (formData.frequency === 'weekly') {
          <div class="form-row full">
            <label>執行日 (週)</label>
            <p-select [options]="weekdayOptions" [(ngModel)]="formData.day_of_week" placeholder="選擇星期" [style]="{width: '100%'}"></p-select>
          </div>
        }
        @if (formData.frequency === 'monthly' || formData.frequency === 'quarterly') {
          <div class="form-row full">
            <label>執行日 (月)</label>
            <p-inputNumber [(ngModel)]="formData.day_of_month" [min]="1" [max]="28" [showButtons]="true" [style]="{width: '100%'}"></p-inputNumber>
          </div>
        }
        <div class="form-row">
          <label>傳送方式</label>
          <p-select [options]="deliveryOptions" [(ngModel)]="formData.delivery_method" [style]="{width: '100%'}"></p-select>
        </div>
        <div class="form-row">
          <label>狀態</label>
          <p-select [options]="statusOptions" [(ngModel)]="formData.status" [style]="{width: '100%'}"></p-select>
        </div>
        @if (formData.delivery_method === 'email') {
          <div class="form-row full">
            <label>收件人</label>
            <p-multiSelect [options]="recipientOptions" [(ngModel)]="formData.recipients" placeholder="選擇收件人" [style]="{width: '100%'}"></p-multiSelect>
          </div>
        }
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="dialogVisible = false"></button>
        <button pButton label="儲存" icon="pi pi-check" (click)="saveSchedule()"></button>
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
    .stat-card.error .stat-icon { background: var(--red-100); color: var(--red-600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .table-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .header-left, .header-right { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .text-center { text-align: center; }
    .text-secondary { color: var(--text-color-secondary); font-size: 0.875rem; }
    .schedule-name { display: flex; align-items: center; gap: 0.5rem; }
    .schedule-name i { color: var(--text-color-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-row.full { grid-column: 1 / -1; }
    .form-row label { font-weight: 500; font-size: 0.875rem; }
    .required { color: var(--red-500); }
  `],
})
export class ScheduleListComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  schedules = signal<ReportSchedule[]>([]);
  loading = signal(false);
  stats = signal({ totalSchedules: 0, activeCount: 0, todayCount: 0, errorCount: 0 });
  dialogVisible = false;
  editingSchedule: ReportSchedule | null = null;
  searchValue = '';
  selectedFrequency: ScheduleFrequency | null = null;
  selectedStatus: ScheduleStatus | null = null;

  formData: {
    name: string;
    template_id: number | null;
    frequency: ScheduleFrequency | null;
    time: string;
    day_of_week: number | null;
    day_of_month: number | null;
    delivery_method: DeliveryMethod;
    status: ScheduleStatus;
    recipients: string[];
  } = { name: '', template_id: null, frequency: null, time: '08:00', day_of_week: null, day_of_month: 1, delivery_method: 'email', status: 'active', recipients: [] };

  frequencyOptions = [
    { label: '每日', value: 'daily' },
    { label: '每週', value: 'weekly' },
    { label: '每月', value: 'monthly' },
    { label: '每季', value: 'quarterly' },
  ];

  statusOptions = [
    { label: '運行中', value: 'active' },
    { label: '已暫停', value: 'paused' },
  ];

  templateOptions = [
    { label: '每日銷售彙總', value: 1 },
    { label: '商品銷售排行', value: 2 },
    { label: '庫存狀態報表', value: 3 },
    { label: '低庫存預警', value: 4 },
    { label: '月度損益表', value: 5 },
  ];

  timeOptions = [
    { label: '06:00', value: '06:00' },
    { label: '08:00', value: '08:00' },
    { label: '09:00', value: '09:00' },
    { label: '12:00', value: '12:00' },
    { label: '18:00', value: '18:00' },
    { label: '22:00', value: '22:00' },
  ];

  weekdayOptions = [
    { label: '星期一', value: 1 },
    { label: '星期二', value: 2 },
    { label: '星期三', value: 3 },
    { label: '星期四', value: 4 },
    { label: '星期五', value: 5 },
    { label: '星期六', value: 6 },
    { label: '星期日', value: 0 },
  ];

  deliveryOptions = [
    { label: '電子郵件', value: 'email' },
    { label: '下載中心', value: 'download' },
    { label: 'SFTP', value: 'sftp' },
  ];

  recipientOptions = [
    { label: '系統管理員', value: 'admin@company.com' },
    { label: '財務主管', value: 'finance@company.com' },
    { label: '倉管主管', value: 'warehouse@company.com' },
    { label: '業務主管', value: 'sales@company.com' },
  ];

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.loading.set(true);
    setTimeout(() => {
      const data: ReportSchedule[] = [
        { id: 1, name: '每日銷售報表', template_id: 1, template_name: '每日銷售彙總', frequency: 'daily', time: '08:00', status: 'active', delivery_method: 'email', recipients: ['admin@company.com', 'sales@company.com'], last_run: '2026-01-19T08:00:00', next_run: '2026-01-20T08:00:00', created_by: '系統管理員', created_at: '2025-12-01' },
        { id: 2, name: '週銷售排行報表', template_id: 2, template_name: '商品銷售排行', frequency: 'weekly', time: '09:00', day_of_week: 1, status: 'active', delivery_method: 'email', recipients: ['sales@company.com'], last_run: '2026-01-13T09:00:00', next_run: '2026-01-20T09:00:00', created_by: '系統管理員', created_at: '2025-12-01' },
        { id: 3, name: '庫存日報', template_id: 3, template_name: '庫存狀態報表', frequency: 'daily', time: '06:00', status: 'active', delivery_method: 'email', recipients: ['warehouse@company.com'], last_run: '2026-01-19T06:00:00', next_run: '2026-01-20T06:00:00', created_by: '倉管主管', created_at: '2026-01-05' },
        { id: 4, name: '低庫存預警通知', template_id: 4, template_name: '低庫存預警', frequency: 'daily', time: '09:00', status: 'active', delivery_method: 'email', recipients: ['warehouse@company.com', 'admin@company.com'], last_run: '2026-01-19T09:00:00', next_run: '2026-01-20T09:00:00', created_by: '系統管理員', created_at: '2026-01-05' },
        { id: 5, name: '月度損益報表', template_id: 5, template_name: '月度損益表', frequency: 'monthly', time: '08:00', day_of_month: 1, status: 'active', delivery_method: 'email', recipients: ['finance@company.com', 'admin@company.com'], last_run: '2026-01-01T08:00:00', next_run: '2026-02-01T08:00:00', created_by: '財務主管', created_at: '2025-12-15' },
        { id: 6, name: '季度財報匯出', template_id: 5, template_name: '月度損益表', frequency: 'quarterly', time: '09:00', day_of_month: 1, status: 'paused', delivery_method: 'sftp', recipients: [], last_run: '2025-10-01T09:00:00', next_run: '2026-04-01T09:00:00', created_by: '財務主管', created_at: '2025-10-01' },
      ];
      this.schedules.set(data);
      this.calculateStats(data);
      this.loading.set(false);
    }, 500);
  }

  calculateStats(data: ReportSchedule[]): void {
    const today = new Date().toISOString().split('T')[0];
    this.stats.set({
      totalSchedules: data.length,
      activeCount: data.filter(s => s.status === 'active').length,
      todayCount: data.filter(s => s.status === 'active' && s.next_run.startsWith(today)).length,
      errorCount: data.filter(s => s.status === 'error').length,
    });
  }

  getFrequencyLabel(frequency: ScheduleFrequency): string {
    const labels: Record<ScheduleFrequency, string> = { daily: '每日', weekly: '每週', monthly: '每月', quarterly: '每季' };
    return labels[frequency];
  }

  getFrequencySeverity(frequency: ScheduleFrequency): 'info' | 'success' | 'warn' | 'secondary' {
    const severities: Record<ScheduleFrequency, 'info' | 'success' | 'warn' | 'secondary'> = { daily: 'info', weekly: 'success', monthly: 'warn', quarterly: 'secondary' };
    return severities[frequency];
  }

  getStatusLabel(status: ScheduleStatus): string {
    const labels: Record<ScheduleStatus, string> = { active: '運行中', paused: '已暫停', error: '異常' };
    return labels[status];
  }

  getStatusSeverity(status: ScheduleStatus): 'success' | 'warn' | 'danger' {
    const severities: Record<ScheduleStatus, 'success' | 'warn' | 'danger'> = { active: 'success', paused: 'warn', error: 'danger' };
    return severities[status];
  }

  getDeliveryIcon(method: DeliveryMethod): string {
    const icons: Record<DeliveryMethod, string> = { email: 'pi pi-envelope', download: 'pi pi-download', sftp: 'pi pi-server' };
    return icons[method];
  }

  getDeliveryLabel(method: DeliveryMethod): string {
    const labels: Record<DeliveryMethod, string> = { email: '電子郵件', download: '下載中心', sftp: 'SFTP' };
    return labels[method];
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedFrequency = null;
    this.selectedStatus = null;
  }

  openNewDialog(): void {
    this.editingSchedule = null;
    this.formData = { name: '', template_id: null, frequency: null, time: '08:00', day_of_week: null, day_of_month: 1, delivery_method: 'email', status: 'active', recipients: [] };
    this.dialogVisible = true;
  }

  editSchedule(s: ReportSchedule): void {
    this.editingSchedule = s;
    this.formData = {
      name: s.name,
      template_id: s.template_id,
      frequency: s.frequency,
      time: s.time,
      day_of_week: s.day_of_week || null,
      day_of_month: s.day_of_month || 1,
      delivery_method: s.delivery_method,
      status: s.status,
      recipients: [...s.recipients],
    };
    this.dialogVisible = true;
  }

  onFrequencyChange(): void {
    // Reset frequency-specific fields
    if (this.formData.frequency === 'daily') {
      this.formData.day_of_week = null;
      this.formData.day_of_month = null;
    }
  }

  saveSchedule(): void {
    if (!this.formData.name || !this.formData.template_id || !this.formData.frequency) {
      this.messageService.add({ severity: 'warn', summary: '警告', detail: '請填寫必要欄位' });
      return;
    }
    this.dialogVisible = false;
    this.messageService.add({ severity: 'success', summary: '成功', detail: this.editingSchedule ? '排程已更新' : '排程已建立' });
  }

  pauseSchedule(s: ReportSchedule): void {
    this.schedules.update(list => list.map(item => item.id === s.id ? { ...item, status: 'paused' as ScheduleStatus } : item));
    this.calculateStats(this.schedules());
    this.messageService.add({ severity: 'info', summary: '提示', detail: `已暫停排程：${s.name}` });
  }

  resumeSchedule(s: ReportSchedule): void {
    this.schedules.update(list => list.map(item => item.id === s.id ? { ...item, status: 'active' as ScheduleStatus } : item));
    this.calculateStats(this.schedules());
    this.messageService.add({ severity: 'success', summary: '成功', detail: `已啟動排程：${s.name}` });
  }

  runNow(s: ReportSchedule): void {
    this.messageService.add({ severity: 'info', summary: '執行中', detail: `正在執行排程：${s.name}` });
  }

  deleteSchedule(s: ReportSchedule): void {
    this.confirmationService.confirm({
      message: `確定要刪除排程「${s.name}」？`,
      header: '刪除確認',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.schedules.update(list => list.filter(item => item.id !== s.id));
        this.calculateStats(this.schedules());
        this.messageService.add({ severity: 'success', summary: '成功', detail: '排程已刪除' });
      },
    });
  }
}
