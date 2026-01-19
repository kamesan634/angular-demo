/**
 * 採購相關資料模型
 */

/**
 * 供應商
 */
export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: number; // 付款天數
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立供應商請求
 */
export interface CreateSupplierRequest {
  code: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: number;
  is_active?: boolean;
}

/**
 * 更新供應商請求
 */
export interface UpdateSupplierRequest {
  code?: string;
  name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: number;
  is_active?: boolean;
}

/**
 * 供應商價格
 */
export interface SupplierPrice {
  id: number;
  supplier_id: number;
  supplier?: Supplier;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  price: number;
  min_order_quantity?: number;
  lead_time_days?: number; // 交貨天數
  is_preferred: boolean; // 是否為首選供應商
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立供應商價格請求
 */
export interface CreateSupplierPriceRequest {
  supplier_id: number;
  product_id: number;
  variant_id?: number;
  price: number;
  min_order_quantity?: number;
  lead_time_days?: number;
  is_preferred?: boolean;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

/**
 * 採購單
 */
export interface PurchaseOrder {
  id: number;
  po_no: string;
  supplier_id: number;
  supplier?: Supplier;
  warehouse_id: number;
  warehouse?: import('./user.model').Warehouse;
  status: PurchaseOrderStatus;
  expected_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  items: PurchaseOrderItem[];
  notes?: string;
  created_by: number;
  created_user?: import('./user.model').User;
  approved_by?: number;
  approved_user?: import('./user.model').User;
  created_at: string;
  updated_at: string;
}

/**
 * 採購單狀態
 */
export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'partial' | 'completed' | 'cancelled';

/**
 * 採購單項目
 */
export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
}

/**
 * 建立採購單請求
 */
export interface CreatePurchaseOrderRequest {
  supplier_id: number;
  warehouse_id: number;
  expected_date?: string;
  items: CreatePurchaseOrderItemRequest[];
  notes?: string;
}

/**
 * 建立採購單項目請求
 */
export interface CreatePurchaseOrderItemRequest {
  product_id: number;
  variant_id?: number;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
}

/**
 * 驗收單
 */
export interface PurchaseReceipt {
  id: number;
  receipt_no: string;
  purchase_order_id: number;
  purchase_order?: PurchaseOrder;
  warehouse_id: number;
  warehouse?: import('./user.model').Warehouse;
  status: ReceiptStatus;
  received_date: string;
  items: PurchaseReceiptItem[];
  notes?: string;
  received_by: number;
  received_user?: import('./user.model').User;
  created_at: string;
  updated_at: string;
}

/**
 * 驗收單狀態
 */
export type ReceiptStatus = 'pending' | 'completed' | 'cancelled';

/**
 * 驗收單項目
 */
export interface PurchaseReceiptItem {
  id: number;
  receipt_id: number;
  po_item_id: number;
  po_item?: PurchaseOrderItem;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  ordered_quantity: number;
  received_quantity: number;
  rejected_quantity: number;
  rejection_reason?: string;
}

/**
 * 建立驗收單請求
 */
export interface CreatePurchaseReceiptRequest {
  purchase_order_id: number;
  received_date: string;
  items: CreatePurchaseReceiptItemRequest[];
  notes?: string;
}

/**
 * 建立驗收單項目請求
 */
export interface CreatePurchaseReceiptItemRequest {
  po_item_id: number;
  received_quantity: number;
  rejected_quantity?: number;
  rejection_reason?: string;
}

/**
 * 採購退貨單
 */
export interface PurchaseReturn {
  id: number;
  return_no: string;
  supplier_id: number;
  supplier?: Supplier;
  purchase_order_id?: number;
  purchase_order?: PurchaseOrder;
  warehouse_id: number;
  warehouse?: import('./user.model').Warehouse;
  status: PurchaseReturnStatus;
  reason: string;
  total_amount: number;
  items: PurchaseReturnItem[];
  created_by: number;
  created_user?: import('./user.model').User;
  created_at: string;
  updated_at: string;
}

/**
 * 採購退貨狀態
 */
export type PurchaseReturnStatus = 'draft' | 'submitted' | 'approved' | 'shipped' | 'completed' | 'cancelled';

/**
 * 採購退貨項目
 */
export interface PurchaseReturnItem {
  id: number;
  return_id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  reason?: string;
}

/**
 * 建立採購退貨請求
 */
export interface CreatePurchaseReturnRequest {
  supplier_id: number;
  purchase_order_id?: number;
  warehouse_id: number;
  reason: string;
  items: CreatePurchaseReturnItemRequest[];
}

/**
 * 建立採購退貨項目請求
 */
export interface CreatePurchaseReturnItemRequest {
  product_id: number;
  variant_id?: number;
  quantity: number;
  unit_price: number;
  reason?: string;
}

/**
 * 採購建議
 */
export interface PurchaseSuggestion {
  id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  warehouse_id: number;
  warehouse?: import('./user.model').Warehouse;
  current_quantity: number;
  min_stock: number;
  suggested_quantity: number;
  preferred_supplier_id?: number;
  preferred_supplier?: Supplier;
  suggested_price?: number;
  created_at: string;
}
