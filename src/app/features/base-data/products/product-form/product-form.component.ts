/**
 * 商品表單元件 - 新增/編輯商品
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components';
import { Product, Category, Unit, TaxType, ProductVariant } from '@core/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    ToggleSwitchModule,
    TableModule,
    FileUploadModule,
    ImageModule,
    DividerModule,
    TooltipModule,
    ConfirmDialogModule,
    SelectButtonModule,
    PageHeaderComponent,
    CurrencyPipe,
    DecimalPipe,
  ],
  providers: [ConfirmationService],
  template: `
    <app-page-header
      [title]="isEditMode() ? '編輯商品' : '新增商品'"
      [subtitle]="isEditMode() ? '修改商品「' + productName() + '」的資料' : '建立新的商品資料'"
      [breadcrumbs]="[
        { label: '基礎資料', routerLink: '/base-data' },
        { label: '商品管理', routerLink: '/base-data/products' },
        { label: isEditMode() ? '編輯商品' : '新增商品' }
      ]"
    >
      <button
        pButton
        label="返回列表"
        icon="pi pi-arrow-left"
        class="p-button-outlined"
        routerLink="/base-data/products"
      ></button>
    </app-page-header>

    <p-confirmDialog></p-confirmDialog>

    @if (loading()) {
      <div class="loading-container">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
        <p>載入中...</p>
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Tab 選擇器 -->
        <div class="tab-selector">
          <p-selectButton [options]="tabOptions" [(ngModel)]="activeTab" [ngModelOptions]="{standalone: true}" optionLabel="label" optionValue="value"></p-selectButton>
        </div>

        <!-- 基本資訊 -->
        @if (activeTab === 'basic') {
          <div class="form-grid">
            <div class="form-section">
              <h3>商品資訊</h3>

              <div class="field">
                <label for="code">商品編號 <span class="required">*</span></label>
                <input id="code" pInputText formControlName="code" placeholder="輸入商品編號" />
                @if (form.get('code')?.invalid && form.get('code')?.touched) {
                  <small class="p-error">商品編號為必填</small>
                }
              </div>

              <div class="field">
                <label for="name">商品名稱 <span class="required">*</span></label>
                <input id="name" pInputText formControlName="name" placeholder="輸入商品名稱" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <small class="p-error">商品名稱為必填</small>
                }
              </div>

              <div class="field">
                <label for="barcode">條碼</label>
                <input id="barcode" pInputText formControlName="barcode" placeholder="輸入商品條碼" />
              </div>

              <div class="field">
                <label for="category_id">商品分類</label>
                <p-select id="category_id" formControlName="category_id" [options]="categories()" optionLabel="name" optionValue="id" placeholder="選擇分類" [showClear]="true" styleClass="w-full"></p-select>
              </div>

              <div class="field">
                <label for="unit_id">計量單位</label>
                <p-select id="unit_id" formControlName="unit_id" [options]="units()" optionLabel="name" optionValue="id" placeholder="選擇單位" [showClear]="true" styleClass="w-full"></p-select>
              </div>

              <div class="field">
                <label for="tax_type_id">稅別</label>
                <p-select id="tax_type_id" formControlName="tax_type_id" [options]="taxTypes()" optionLabel="name" optionValue="id" placeholder="選擇稅別" [showClear]="true" styleClass="w-full"></p-select>
              </div>

              <div class="field">
                <label for="description">商品描述</label>
                <textarea id="description" pTextarea formControlName="description" placeholder="輸入商品描述" rows="4"></textarea>
              </div>
            </div>

            <div class="form-section">
              <h3>價格設定</h3>

              <div class="field">
                <label for="cost_price">成本價 <span class="required">*</span></label>
                <p-inputNumber id="cost_price" formControlName="cost_price" mode="currency" currency="TWD" locale="zh-TW" [min]="0" styleClass="w-full"></p-inputNumber>
              </div>

              <div class="field">
                <label for="selling_price">售價 <span class="required">*</span></label>
                <p-inputNumber id="selling_price" formControlName="selling_price" mode="currency" currency="TWD" locale="zh-TW" [min]="0" styleClass="w-full"></p-inputNumber>
              </div>

              @if (form.get('cost_price')?.value && form.get('selling_price')?.value) {
                <div class="profit-info">
                  <div class="profit-item">
                    <span class="label">毛利：</span>
                    <span class="value" [class.negative]="getProfit() < 0">{{ getProfit() | currency:'TWD':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="profit-item">
                    <span class="label">毛利率：</span>
                    <span class="value" [class.negative]="getProfitMargin() < 0">{{ getProfitMargin() | number:'1.1-1' }}%</span>
                  </div>
                </div>
              }

              <p-divider></p-divider>

              <h3>庫存設定</h3>

              <div class="field">
                <label for="min_stock">安全庫存量</label>
                <p-inputNumber id="min_stock" formControlName="min_stock" [min]="0" placeholder="低於此數量時提醒補貨" styleClass="w-full"></p-inputNumber>
              </div>

              <div class="field">
                <label for="max_stock">最大庫存量</label>
                <p-inputNumber id="max_stock" formControlName="max_stock" [min]="0" placeholder="庫存上限" styleClass="w-full"></p-inputNumber>
              </div>

              <p-divider></p-divider>

              <h3>狀態設定</h3>

              <div class="field-switch">
                <p-toggleswitch formControlName="is_active" inputId="is_active"></p-toggleswitch>
                <label for="is_active">啟用商品</label>
              </div>
            </div>
          </div>
        }

        <!-- 商品圖片 -->
        @if (activeTab === 'image') {
          <div class="image-section">
            <div class="current-image">
              <h3>目前圖片</h3>
              @if (form.get('image_url')?.value) {
                <p-image [src]="form.get('image_url')?.value" alt="商品圖片" width="300" [preview]="true"></p-image>
                <button pButton type="button" label="移除圖片" icon="pi pi-trash" class="p-button-danger p-button-outlined mt-2" (click)="removeImage()"></button>
              } @else {
                <div class="no-image">
                  <i class="pi pi-image"></i>
                  <p>尚未上傳圖片</p>
                </div>
              }
            </div>

            <div class="upload-section">
              <h3>上傳新圖片</h3>
              <p-fileUpload mode="basic" accept="image/*" [maxFileSize]="5000000" chooseLabel="選擇圖片" (onSelect)="onImageSelect($event)"></p-fileUpload>
              <small class="upload-hint">支援 JPG、PNG 格式，檔案大小不超過 5MB</small>
            </div>

            <div class="field mt-3">
              <label for="image_url">或輸入圖片網址</label>
              <input id="image_url" pInputText formControlName="image_url" placeholder="https://example.com/image.jpg" />
            </div>
          </div>
        }

        <!-- 規格管理 -->
        @if (activeTab === 'variants') {
          <div class="variants-section">
            <div class="variants-header">
              <h3>商品規格</h3>
              <button pButton type="button" label="新增規格" icon="pi pi-plus" class="p-button-outlined" (click)="addVariant()"></button>
            </div>

            @if (variants.length === 0) {
              <div class="no-variants">
                <i class="pi pi-th-large"></i>
                <p>尚未設定商品規格</p>
                <small>點擊「新增規格」按鈕來建立規格選項</small>
              </div>
            } @else {
              <p-table [value]="variants.controls" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th style="width: 120px">SKU</th>
                    <th style="width: 120px">條碼</th>
                    <th>名稱</th>
                    <th style="width: 120px">成本價</th>
                    <th style="width: 120px">售價</th>
                    <th style="width: 80px">啟用</th>
                    <th style="width: 80px">操作</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-variant let-i="rowIndex">
                  <tr [formGroup]="getVariantFormGroup(i)">
                    <td><input pInputText formControlName="sku" placeholder="SKU" class="w-full" /></td>
                    <td><input pInputText formControlName="barcode" placeholder="條碼" class="w-full" /></td>
                    <td><input pInputText formControlName="name" placeholder="規格名稱" class="w-full" /></td>
                    <td><p-inputNumber formControlName="cost_price" mode="currency" currency="TWD" locale="zh-TW" [min]="0" styleClass="w-full"></p-inputNumber></td>
                    <td><p-inputNumber formControlName="selling_price" mode="currency" currency="TWD" locale="zh-TW" [min]="0" styleClass="w-full"></p-inputNumber></td>
                    <td class="text-center"><p-toggleswitch formControlName="is_active"></p-toggleswitch></td>
                    <td class="text-center"><button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="removeVariant(i)" pTooltip="刪除"></button></td>
                  </tr>
                </ng-template>
              </p-table>
            }
          </div>
        }

        <!-- 表單按鈕 -->
        <div class="form-actions">
          <button pButton type="button" label="取消" icon="pi pi-times" class="p-button-outlined" (click)="onCancel()"></button>
          <button pButton type="submit" [label]="isEditMode() ? '儲存變更' : '建立商品'" icon="pi pi-check" [loading]="saving()" [disabled]="form.invalid"></button>
        </div>
      </form>
    }
  `,
  styles: [`
    .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: var(--text-color-secondary); }
    .tab-selector { margin-bottom: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    @media (max-width: 1024px) { .form-grid { grid-template-columns: 1fr; } }
    .form-section { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .form-section h3 { margin: 0 0 1.5rem 0; color: var(--text-color); font-size: 1.1rem; font-weight: 600; }
    .field { margin-bottom: 1.5rem; }
    .field label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-color); }
    .field input, .field textarea { width: 100%; }
    .field-switch { display: flex; align-items: center; gap: 0.75rem; }
    .field-switch label { margin: 0; font-weight: 500; }
    .required { color: var(--red-500); }
    .profit-info { background: var(--surface-ground); border-radius: 6px; padding: 1rem; display: flex; gap: 2rem; }
    .profit-item { display: flex; align-items: center; gap: 0.5rem; }
    .profit-item .label { color: var(--text-color-secondary); }
    .profit-item .value { font-weight: 600; color: var(--green-500); }
    .profit-item .value.negative { color: var(--red-500); }
    .image-section { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .image-section h3 { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; }
    .current-image { margin-bottom: 2rem; }
    .no-image { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; background: var(--surface-ground); border-radius: 8px; color: var(--text-color-secondary); }
    .no-image i { font-size: 3rem; margin-bottom: 1rem; }
    .upload-section { margin-bottom: 1.5rem; }
    .upload-hint { display: block; margin-top: 0.5rem; color: var(--text-color-secondary); }
    .variants-section { background: var(--surface-card); border-radius: 8px; padding: 1.5rem; }
    .variants-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .variants-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .no-variants { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; background: var(--surface-ground); border-radius: 8px; color: var(--text-color-secondary); text-align: center; }
    .no-variants i { font-size: 3rem; margin-bottom: 1rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding: 1rem; background: var(--surface-card); border-radius: 8px; }
    .w-full { width: 100%; }
    .text-center { text-align: center; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
  `],
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  productName = signal('');
  productId: number | null = null;
  activeTab = 'basic';

  tabOptions = [
    { label: '基本資訊', value: 'basic' },
    { label: '商品圖片', value: 'image' },
    { label: '規格管理', value: 'variants' },
  ];

  categories = signal<Category[]>([]);
  units = signal<Unit[]>([]);
  taxTypes = signal<TaxType[]>([]);

  form: FormGroup = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    barcode: [''],
    category_id: [null],
    unit_id: [null],
    tax_type_id: [null],
    description: [''],
    cost_price: [0, [Validators.required, Validators.min(0)]],
    selling_price: [0, [Validators.required, Validators.min(0)]],
    min_stock: [null],
    max_stock: [null],
    is_active: [true],
    image_url: [''],
    variants: this.fb.array([]),
  });

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  ngOnInit(): void {
    this.loadDropdownOptions();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'create') {
      this.productId = +id;
      this.isEditMode.set(true);
      this.loadProduct(this.productId);
    }
  }

  private loadDropdownOptions(): void {
    setTimeout(() => {
      this.categories.set([
        { id: 1, code: 'C01', name: '乳製品', level: 1, sort_order: 1, is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'C02', name: '烘焙食品', level: 1, sort_order: 2, is_active: true, created_at: '', updated_at: '' },
        { id: 3, code: 'C03', name: '飲料', level: 1, sort_order: 3, is_active: true, created_at: '', updated_at: '' },
      ]);
      this.units.set([
        { id: 1, code: 'PCS', name: '個', is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'BOX', name: '盒', is_active: true, created_at: '', updated_at: '' },
        { id: 3, code: 'BTL', name: '瓶', is_active: true, created_at: '', updated_at: '' },
      ]);
      this.taxTypes.set([
        { id: 1, code: 'TAX5', name: '應稅 5%', rate: 0.05, is_active: true, created_at: '', updated_at: '' },
        { id: 2, code: 'TAX0', name: '零稅率', rate: 0, is_active: true, created_at: '', updated_at: '' },
      ]);
    }, 300);
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    setTimeout(() => {
      const mockProduct: Product = {
        id, code: 'P001', barcode: '4710088012345', name: '有機鮮奶 1L',
        description: '來自台灣在地牧場的有機鮮奶',
        category_id: 1, unit_id: 3, tax_type_id: 1,
        cost_price: 55, selling_price: 70, min_stock: 20, max_stock: 200,
        is_active: true, is_combo: false, image_url: '',
        variants: [
          { id: 1, product_id: id, sku: 'P001-S', barcode: '', name: '小瓶 500ml', attributes: {}, cost_price: 30, selling_price: 40, is_active: true, created_at: '', updated_at: '' },
        ],
        created_at: '', updated_at: '',
      };
      this.productName.set(mockProduct.name);
      this.form.patchValue(mockProduct);
      mockProduct.variants?.forEach(v => this.variants.push(this.createVariantFormGroup(v)));
      this.loading.set(false);
    }, 500);
  }

  private createVariantFormGroup(variant?: ProductVariant): FormGroup {
    return this.fb.group({
      id: [variant?.id || null],
      sku: [variant?.sku || '', Validators.required],
      barcode: [variant?.barcode || ''],
      name: [variant?.name || '', Validators.required],
      attributes: [variant?.attributes || {}],
      cost_price: [variant?.cost_price || 0, [Validators.required, Validators.min(0)]],
      selling_price: [variant?.selling_price || 0, [Validators.required, Validators.min(0)]],
      is_active: [variant?.is_active ?? true],
    });
  }

  getVariantFormGroup(index: number): FormGroup {
    return this.variants.at(index) as FormGroup;
  }

  addVariant(): void {
    this.variants.push(this.createVariantFormGroup());
  }

  removeVariant(index: number): void {
    this.confirmationService.confirm({
      message: '確定要刪除此規格嗎？', header: '確認刪除', icon: 'pi pi-exclamation-triangle',
      acceptLabel: '刪除', rejectLabel: '取消', acceptButtonStyleClass: 'p-button-danger',
      accept: () => { this.variants.removeAt(index); },
    });
  }

  getProfit(): number {
    return (this.form.get('selling_price')?.value || 0) - (this.form.get('cost_price')?.value || 0);
  }

  getProfitMargin(): number {
    const sell = this.form.get('selling_price')?.value || 0;
    return sell === 0 ? 0 : (this.getProfit() / sell) * 100;
  }

  onImageSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.form.patchValue({ image_url: e.target.result });
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.form.patchValue({ image_url: '' });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.messageService.add({ severity: 'success', summary: '成功', detail: this.isEditMode() ? '商品已更新' : '商品已建立' });
      this.router.navigate(['/base-data/products']);
    }, 1000);
  }

  onCancel(): void {
    if (this.form.dirty) {
      this.confirmationService.confirm({
        message: '您有未儲存的變更，確定要離開嗎？', header: '確認離開', icon: 'pi pi-exclamation-triangle',
        acceptLabel: '離開', rejectLabel: '取消',
        accept: () => this.router.navigate(['/base-data/products']),
      });
    } else {
      this.router.navigate(['/base-data/products']);
    }
  }
}
