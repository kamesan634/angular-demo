/**
 * API 服務基底類別
 * 提供通用的 CRUD 操作方法
 */
import { inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PaginatedResponse, ListQueryParams } from '@core/models';

/**
 * 通用 API 服務基底類別
 * @template T 實體類型
 * @template CreateDto 建立請求類型
 * @template UpdateDto 更新請求類型
 */
export abstract class ApiService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiUrl;

  /**
   * API 端點路徑 (子類別需覆寫)
   */
  protected abstract endpoint: string;

  /**
   * 取得完整 API URL
   */
  protected get apiUrl(): string {
    return `${this.baseUrl}/${this.endpoint}`;
  }

  /**
   * 取得列表
   */
  getList(params?: ListQueryParams): Observable<PaginatedResponse<T>> {
    const httpParams = this.buildQueryParams(params);
    return this.http.get<PaginatedResponse<T>>(this.apiUrl, { params: httpParams });
  }

  /**
   * 取得單筆資料
   */
  getById(id: number | string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${id}`);
  }

  /**
   * 建立新資料
   */
  create(data: CreateDto): Observable<T> {
    return this.http.post<T>(this.apiUrl, data);
  }

  /**
   * 更新資料
   */
  update(id: number | string, data: UpdateDto): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * 部分更新資料
   */
  patch(id: number | string, data: Partial<UpdateDto>): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * 刪除資料
   */
  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * 批次刪除
   */
  deleteMany(ids: (number | string)[]): Observable<void> {
    return this.http.delete<void>(this.apiUrl, {
      body: { ids },
    });
  }

  /**
   * 搜尋
   */
  search(query: string, params?: ListQueryParams): Observable<PaginatedResponse<T>> {
    const httpParams = this.buildQueryParams({ ...params, search: query });
    return this.http.get<PaginatedResponse<T>>(`${this.apiUrl}/search`, { params: httpParams });
  }

  /**
   * 匯出資料
   */
  export(params?: ListQueryParams, format: 'csv' | 'xlsx' = 'xlsx'): Observable<Blob> {
    const httpParams = this.buildQueryParams(params);
    return this.http.get(`${this.apiUrl}/export`, {
      params: httpParams.set('format', format),
      responseType: 'blob',
    });
  }

  /**
   * 匯入資料
   */
  import(file: File): Observable<{ success: number; failed: number; errors?: unknown[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: number; failed: number; errors?: unknown[] }>(
      `${this.apiUrl}/import`,
      formData
    );
  }

  /**
   * 建立查詢參數
   */
  protected buildQueryParams(params?: ListQueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) return httpParams;

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }

  /**
   * 建立包含跳過 loading 的 headers
   */
  protected skipLoadingHeaders(): HttpHeaders {
    return new HttpHeaders().set('X-Skip-Loading', 'true');
  }
}
