/**
 * 商品相關資料模型
 */

/**
 * 商品
 */
export interface Product {
  id: number;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  category?: Category;
  unit_id?: number;
  unit?: Unit;
  tax_type_id?: number;
  tax_type?: TaxType;
  cost_price: number;
  selling_price: number;
  min_stock?: number;
  max_stock?: number;
  is_active: boolean;
  is_combo: boolean;
  image_url?: string;
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

/**
 * 建立商品請求
 */
export interface CreateProductRequest {
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  unit_id?: number;
  tax_type_id?: number;
  cost_price: number;
  selling_price: number;
  min_stock?: number;
  max_stock?: number;
  is_active?: boolean;
  image_url?: string;
}

/**
 * 更新商品請求
 */
export interface UpdateProductRequest {
  code?: string;
  barcode?: string;
  name?: string;
  description?: string;
  category_id?: number;
  unit_id?: number;
  tax_type_id?: number;
  cost_price?: number;
  selling_price?: number;
  min_stock?: number;
  max_stock?: number;
  is_active?: boolean;
  image_url?: string;
}

/**
 * 商品規格
 */
export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  barcode?: string;
  name: string;
  attributes: Record<string, string>; // 例如: { "顏色": "紅", "尺寸": "M" }
  cost_price: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立商品規格請求
 */
export interface CreateProductVariantRequest {
  product_id: number;
  sku: string;
  barcode?: string;
  name: string;
  attributes: Record<string, string>;
  cost_price: number;
  selling_price: number;
  is_active?: boolean;
}

/**
 * 商品組合
 */
export interface Combo {
  id: number;
  product_id: number;
  product?: Product;
  name: string;
  items: ComboItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 組合項目
 */
export interface ComboItem {
  id: number;
  combo_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
}

/**
 * 分類
 */
export interface Category {
  id: number;
  code: string;
  name: string;
  parent_id?: number;
  parent?: Category;
  children?: Category[];
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立分類請求
 */
export interface CreateCategoryRequest {
  code: string;
  name: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * 更新分類請求
 */
export interface UpdateCategoryRequest {
  code?: string;
  name?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * 單位
 */
export interface Unit {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立單位請求
 */
export interface CreateUnitRequest {
  code: string;
  name: string;
  is_active?: boolean;
}

/**
 * 稅別
 */
export interface TaxType {
  id: number;
  code: string;
  name: string;
  rate: number; // 稅率 (例如: 0.05 = 5%)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立稅別請求
 */
export interface CreateTaxTypeRequest {
  code: string;
  name: string;
  rate: number;
  is_active?: boolean;
}
