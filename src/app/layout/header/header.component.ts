/**
 * 頁首元件
 */
import { Component, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '@core/services';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MenubarModule,
    ButtonModule,
    AvatarModule,
    MenuModule,
    BadgeModule,
  ],
  template: `
    <header class="layout-header">
      <div class="header-left">
        <button
          pButton
          type="button"
          icon="pi pi-bars"
          class="p-button-text p-button-plain"
          (click)="onMenuToggle()"
        ></button>
        <span class="app-title">龜三的ERP Demo</span>
      </div>

      <div class="header-right">
        <!-- 通知鈴鐺 -->
        <p-button
          icon="pi pi-bell"
          [text]="true"
          [plain]="true"
          badge="3"
          badgeSeverity="danger"
        ></p-button>

        <!-- 使用者選單 -->
        <div class="user-menu">
          <p-avatar
            [label]="userInitial()"
            shape="circle"
            size="normal"
            styleClass="cursor-pointer"
            (click)="userMenu.toggle($event)"
          ></p-avatar>
          <p-menu #userMenu [model]="userMenuItems" [popup]="true"></p-menu>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .layout-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      height: 60px;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .app-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-color);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-menu {
      margin-left: 0.5rem;
    }

    :host ::ng-deep .p-avatar {
      cursor: pointer;
    }
  `],
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);

  // 輸出事件
  menuToggle = output<void>();

  // 使用者名稱首字
  userInitial = computed(() => {
    const user = this.authService.user();
    if (!user) return '?';
    return user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase();
  });

  // 使用者選單項目
  userMenuItems: MenuItem[] = [
    {
      label: '個人設定',
      icon: 'pi pi-user',
      routerLink: '/profile',
    },
    {
      label: '變更密碼',
      icon: 'pi pi-key',
      routerLink: '/auth/change-password',
    },
    {
      separator: true,
    },
    {
      label: '登出',
      icon: 'pi pi-sign-out',
      command: () => this.logout(),
    },
  ];

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  private logout(): void {
    this.authService.logout().subscribe();
  }
}
