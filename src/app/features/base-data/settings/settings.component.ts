/**
 * 系統設定頁面元件
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';

interface SystemSettings {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  tax_id: string;
  currency: string;
  tax_rate: number;
  default_warehouse: number;
  order_prefix: string;
  purchase_prefix: string;
  low_stock_threshold: number;
  session_timeout: number;
  backup_enabled: boolean;
  backup_frequency: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule,
    InputNumberModule, SelectModule, TabsModule, DividerModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="系統設定"
      subtitle="管理系統相關設定"
      [breadcrumbs]="[{ label: '基礎資料' }, { label: '系統設定' }]"
    >
      <button pButton label="儲存設定" icon="pi pi-save" (click)="saveSettings()"></button>
    </app-page-header>

    <div class="settings-container">
      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">公司資訊</p-tab>
          <p-tab value="1">營運設定</p-tab>
          <p-tab value="2">系統設定</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel value="0">
            <div class="settings-section">
              <h3>公司基本資料</h3>
              <div class="grid">
                <div class="col-6 form-field">
                  <label>公司名稱</label>
                  <input pInputText [(ngModel)]="settings.company_name" class="w-full" />
                </div>
                <div class="col-6 form-field">
                  <label>統一編號</label>
                  <input pInputText [(ngModel)]="settings.tax_id" class="w-full" />
                </div>
                <div class="col-12 form-field">
                  <label>公司地址</label>
                  <input pInputText [(ngModel)]="settings.company_address" class="w-full" />
                </div>
                <div class="col-6 form-field">
                  <label>聯絡電話</label>
                  <input pInputText [(ngModel)]="settings.company_phone" class="w-full" />
                </div>
                <div class="col-6 form-field">
                  <label>聯絡信箱</label>
                  <input pInputText [(ngModel)]="settings.company_email" class="w-full" type="email" />
                </div>
              </div>
            </div>
          </p-tabpanel>

          <p-tabpanel value="1">
            <div class="settings-section">
              <h3>財務設定</h3>
              <div class="grid">
                <div class="col-6 form-field">
                  <label>幣別</label>
                  <p-select [options]="currencyOptions" [(ngModel)]="settings.currency" class="w-full"></p-select>
                </div>
                <div class="col-6 form-field">
                  <label>預設稅率 (%)</label>
                  <p-inputNumber [(ngModel)]="settings.tax_rate" [min]="0" [max]="100" suffix="%" class="w-full"></p-inputNumber>
                </div>
              </div>

              <p-divider></p-divider>

              <h3>編號規則</h3>
              <div class="grid">
                <div class="col-6 form-field">
                  <label>訂單編號前綴</label>
                  <input pInputText [(ngModel)]="settings.order_prefix" class="w-full" />
                  <small>範例：{{ settings.order_prefix }}20260119001</small>
                </div>
                <div class="col-6 form-field">
                  <label>採購單編號前綴</label>
                  <input pInputText [(ngModel)]="settings.purchase_prefix" class="w-full" />
                  <small>範例：{{ settings.purchase_prefix }}20260119001</small>
                </div>
              </div>

              <p-divider></p-divider>

              <h3>庫存設定</h3>
              <div class="grid">
                <div class="col-6 form-field">
                  <label>預設倉庫</label>
                  <p-select [options]="warehouseOptions" [(ngModel)]="settings.default_warehouse" class="w-full"></p-select>
                </div>
                <div class="col-6 form-field">
                  <label>低庫存警示門檻</label>
                  <p-inputNumber [(ngModel)]="settings.low_stock_threshold" [min]="0" class="w-full"></p-inputNumber>
                </div>
              </div>
            </div>
          </p-tabpanel>

          <p-tabpanel value="2">
            <div class="settings-section">
              <h3>安全設定</h3>
              <div class="grid">
                <div class="col-6 form-field">
                  <label>閒置登出時間 (分鐘)</label>
                  <p-inputNumber [(ngModel)]="settings.session_timeout" [min]="5" [max]="480" class="w-full"></p-inputNumber>
                </div>
              </div>

              <p-divider></p-divider>

              <h3>備份設定</h3>
              <div class="grid">
                <div class="col-6 form-field">
                  <label>
                    <input type="checkbox" [(ngModel)]="settings.backup_enabled" />
                    啟用自動備份
                  </label>
                </div>
                <div class="col-6 form-field">
                  <label>備份頻率</label>
                  <p-select [options]="backupOptions" [(ngModel)]="settings.backup_frequency" class="w-full" [disabled]="!settings.backup_enabled"></p-select>
                </div>
              </div>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styles: [`
    .settings-container {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1.5rem;
    }
    .settings-section h3 {
      margin: 0 0 1rem;
      color: var(--primary-color);
      font-size: 1.1rem;
    }
    .form-field {
      margin-bottom: 1.25rem;
    }
    .form-field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .form-field small {
      display: block;
      margin-top: 0.25rem;
      color: var(--text-color-secondary);
    }
    .w-full { width: 100%; }
    .grid { display: flex; flex-wrap: wrap; margin: -0.5rem; }
    .col-6 { width: 50%; padding: 0.5rem; box-sizing: border-box; }
    .col-12 { width: 100%; padding: 0.5rem; box-sizing: border-box; }
  `],
})
export class SettingsComponent implements OnInit {
  private readonly messageService = inject(MessageService);

  settings: SystemSettings = {
    company_name: '龜三商店',
    company_address: '台北市信義區忠孝東路100號',
    company_phone: '02-27001234',
    company_email: 'contact@turtle3.com',
    tax_id: '12345678',
    currency: 'TWD',
    tax_rate: 5,
    default_warehouse: 1,
    order_prefix: 'SO',
    purchase_prefix: 'PO',
    low_stock_threshold: 10,
    session_timeout: 30,
    backup_enabled: true,
    backup_frequency: 'daily',
  };

  currencyOptions = [
    { label: '新台幣 (TWD)', value: 'TWD' },
    { label: '美元 (USD)', value: 'USD' },
    { label: '人民幣 (CNY)', value: 'CNY' },
  ];

  warehouseOptions = [
    { label: '總倉', value: 1 },
    { label: '北區倉庫', value: 2 },
    { label: '中區倉庫', value: 3 },
    { label: '南區倉庫', value: 4 },
  ];

  backupOptions = [
    { label: '每日', value: 'daily' },
    { label: '每週', value: 'weekly' },
    { label: '每月', value: 'monthly' },
  ];

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    // 模擬載入設定
  }

  saveSettings(): void {
    this.messageService.add({
      severity: 'success',
      summary: '成功',
      detail: '系統設定已儲存',
    });
  }
}
