/**
 * 404 頁面不存在
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">404</div>
        <h1>找不到頁面</h1>
        <p>抱歉，您要找的頁面不存在或已被移除。</p>
        <p class="hint">請檢查網址是否正確，或返回首頁。</p>
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
      color: var(--primary-color);
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
export class NotFoundComponent {}
