/**
 * POS 銷售頁面元件
 */
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { Product } from '@core/models';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, CardModule,
    DialogModule, InputNumberModule, SelectModule, DividerModule,
    BadgeModule, TooltipModule, IconFieldModule, InputIconModule, CurrencyPipe,
  ],
  template: `
    <div class="pos-container">
      <!-- 左側：商品選擇 -->
      <div class="pos-products">
        <div class="products-header">
          <p-iconField iconPosition="left" class="search-field">
            <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
            <input pInputText [(ngModel)]="searchValue" placeholder="搜尋商品或掃描條碼..." (keyup.enter)="searchProduct()" />
          </p-iconField>
          <p-select [options]="categoryOptions" [(ngModel)]="selectedCategory" placeholder="所有分類" [showClear]="true" class="category-select"></p-select>
        </div>

        <div class="products-grid">
          @for (product of filteredProducts(); track product.id) {
            <div class="product-card" (click)="addToCart(product)">
              <div class="product-image">
                <i class="pi pi-box"></i>
              </div>
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-price">{{ product.selling_price | currency:'TWD':'symbol':'1.0-0' }}</div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- 右側：購物車 -->
      <div class="pos-cart">
        <div class="cart-header">
          <h3>
            <i class="pi pi-shopping-cart"></i>
            購物車
            @if (cartItems().length > 0) {
              <p-badge [value]="cartItems().length.toString()"></p-badge>
            }
          </h3>
          <button pButton icon="pi pi-trash" class="p-button-text p-button-danger" (click)="clearCart()" pTooltip="清空購物車" [disabled]="cartItems().length === 0"></button>
        </div>

        <div class="cart-items">
          @for (item of cartItems(); track item.product.id) {
            <div class="cart-item">
              <div class="item-info">
                <div class="item-name">{{ item.product.name }}</div>
                <div class="item-price">{{ item.unitPrice | currency:'TWD':'symbol':'1.0-0' }}</div>
              </div>
              <div class="item-quantity">
                <button pButton icon="pi pi-minus" class="p-button-text p-button-sm" (click)="decreaseQuantity(item)"></button>
                <span class="quantity">{{ item.quantity }}</span>
                <button pButton icon="pi pi-plus" class="p-button-text p-button-sm" (click)="increaseQuantity(item)"></button>
              </div>
              <div class="item-subtotal">{{ item.subtotal | currency:'TWD':'symbol':'1.0-0' }}</div>
              <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" (click)="removeFromCart(item)"></button>
            </div>
          } @empty {
            <div class="cart-empty">
              <i class="pi pi-shopping-cart"></i>
              <p>購物車是空的</p>
            </div>
          }
        </div>

        <div class="cart-summary">
          <div class="summary-row">
            <span>小計</span>
            <span>{{ subtotal() | currency:'TWD':'symbol':'1.0-0' }}</span>
          </div>
          <div class="summary-row">
            <span>折扣</span>
            <span class="discount">-{{ totalDiscount() | currency:'TWD':'symbol':'1.0-0' }}</span>
          </div>
          <div class="summary-row">
            <span>稅額 (5%)</span>
            <span>{{ taxAmount() | currency:'TWD':'symbol':'1.0-0' }}</span>
          </div>
          <p-divider></p-divider>
          <div class="summary-row total">
            <span>總計</span>
            <span>{{ totalAmount() | currency:'TWD':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <div class="cart-actions">
          <button pButton label="掛單" icon="pi pi-bookmark" class="p-button-outlined" [disabled]="cartItems().length === 0"></button>
          <button pButton label="結帳" icon="pi pi-credit-card" class="checkout-btn" (click)="openCheckoutDialog()" [disabled]="cartItems().length === 0"></button>
        </div>
      </div>
    </div>

    <!-- 結帳對話框 -->
    <p-dialog [(visible)]="checkoutDialogVisible" header="結帳" [modal]="true" [style]="{ width: '450px' }">
      <div class="checkout-summary">
        <div class="summary-row total">
          <span>應收金額</span>
          <span>{{ totalAmount() | currency:'TWD':'symbol':'1.0-0' }}</span>
        </div>
      </div>

      <div class="form-field">
        <label>付款方式</label>
        <p-select [options]="paymentMethods" [(ngModel)]="selectedPaymentMethod" class="w-full"></p-select>
      </div>

      <div class="form-field">
        <label>收款金額</label>
        <p-inputNumber [(ngModel)]="receivedAmount" mode="currency" currency="TWD" locale="zh-TW" class="w-full"></p-inputNumber>
      </div>

      <div class="form-field">
        <div class="change-display" [class.negative]="changeAmount() < 0">
          <span>找零</span>
          <span class="change-amount">{{ changeAmount() | currency:'TWD':'symbol':'1.0-0' }}</span>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button pButton label="取消" class="p-button-text" (click)="checkoutDialogVisible = false"></button>
        <button pButton label="確認結帳" (click)="completeCheckout()" [disabled]="changeAmount() < 0"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .pos-container {
      display: flex;
      height: calc(100vh - 120px);
      gap: 1rem;
    }
    .pos-products {
      flex: 1;
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }
    .products-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .search-field { flex: 1; }
    .category-select { width: 150px; }
    .products-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
      overflow-y: auto;
      align-content: start;
    }
    .product-card {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .product-card:hover {
      border-color: var(--primary-color);
      transform: translateY(-2px);
    }
    .product-image {
      font-size: 2rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.5rem;
    }
    .product-name {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .product-price {
      color: var(--primary-color);
      font-weight: 600;
    }
    .pos-cart {
      width: 380px;
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }
    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .cart-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .cart-items {
      flex: 1;
      overflow-y: auto;
    }
    .cart-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }
    .item-info { flex: 1; }
    .item-name { font-weight: 500; }
    .item-price { font-size: 0.875rem; color: var(--text-color-secondary); }
    .item-quantity {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .quantity {
      min-width: 24px;
      text-align: center;
      font-weight: 600;
    }
    .item-subtotal {
      min-width: 80px;
      text-align: right;
      font-weight: 600;
    }
    .cart-empty {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-color-secondary);
    }
    .cart-empty i { font-size: 3rem; margin-bottom: 1rem; }
    .cart-summary {
      border-top: 1px solid var(--surface-border);
      padding-top: 1rem;
      margin-top: auto;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .summary-row.total {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .discount { color: var(--red-500); }
    .cart-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .cart-actions button { flex: 1; }
    .checkout-btn { font-size: 1.1rem; }
    .checkout-summary { margin-bottom: 1.5rem; }
    .form-field { margin-bottom: 1rem; }
    .form-field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .w-full { width: 100%; }
    .change-display {
      background: var(--surface-ground);
      padding: 1rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .change-display.negative { background: var(--red-100); }
    .change-amount { font-size: 1.5rem; font-weight: 700; color: var(--primary-color); }
    .change-display.negative .change-amount { color: var(--red-500); }
  `],
})
export class PosComponent implements OnInit {
  private readonly messageService = inject(MessageService);

  searchValue = '';
  selectedCategory: string | null = null;
  cartItems = signal<CartItem[]>([]);
  checkoutDialogVisible = false;
  selectedPaymentMethod = 'cash';
  receivedAmount = 0;

  products = signal<Product[]>([]);

  categoryOptions = [
    { label: '乳製品', value: 'dairy' },
    { label: '烘焙食品', value: 'bakery' },
    { label: '飲料', value: 'beverage' },
    { label: '零食', value: 'snack' },
  ];

  paymentMethods = [
    { label: '現金', value: 'cash' },
    { label: '信用卡', value: 'credit_card' },
    { label: 'LINE Pay', value: 'line_pay' },
    { label: '悠遊卡', value: 'easycard' },
  ];

  filteredProducts = computed(() => {
    let result = this.products();
    if (this.searchValue) {
      const search = this.searchValue.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search));
    }
    return result;
  });

  subtotal = computed(() => this.cartItems().reduce((sum, item) => sum + item.subtotal, 0));
  totalDiscount = computed(() => this.cartItems().reduce((sum, item) => sum + item.discount, 0));
  taxAmount = computed(() => Math.round(this.subtotal() * 0.05));
  totalAmount = computed(() => this.subtotal() - this.totalDiscount() + this.taxAmount());
  changeAmount = computed(() => this.receivedAmount - this.totalAmount());

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.products.set([
      { id: 1, code: 'P001', name: '有機鮮奶 1L', cost_price: 55, selling_price: 70, is_active: true, is_combo: false, created_at: '', updated_at: '' },
      { id: 2, code: 'P002', name: '法式吐司麵包', cost_price: 35, selling_price: 50, is_active: true, is_combo: false, created_at: '', updated_at: '' },
      { id: 3, code: 'P003', name: '經典美式咖啡', cost_price: 30, selling_price: 50, is_active: true, is_combo: false, created_at: '', updated_at: '' },
      { id: 4, code: 'P004', name: '原味優格', cost_price: 25, selling_price: 40, is_active: true, is_combo: false, created_at: '', updated_at: '' },
      { id: 5, code: 'P005', name: '巧克力蛋糕', cost_price: 80, selling_price: 120, is_active: true, is_combo: false, created_at: '', updated_at: '' },
      { id: 6, code: 'P006', name: '草莓果醬', cost_price: 45, selling_price: 65, is_active: true, is_combo: false, created_at: '', updated_at: '' },
      { id: 7, code: 'P007', name: '無糖綠茶', cost_price: 15, selling_price: 25, is_active: true, is_combo: false, created_at: '', updated_at: '' },
      { id: 8, code: 'P008', name: '薯片 (大)', cost_price: 30, selling_price: 45, is_active: true, is_combo: false, created_at: '', updated_at: '' },
    ]);
  }

  searchProduct(): void {
    // 搜尋或條碼掃描
  }

  addToCart(product: Product): void {
    const items = this.cartItems();
    const existingItem = items.find(item => item.product.id === product.id);
    if (existingItem) {
      existingItem.quantity++;
      existingItem.subtotal = existingItem.quantity * existingItem.unitPrice;
      this.cartItems.set([...items]);
    } else {
      this.cartItems.set([...items, {
        product,
        quantity: 1,
        unitPrice: product.selling_price,
        discount: 0,
        subtotal: product.selling_price,
      }]);
    }
  }

  increaseQuantity(item: CartItem): void {
    item.quantity++;
    item.subtotal = item.quantity * item.unitPrice;
    this.cartItems.set([...this.cartItems()]);
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
      item.subtotal = item.quantity * item.unitPrice;
      this.cartItems.set([...this.cartItems()]);
    } else {
      this.removeFromCart(item);
    }
  }

  removeFromCart(item: CartItem): void {
    this.cartItems.set(this.cartItems().filter(i => i.product.id !== item.product.id));
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  openCheckoutDialog(): void {
    this.receivedAmount = this.totalAmount();
    this.checkoutDialogVisible = true;
  }

  completeCheckout(): void {
    this.messageService.add({
      severity: 'success',
      summary: '結帳成功',
      detail: `訂單金額 ${this.totalAmount()} 元，找零 ${this.changeAmount()} 元`,
    });
    this.checkoutDialogVisible = false;
    this.clearCart();
  }
}
