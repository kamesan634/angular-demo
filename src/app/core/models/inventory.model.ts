/**
 * 庫存相關資料模型
 */

/**
 * 庫存
 */
export interface Inventory {
  id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  variant?: import('./product.model').ProductVariant;
  warehouse_id: number;
  warehouse?: import('./user.model').Warehouse;
  quantity: number;
  reserved_quantity: number; // 保留數量 (已下單未出貨)
  available_quantity: number; // 可用數量 = quantity - reserved_quantity
  updated_at: string;
}

/**
 * 庫存異動紀錄
 */
export interface InventoryMovement {
  id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  warehouse_id: number;
  warehouse?: import('./user.model').Warehouse;
  type: MovementType;
  quantity: number; // 正數表示入庫，負數表示出庫
  before_quantity: number;
  after_quantity: number;
  reference_type?: string; // 關聯單據類型 (order, purchase, transfer, adjustment)
  reference_id?: number;
  reference_no?: string;
  notes?: string;
  user_id: number;
  user?: import('./user.model').User;
  created_at: string;
}

/**
 * 異動類型
 */
export type MovementType =
  | 'purchase_in' // 採購入庫
  | 'sales_out' // 銷售出庫
  | 'return_in' // 退貨入庫
  | 'return_out' // 退貨出庫
  | 'transfer_in' // 調撥入庫
  | 'transfer_out' // 調撥出庫
  | 'adjustment' // 庫存調整
  | 'stock_count'; // 盤點調整

/**
 * 庫存調整請求
 */
export interface InventoryAdjustmentRequest {
  product_id: number;
  variant_id?: number;
  warehouse_id: number;
  quantity: number; // 調整後數量
  reason: string;
}

/**
 * 庫存盤點單
 */
export interface StockCount {
  id: number;
  count_no: string;
  warehouse_id: number;
  warehouse?: import('./user.model').Warehouse;
  status: StockCountStatus;
  count_date: string;
  items: StockCountItem[];
  notes?: string;
  created_by: number;
  created_user?: import('./user.model').User;
  approved_by?: number;
  approved_user?: import('./user.model').User;
  created_at: string;
  updated_at: string;
}

/**
 * 盤點單狀態
 */
export type StockCountStatus = 'draft' | 'counting' | 'completed' | 'approved' | 'cancelled';

/**
 * 盤點單項目
 */
export interface StockCountItem {
  id: number;
  stock_count_id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  system_quantity: number; // 系統數量
  counted_quantity?: number; // 實際盤點數量
  difference?: number; // 差異 = counted_quantity - system_quantity
}

/**
 * 建立盤點單請求
 */
export interface CreateStockCountRequest {
  warehouse_id: number;
  count_date: string;
  product_ids?: number[]; // 指定盤點的商品，空表示全部
  notes?: string;
}

/**
 * 更新盤點數量請求
 */
export interface UpdateStockCountItemRequest {
  item_id: number;
  counted_quantity: number;
}

/**
 * 庫存調撥單
 */
export interface StockTransfer {
  id: number;
  transfer_no: string;
  from_warehouse_id: number;
  from_warehouse?: import('./user.model').Warehouse;
  to_warehouse_id: number;
  to_warehouse?: import('./user.model').Warehouse;
  status: TransferStatus;
  items: StockTransferItem[];
  notes?: string;
  created_by: number;
  created_user?: import('./user.model').User;
  approved_by?: number;
  approved_user?: import('./user.model').User;
  shipped_at?: string;
  received_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 調撥單狀態
 */
export type TransferStatus = 'draft' | 'submitted' | 'approved' | 'shipped' | 'received' | 'cancelled';

/**
 * 調撥單項目
 */
export interface StockTransferItem {
  id: number;
  transfer_id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  quantity: number;
  received_quantity?: number;
}

/**
 * 建立調撥單請求
 */
export interface CreateStockTransferRequest {
  from_warehouse_id: number;
  to_warehouse_id: number;
  items: CreateStockTransferItemRequest[];
  notes?: string;
}

/**
 * 建立調撥單項目請求
 */
export interface CreateStockTransferItemRequest {
  product_id: number;
  variant_id?: number;
  quantity: number;
}

/**
 * 量販價格
 */
export interface VolumePrice {
  id: number;
  product_id: number;
  product?: import('./product.model').Product;
  variant_id?: number;
  min_quantity: number;
  price: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立量販價格請求
 */
export interface CreateVolumePriceRequest {
  product_id: number;
  variant_id?: number;
  min_quantity: number;
  price: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}
