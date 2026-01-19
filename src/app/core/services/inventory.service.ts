/**
 * 庫存服務
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Inventory,
  InventoryMovement,
  InventoryAdjustmentRequest,
  StockCount,
  CreateStockCountRequest,
  UpdateStockCountItemRequest,
  StockTransfer,
  CreateStockTransferRequest,
  PaginatedResponse,
  ListQueryParams,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class InventoryService extends ApiService<Inventory, never, never> {
  protected endpoint = 'inventories';

  /**
   * 依倉庫查詢庫存
   */
  getByWarehouse(warehouseId: number, params?: ListQueryParams): Observable<PaginatedResponse<Inventory>> {
    const httpParams = this.buildQueryParams({ ...params, warehouse_id: warehouseId });
    return this.http.get<PaginatedResponse<Inventory>>(this.apiUrl, { params: httpParams });
  }

  /**
   * 依商品查詢庫存
   */
  getByProduct(productId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiUrl}/product/${productId}`);
  }

  /**
   * 庫存調整
   */
  adjust(request: InventoryAdjustmentRequest): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.apiUrl}/adjust`, request);
  }

  /**
   * 取得庫存異動紀錄
   */
  getMovements(params?: ListQueryParams & {
    product_id?: number;
    warehouse_id?: number;
    type?: string;
    start_date?: string;
    end_date?: string;
  }): Observable<PaginatedResponse<InventoryMovement>> {
    const httpParams = this.buildQueryParams(params);
    return this.http.get<PaginatedResponse<InventoryMovement>>(`${this.apiUrl}/movements`, {
      params: httpParams,
    });
  }

  /**
   * 取得低庫存商品
   */
  getLowStock(warehouseId?: number): Observable<Inventory[]> {
    const httpParams = warehouseId
      ? this.buildQueryParams({ warehouse_id: warehouseId })
      : undefined;
    return this.http.get<Inventory[]>(`${this.apiUrl}/low-stock`, { params: httpParams });
  }

  /**
   * 取得庫存統計
   */
  getStats(warehouseId?: number): Observable<{
    total_products: number;
    total_quantity: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
  }> {
    const httpParams = warehouseId
      ? this.buildQueryParams({ warehouse_id: warehouseId })
      : undefined;
    return this.http.get<{
      total_products: number;
      total_quantity: number;
      total_value: number;
      low_stock_count: number;
      out_of_stock_count: number;
    }>(`${this.apiUrl}/stats`, { params: httpParams });
  }
}

@Injectable({
  providedIn: 'root',
})
export class StockCountService extends ApiService<StockCount, CreateStockCountRequest, Partial<StockCount>> {
  protected endpoint = 'stock-counts';

  /**
   * 開始盤點
   */
  startCounting(id: number): Observable<StockCount> {
    return this.http.post<StockCount>(`${this.apiUrl}/${id}/start`, {});
  }

  /**
   * 更新盤點數量
   */
  updateItem(id: number, item: UpdateStockCountItemRequest): Observable<StockCount> {
    return this.http.patch<StockCount>(`${this.apiUrl}/${id}/items/${item.item_id}`, {
      counted_quantity: item.counted_quantity,
    });
  }

  /**
   * 批次更新盤點數量
   */
  updateItems(id: number, items: UpdateStockCountItemRequest[]): Observable<StockCount> {
    return this.http.patch<StockCount>(`${this.apiUrl}/${id}/items`, { items });
  }

  /**
   * 完成盤點
   */
  complete(id: number): Observable<StockCount> {
    return this.http.post<StockCount>(`${this.apiUrl}/${id}/complete`, {});
  }

  /**
   * 核准盤點
   */
  approve(id: number): Observable<StockCount> {
    return this.http.post<StockCount>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * 取消盤點
   */
  cancel(id: number): Observable<StockCount> {
    return this.http.post<StockCount>(`${this.apiUrl}/${id}/cancel`, {});
  }
}

@Injectable({
  providedIn: 'root',
})
export class StockTransferService extends ApiService<StockTransfer, CreateStockTransferRequest, Partial<StockTransfer>> {
  protected endpoint = 'stock-transfers';

  /**
   * 提交調撥單
   */
  submit(id: number): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(`${this.apiUrl}/${id}/submit`, {});
  }

  /**
   * 核准調撥單
   */
  approve(id: number): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * 出貨
   */
  ship(id: number): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(`${this.apiUrl}/${id}/ship`, {});
  }

  /**
   * 收貨
   */
  receive(id: number, items?: { item_id: number; received_quantity: number }[]): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(`${this.apiUrl}/${id}/receive`, { items });
  }

  /**
   * 取消調撥
   */
  cancel(id: number, reason?: string): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(`${this.apiUrl}/${id}/cancel`, { reason });
  }
}
