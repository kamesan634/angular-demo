/**
 * 使用者服務
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, CreateUserRequest, UpdateUserRequest, ListQueryParams, PaginatedResponse } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class UserService extends ApiService<User, CreateUserRequest, UpdateUserRequest> {
  protected endpoint = 'users';

  /**
   * 搜尋使用者
   */
  override search(query: string, params?: ListQueryParams): Observable<PaginatedResponse<User>> {
    const httpParams = this.buildQueryParams({ ...params, search: query });
    return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params: httpParams });
  }

  /**
   * 啟用使用者
   */
  activate(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, { is_active: true });
  }

  /**
   * 停用使用者
   */
  deactivate(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, { is_active: false });
  }

  /**
   * 重設密碼
   */
  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reset-password`, {
      new_password: newPassword,
    });
  }

  /**
   * 指派角色
   */
  assignRoles(id: number, roleIds: number[]): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, { role_ids: roleIds });
  }
}
