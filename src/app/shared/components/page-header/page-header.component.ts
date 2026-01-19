/**
 * 頁面標題元件
 */
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule],
  template: `
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          @if (breadcrumbs().length > 0) {
            <p-breadcrumb [model]="breadcrumbs()" [home]="homeItem"></p-breadcrumb>
          }
          <h1 class="page-title">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="page-subtitle">{{ subtitle() }}</p>
          }
        </div>
        <div class="page-header-actions">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
    }

    .page-header-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header-left {
      flex: 1;
    }

    .page-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .page-subtitle {
      margin: 0.5rem 0 0;
      color: var(--text-color-secondary);
    }

    .page-header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    :host ::ng-deep .p-breadcrumb {
      background: transparent;
      border: none;
      padding: 0;
      margin-bottom: 0.5rem;
    }
  `],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
  breadcrumbs = input<MenuItem[]>([]);

  homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
}
