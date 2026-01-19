/**
 * 訂單相關資料模型
 */

/**
 * 訂單狀態
 */
export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

/**
 * 付款狀態
 */
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

/**
 * 訂單
 */
export interface Order {
  id: number;
  order_no: string;
  store_id: number;
  store?: import('./user.model').Store;
  customer_id?: number;
  customer?: Customer;
  user_id: number;
  user?: import('./user.model').User;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  items: OrderItem[];
  payments: OrderPayment[];
  promotion_id?: number;
  coupon_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 訂單項目
 */
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  variant?: import('./product.model').ProductVariant;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
}

/**
 * 訂單付款
 */
export interface OrderPayment {
  id: number;
  order_id: number;
  payment_method_id: number;
  payment_method?: PaymentMethod;
  amount: number;
  reference?: string;
  paid_at: string;
}

/**
 * 建立訂單請求
 */
export interface CreateOrderRequest {
  store_id: number;
  customer_id?: number;
  items: CreateOrderItemRequest[];
  promotion_id?: number;
  coupon_code?: string;
  notes?: string;
}

/**
 * 建立訂單項目請求
 */
export interface CreateOrderItemRequest {
  product_id: number;
  variant_id?: number;
  quantity: number;
  unit_price?: number;
  discount_amount?: number;
}

/**
 * 訂單付款請求
 */
export interface OrderPaymentRequest {
  payment_method_id: number;
  amount: number;
  reference?: string;
}

/**
 * 付款方式
 */
export interface PaymentMethod {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立付款方式請求
 */
export interface CreatePaymentMethodRequest {
  code: string;
  name: string;
  is_active?: boolean;
}

/**
 * 客戶
 */
export interface Customer {
  id: number;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  level_id?: number;
  level?: CustomerLevel;
  points: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立客戶請求
 */
export interface CreateCustomerRequest {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  level_id?: number;
  is_active?: boolean;
}

/**
 * 更新客戶請求
 */
export interface UpdateCustomerRequest {
  code?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  level_id?: number;
  is_active?: boolean;
}

/**
 * 客戶等級
 */
export interface CustomerLevel {
  id: number;
  name: string;
  discount_rate: number; // 折扣率 (例如: 0.1 = 10%)
  min_points: number; // 達到此等級所需最低點數
  points_multiplier: number; // 點數倍率
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立客戶等級請求
 */
export interface CreateCustomerLevelRequest {
  name: string;
  discount_rate: number;
  min_points: number;
  points_multiplier?: number;
  is_active?: boolean;
}

/**
 * 銷售退貨
 */
export interface SalesReturn {
  id: number;
  return_no: string;
  order_id: number;
  order?: Order;
  store_id: number;
  store?: import('./user.model').Store;
  user_id: number;
  user?: import('./user.model').User;
  status: ReturnStatus;
  reason: string;
  total_amount: number;
  refund_amount: number;
  items: SalesReturnItem[];
  created_at: string;
  updated_at: string;
}

/**
 * 退貨狀態
 */
export type ReturnStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';

/**
 * 銷售退貨項目
 */
export interface SalesReturnItem {
  id: number;
  return_id: number;
  order_item_id: number;
  order_item?: OrderItem;
  product_id: number;
  product?: import('./product.model').Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/**
 * 建立銷售退貨請求
 */
export interface CreateSalesReturnRequest {
  order_id: number;
  reason: string;
  items: CreateSalesReturnItemRequest[];
}

/**
 * 建立銷售退貨項目請求
 */
export interface CreateSalesReturnItemRequest {
  order_item_id: number;
  quantity: number;
}

/**
 * 促銷活動
 */
export interface Promotion {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 促銷類型
 */
export type PromotionType = 'order' | 'product' | 'category';

/**
 * 折扣類型
 */
export type DiscountType = 'percentage' | 'fixed';

/**
 * 建立促銷活動請求
 */
export interface CreatePromotionRequest {
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

/**
 * 優惠券
 */
export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立優惠券請求
 */
export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

/**
 * 發票
 */
export interface Invoice {
  id: number;
  invoice_no: string;
  order_id: number;
  order?: Order;
  type: InvoiceType;
  buyer_name?: string;
  buyer_tax_id?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  issued_at: string;
  voided_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 發票類型
 */
export type InvoiceType = 'electronic' | 'paper' | 'donation';

/**
 * 建立發票請求
 */
export interface CreateInvoiceRequest {
  order_id: number;
  type: InvoiceType;
  buyer_name?: string;
  buyer_tax_id?: string;
}
