/**
 * 錯誤處理攔截器
 * 統一處理 HTTP 錯誤回應
 */
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse as ApiHttpErrorResponse, ValidationErrorDetail } from '@core/models';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '發生未知錯誤';

      if (error.error instanceof ErrorEvent) {
        // 客戶端錯誤
        errorMessage = `錯誤: ${error.error.message}`;
      } else {
        // 伺服器端錯誤
        errorMessage = getServerErrorMessage(error);
      }

      // 根據錯誤類型顯示不同的訊息
      switch (error.status) {
        case 0:
          messageService.add({
            severity: 'error',
            summary: '網路錯誤',
            detail: '無法連線至伺服器，請檢查網路連線',
            life: 5000,
          });
          break;
        case 400:
          messageService.add({
            severity: 'warn',
            summary: '請求錯誤',
            detail: errorMessage,
            life: 5000,
          });
          break;
        case 401:
          // 401 錯誤由 auth.interceptor 處理，這裡不顯示訊息
          break;
        case 403:
          messageService.add({
            severity: 'error',
            summary: '權限不足',
            detail: '您沒有權限執行此操作',
            life: 5000,
          });
          break;
        case 404:
          messageService.add({
            severity: 'warn',
            summary: '找不到資源',
            detail: errorMessage,
            life: 5000,
          });
          break;
        case 422:
          // 驗證錯誤，顯示詳細訊息
          messageService.add({
            severity: 'warn',
            summary: '資料驗證失敗',
            detail: errorMessage,
            life: 5000,
          });
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          messageService.add({
            severity: 'error',
            summary: '伺服器錯誤',
            detail: '伺服器發生錯誤，請稍後再試',
            life: 5000,
          });
          break;
        default:
          messageService.add({
            severity: 'error',
            summary: '錯誤',
            detail: errorMessage,
            life: 5000,
          });
      }

      return throwError(() => error);
    })
  );
};

/**
 * 解析伺服器錯誤訊息
 */
function getServerErrorMessage(error: HttpErrorResponse): string {
  const errorBody = error.error as ApiHttpErrorResponse;

  if (!errorBody) {
    return `錯誤代碼: ${error.status}`;
  }

  // FastAPI 驗證錯誤格式
  if (Array.isArray(errorBody.detail)) {
    const validationErrors = errorBody.detail as ValidationErrorDetail[];
    const messages = validationErrors.map(e => {
      const field = e.loc.slice(1).join('.');
      return field ? `${field}: ${e.msg}` : e.msg;
    });
    return messages.join('; ');
  }

  // 一般錯誤訊息
  if (typeof errorBody.detail === 'string') {
    return errorBody.detail;
  }

  if (errorBody.message) {
    return errorBody.message;
  }

  return `錯誤代碼: ${error.status}`;
}
