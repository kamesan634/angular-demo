/**
 * Loading 指示器元件
 */
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div class="loading-overlay" [class.full-screen]="fullScreen()">
        <p-progressSpinner
          [strokeWidth]="strokeWidth()"
          [style]="{ width: size(), height: size() }"
        ></p-progressSpinner>
        @if (message()) {
          <p class="loading-message">{{ message() }}</p>
        }
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .loading-overlay.full-screen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      z-index: 9999;
    }

    .loading-message {
      margin-top: 1rem;
      color: var(--text-color-secondary);
    }
  `],
})
export class LoadingSpinnerComponent {
  loading = input(false);
  fullScreen = input(false);
  message = input<string>('');
  size = input('50px');
  strokeWidth = input('4');
}
