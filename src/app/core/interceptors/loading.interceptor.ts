/**
 * Loading 攔截器
 * 追蹤 HTTP 請求狀態，控制全域載入指示器
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '@core/services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const loadingService = inject(LoadingService);

  // 檢查是否需要跳過 loading 指示器
  // 可透過 request header 控制
  const skipLoading = req.headers.get('X-Skip-Loading') === 'true';

  if (skipLoading) {
    // 移除自訂 header 後繼續請求
    const clonedReq = req.clone({
      headers: req.headers.delete('X-Skip-Loading'),
    });
    return next(clonedReq);
  }

  // 開始 loading
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // 結束 loading
      loadingService.hide();
    })
  );
};
