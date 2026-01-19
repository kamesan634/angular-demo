/**
 * 頁尾元件
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="layout-footer">
      <span>&copy; {{ currentYear }} 龜三的ERP Demo. All rights reserved.</span>
      <span class="version">v1.0.0</span>
    </footer>
  `,
  styles: [`
    .layout-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: var(--surface-card);
      border-top: 1px solid var(--surface-border);
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .version {
      font-size: 0.75rem;
    }
  `],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
