/**
 * 採購服務
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierPrice,
  CreateSupplierPriceRequest,
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  PurchaseReceipt,
  CreatePurchaseReceiptRequest,
  PurchaseReturn,
  CreatePurchaseReturnRequest,
  PurchaseSuggestion,
  PaginatedResponse,
  ListQueryParams,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class SupplierService extends ApiService<Supplier, CreateSupplierRequest, UpdateSupplierRequest> {
  protected endpoint = 'suppliers';

  /**
   * 取得供應商的商品價格
   */
  getPrices(supplierId: number, params?: ListQueryParams): Observable<PaginatedResponse<SupplierPrice>> {
    const httpParams = this.buildQueryParams(params);
    return this.http.get<PaginatedResponse<SupplierPrice>>(`${this.apiUrl}/${supplierId}/prices`, {
      params: httpParams,
    });
  }
}

@Injectable({
  providedIn: 'root',
})
export class SupplierPriceService extends ApiService<SupplierPrice, CreateSupplierPriceRequest, Partial<SupplierPrice>> {
  protected endpoint = 'supplier-prices';

  /**
   * 比價 - 取得商品的所有供應商價格
   */
  compare(productId: number, variantId?: number): Observable<SupplierPrice[]> {
    const params: Record<string, string> = { product_id: productId.toString() };
    if (variantId) {
      params['variant_id'] = variantId.toString();
    }
    return this.http.get<SupplierPrice[]>(`${this.apiUrl}/compare`, { params });
  }

  /**
   * 批次匯入供應商價格
   */
  override import(file: File): Observable<{ success: number; failed: number; errors?: unknown[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: number; failed: number; errors?: unknown[] }>(
      `${this.apiUrl}/import`,
      formData
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrderService extends ApiService<PurchaseOrder, CreatePurchaseOrderRequest, Partial<PurchaseOrder>> {
  protected endpoint = 'purchase-orders';

  /**
   * 依供應商查詢採購單
   */
  getBySupplier(supplierId: number, params?: ListQueryParams): Observable<PaginatedResponse<PurchaseOrder>> {
    const httpParams = this.buildQueryParams({ ...params, supplier_id: supplierId });
    return this.http.get<PaginatedResponse<PurchaseOrder>>(this.apiUrl, { params: httpParams });
  }

  /**
   * 提交採購單
   */
  submit(id: number): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/submit`, {});
  }

  /**
   * 核准採購單
   */
  approve(id: number): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * 駁回採購單
   */
  reject(id: number, reason: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * 取消採購單
   */
  cancel(id: number, reason?: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  /**
   * 從採購建議建立採購單
   */
  createFromSuggestions(suggestionIds: number[], supplierId: number, warehouseId: number): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/from-suggestions`, {
      suggestion_ids: suggestionIds,
      supplier_id: supplierId,
      warehouse_id: warehouseId,
    });
  }
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseReceiptService extends ApiService<PurchaseReceipt, CreatePurchaseReceiptRequest, Partial<PurchaseReceipt>> {
  protected endpoint = 'purchase-receipts';

  /**
   * 完成驗收
   */
  complete(id: number): Observable<PurchaseReceipt> {
    return this.http.post<PurchaseReceipt>(`${this.apiUrl}/${id}/complete`, {});
  }

  /**
   * 取消驗收
   */
  cancel(id: number, reason?: string): Observable<PurchaseReceipt> {
    return this.http.post<PurchaseReceipt>(`${this.apiUrl}/${id}/cancel`, { reason });
  }
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseReturnService extends ApiService<PurchaseReturn, CreatePurchaseReturnRequest, Partial<PurchaseReturn>> {
  protected endpoint = 'purchase-returns';

  /**
   * 提交採購退貨
   */
  submit(id: number): Observable<PurchaseReturn> {
    return this.http.post<PurchaseReturn>(`${this.apiUrl}/${id}/submit`, {});
  }

  /**
   * 核准採購退貨
   */
  approve(id: number): Observable<PurchaseReturn> {
    return this.http.post<PurchaseReturn>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * 出貨 (退回給供應商)
   */
  ship(id: number): Observable<PurchaseReturn> {
    return this.http.post<PurchaseReturn>(`${this.apiUrl}/${id}/ship`, {});
  }

  /**
   * 完成退貨
   */
  complete(id: number): Observable<PurchaseReturn> {
    return this.http.post<PurchaseReturn>(`${this.apiUrl}/${id}/complete`, {});
  }

  /**
   * 取消退貨
   */
  cancel(id: number, reason?: string): Observable<PurchaseReturn> {
    return this.http.post<PurchaseReturn>(`${this.apiUrl}/${id}/cancel`, { reason });
  }
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseSuggestionService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = `${environment.apiUrl}/purchase-suggestions`;

  /**
   * 取得採購建議
   */
  getAll(params?: ListQueryParams & { warehouse_id?: number }): Observable<PaginatedResponse<PurchaseSuggestion>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<PaginatedResponse<PurchaseSuggestion>>(this.baseUrl, { params: httpParams });
  }

  /**
   * 重新產生採購建議
   */
  regenerate(warehouseId?: number): Observable<void> {
    const body = warehouseId ? { warehouse_id: warehouseId } : {};
    return this.http.post<void>(`${this.baseUrl}/regenerate`, body);
  }
}

// 需要額外引入
import { inject } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
