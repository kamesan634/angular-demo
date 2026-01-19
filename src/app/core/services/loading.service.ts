/**
 * Loading 服務
 * 管理全域載入狀態
 */
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  // 追蹤進行中的請求數量
  private activeRequests = signal(0);

  // 公開的載入狀態
  readonly isLoading = computed(() => this.activeRequests() > 0);

  /**
   * 顯示載入指示器
   */
  show(): void {
    this.activeRequests.update(count => count + 1);
  }

  /**
   * 隱藏載入指示器
   */
  hide(): void {
    this.activeRequests.update(count => Math.max(0, count - 1));
  }

  /**
   * 重設載入狀態
   */
  reset(): void {
    this.activeRequests.set(0);
  }

  /**
   * 取得當前進行中的請求數量
   */
  getActiveRequestCount(): number {
    return this.activeRequests();
  }
}
