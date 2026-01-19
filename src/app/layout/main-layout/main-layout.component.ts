/**
 * 主要版面配置元件
 */
import { Component, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { LoadingService } from '@core/services';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ProgressBarModule,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
  ],
  template: `
    <!-- 全域 Toast 通知 -->
    <p-toast position="top-right"></p-toast>

    <!-- 全域 Loading 指示器 -->
    @if (loadingService.isLoading()) {
      <div class="global-loading">
        <p-progressBar mode="indeterminate" [style]="{ height: '4px' }"></p-progressBar>
      </div>
    }

    <!-- Header -->
    <app-header (menuToggle)="onMenuToggle()"></app-header>

    <!-- Sidebar -->
    <app-sidebar [collapsed]="sidebarCollapsed()"></app-sidebar>

    <!-- 側邊欄遮罩 (行動裝置) -->
    @if (!sidebarCollapsed() && isMobile()) {
      <div class="sidebar-overlay" (click)="closeSidebar()"></div>
    }

    <!-- 主要內容區 -->
    <main class="layout-main" [class.sidebar-collapsed]="sidebarCollapsed()">
      <div class="content-wrapper">
        <router-outlet></router-outlet>
      </div>
      <app-footer></app-footer>
    </main>
  `,
  styles: [`
    .global-loading {
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      z-index: 1100;
    }

    .layout-main {
      margin-left: 280px;
      margin-top: 60px;
      min-height: calc(100vh - 60px);
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
    }

    .layout-main.sidebar-collapsed {
      margin-left: 0;
    }

    .content-wrapper {
      flex: 1;
      padding: 1.5rem;
      background: var(--surface-ground);
    }

    .sidebar-overlay {
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 998;
    }

    @media screen and (max-width: 991px) {
      .layout-main {
        margin-left: 0;
      }
    }
  `],
})
export class MainLayoutComponent {
  readonly loadingService = inject(LoadingService);

  sidebarCollapsed = signal(false);
  isMobile = signal(window.innerWidth < 992);

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 992);
    if (window.innerWidth >= 992) {
      this.sidebarCollapsed.set(false);
    }
  }

  onMenuToggle(): void {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  closeSidebar(): void {
    this.sidebarCollapsed.set(true);
  }
}
