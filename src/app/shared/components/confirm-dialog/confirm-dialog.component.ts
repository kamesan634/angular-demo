/**
 * 確認對話框元件
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog
      [style]="{ width: '400px' }"
      [baseZIndex]="10000"
      rejectButtonStyleClass="p-button-text"
    ></p-confirmDialog>
  `,
})
export class ConfirmDialogComponent {
  readonly confirmationService = inject(ConfirmationService);
}

/**
 * 確認對話框服務
 * 提供便捷的確認對話框方法
 */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private confirmationService: ConfirmationService | null = null;

  setConfirmationService(service: ConfirmationService): void {
    this.confirmationService = service;
  }

  /**
   * 顯示確認對話框
   */
  confirm(options: {
    title?: string;
    message: string;
    icon?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    acceptButtonClass?: string;
    rejectButtonClass?: string;
  }): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.confirmationService) {
        console.error('ConfirmationService 未設定');
        resolve(false);
        return;
      }

      this.confirmationService.confirm({
        header: options.title || '確認',
        message: options.message,
        icon: options.icon || 'pi pi-exclamation-triangle',
        acceptLabel: options.acceptLabel || '確定',
        rejectLabel: options.rejectLabel || '取消',
        acceptButtonStyleClass: options.acceptButtonClass || 'p-button-danger',
        rejectButtonStyleClass: options.rejectButtonClass || 'p-button-text',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  /**
   * 顯示刪除確認對話框
   */
  confirmDelete(itemName?: string): Promise<boolean> {
    const message = itemName ? `確定要刪除「${itemName}」嗎？此操作無法復原。` : '確定要刪除此項目嗎？此操作無法復原。';

    return this.confirm({
      title: '確認刪除',
      message,
      icon: 'pi pi-trash',
      acceptLabel: '刪除',
      acceptButtonClass: 'p-button-danger',
    });
  }

  /**
   * 顯示離開確認對話框
   */
  confirmLeave(): Promise<boolean> {
    return this.confirm({
      title: '確認離開',
      message: '您有未儲存的變更，確定要離開嗎？',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '離開',
      rejectLabel: '留在此頁',
      acceptButtonClass: 'p-button-warning',
    });
  }
}
