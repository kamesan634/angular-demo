import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '@shared/components';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="訂單詳情"
      subtitle="檢視訂單明細"
      [breadcrumbs]="[{ label: '銷售管理' }, { label: '訂單詳情' }]"
    ></app-page-header>
    <div class="card">
      <p>此頁面功能開發中...</p>
    </div>
  `,
  styles: [`
    .card {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 2rem;
    }
  `],
})
export class OrderDetailComponent {}
