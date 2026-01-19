/**
 * 商品服務
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductVariant,
  CreateProductVariantRequest,
  Combo,
  PaginatedResponse,
  ListQueryParams,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends ApiService<Product, CreateProductRequest, UpdateProductRequest> {
  protected endpoint = 'products';

  /**
   * 依條碼查詢商品
   */
  getByBarcode(barcode: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/barcode/${barcode}`);
  }

  /**
   * 依分類查詢商品
   */
  getByCategory(categoryId: number, params?: ListQueryParams): Observable<PaginatedResponse<Product>> {
    const httpParams = this.buildQueryParams(params);
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/category/${categoryId}`, {
      params: httpParams,
    });
  }

  /**
   * 取得商品規格
   */
  getVariants(productId: number): Observable<ProductVariant[]> {
    return this.http.get<ProductVariant[]>(`${this.apiUrl}/${productId}/variants`);
  }

  /**
   * 新增商品規格
   */
  createVariant(productId: number, data: CreateProductVariantRequest): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.apiUrl}/${productId}/variants`, data);
  }

  /**
   * 更新商品規格
   */
  updateVariant(
    productId: number,
    variantId: number,
    data: Partial<CreateProductVariantRequest>
  ): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(`${this.apiUrl}/${productId}/variants/${variantId}`, data);
  }

  /**
   * 刪除商品規格
   */
  deleteVariant(productId: number, variantId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}/variants/${variantId}`);
  }

  /**
   * 取得商品組合
   */
  getCombos(): Observable<Combo[]> {
    return this.http.get<Combo[]>(`${this.baseUrl}/combos`);
  }

  /**
   * 列印商品標籤
   */
  printLabels(productIds: number[]): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/product-labels/print`, { product_ids: productIds }, {
      responseType: 'blob',
    });
  }

  /**
   * 批次更新價格
   */
  batchUpdatePrices(
    updates: { id: number; cost_price?: number; selling_price?: number }[]
  ): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/batch/prices`, { items: updates });
  }

  /**
   * 複製商品
   */
  duplicate(productId: number, newCode: string): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/${productId}/duplicate`, { code: newCode });
  }
}
