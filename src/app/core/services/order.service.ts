/**
 * 訂單服務
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Order,
  CreateOrderRequest,
  OrderPaymentRequest,
  SalesReturn,
  CreateSalesReturnRequest,
  PaginatedResponse,
  ListQueryParams,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class OrderService extends ApiService<Order, CreateOrderRequest, Partial<Order>> {
  protected endpoint = 'orders';

  /**
   * 依門市查詢訂單
   */
  getByStore(storeId: number, params?: ListQueryParams): Observable<PaginatedResponse<Order>> {
    const httpParams = this.buildQueryParams({ ...params, store_id: storeId });
    return this.http.get<PaginatedResponse<Order>>(this.apiUrl, { params: httpParams });
  }

  /**
   * 依客戶查詢訂單
   */
  getByCustomer(customerId: number, params?: ListQueryParams): Observable<PaginatedResponse<Order>> {
    const httpParams = this.buildQueryParams({ ...params, customer_id: customerId });
    return this.http.get<PaginatedResponse<Order>>(this.apiUrl, { params: httpParams });
  }

  /**
   * 確認訂單
   */
  confirm(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${id}/confirm`, {});
  }

  /**
   * 取消訂單
   */
  cancel(id: number, reason?: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  /**
   * 完成訂單
   */
  complete(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${id}/complete`, {});
  }

  /**
   * 訂單付款
   */
  addPayment(id: number, payment: OrderPaymentRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${id}/payments`, payment);
  }

  /**
   * 套用優惠券
   */
  applyCoupon(id: number, couponCode: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${id}/apply-coupon`, { code: couponCode });
  }

  /**
   * 移除優惠券
   */
  removeCoupon(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${id}/remove-coupon`, {});
  }

  /**
   * 取得今日訂單統計
   */
  getTodayStats(storeId?: number): Observable<{
    total_orders: number;
    total_sales: number;
    completed_orders: number;
    cancelled_orders: number;
  }> {
    const httpParams = storeId
      ? this.buildQueryParams({ store_id: storeId })
      : undefined;
    return this.http.get<{
      total_orders: number;
      total_sales: number;
      completed_orders: number;
      cancelled_orders: number;
    }>(`${this.apiUrl}/stats/today`, { params: httpParams });
  }
}

@Injectable({
  providedIn: 'root',
})
export class SalesReturnService extends ApiService<SalesReturn, CreateSalesReturnRequest, Partial<SalesReturn>> {
  protected endpoint = 'sales-returns';

  /**
   * 提交退貨單
   */
  submit(id: number): Observable<SalesReturn> {
    return this.http.post<SalesReturn>(`${this.apiUrl}/${id}/submit`, {});
  }

  /**
   * 核准退貨單
   */
  approve(id: number): Observable<SalesReturn> {
    return this.http.post<SalesReturn>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * 駁回退貨單
   */
  reject(id: number, reason: string): Observable<SalesReturn> {
    return this.http.post<SalesReturn>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * 完成退貨
   */
  complete(id: number): Observable<SalesReturn> {
    return this.http.post<SalesReturn>(`${this.apiUrl}/${id}/complete`, {});
  }
}
