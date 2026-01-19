/**
 * 403 權限不足頁面
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">403</div>
        <h1>權限不足</h1>
        <p>抱歉，您沒有權限存取此頁面。</p>
        <p class="hint">請聯繫系統管理員取得相關權限。</p>
        <button pButton label="返回首頁" icon="pi pi-home" routerLink="/dashboard"></button>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-ground);
    }

    .error-content {
      text-align: center;
      padding: 2rem;
    }

    .error-code {
      font-size: 8rem;
      font-weight: 700;
      color: var(--orange-500);
      line-height: 1;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2rem;
      margin: 0 0 1rem;
      color: var(--text-color);
    }

    p {
      color: var(--text-color-secondary);
      margin: 0 0 0.5rem;
    }

    .hint {
      margin-bottom: 2rem;
    }
  `],
})
export class ForbiddenComponent {}
