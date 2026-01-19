/**
 * 登入頁面元件
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
    MessageModule,
  ],
  template: `
    <div class="login-container">
      <div class="login-content">
        <div class="login-header">
          <h1 class="login-title">龜三的ERP Demo</h1>
          <p class="login-subtitle">請輸入您的帳號密碼登入系統</p>
        </div>

        <p-card styleClass="login-card">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            @if (errorMessage()) {
              <p-message severity="error" [text]="errorMessage()"></p-message>
            }

            <div class="form-field">
              <label for="username">帳號</label>
              <input
                id="username"
                type="text"
                pInputText
                formControlName="username"
                placeholder="請輸入帳號"
                class="w-full"
                [class.ng-invalid]="isFieldInvalid('username')"
              />
              @if (isFieldInvalid('username')) {
                <small class="p-error">請輸入帳號</small>
              }
            </div>

            <div class="form-field">
              <label for="password">密碼</label>
              <p-password
                id="password"
                formControlName="password"
                placeholder="請輸入密碼"
                [toggleMask]="true"
                [feedback]="false"
                styleClass="w-full"
                inputStyleClass="w-full"
                [inputId]="'password-input'"
              ></p-password>
              @if (isFieldInvalid('password')) {
                <small class="p-error">請輸入密碼</small>
              }
            </div>

            <div class="form-field remember-me">
              <p-checkbox
                formControlName="rememberMe"
                [binary]="true"
                inputId="rememberMe"
              ></p-checkbox>
              <label for="rememberMe">記住我</label>
            </div>

            <button
              pButton
              type="submit"
              label="登入"
              class="w-full"
              [loading]="isLoading()"
              [disabled]="loginForm.invalid || isLoading()"
            ></button>

            <div class="login-links">
              <a routerLink="/auth/forgot-password" class="forgot-password-link">
                忘記密碼？
              </a>
            </div>
          </form>
        </p-card>

        <div class="login-footer">
          <p>&copy; {{ currentYear }} 龜三的ERP Demo. All rights reserved.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-700) 100%);
      padding: 1rem;
    }

    .login-content {
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
    }

    .login-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }

    .login-subtitle {
      margin: 0;
      opacity: 0.9;
    }

    :host ::ng-deep .login-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .form-field {
      margin-bottom: 1.25rem;
    }

    .form-field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .remember-me label {
      margin-bottom: 0;
      cursor: pointer;
    }

    .login-links {
      margin-top: 1.5rem;
      text-align: center;
    }

    .forgot-password-link {
      color: var(--primary-color);
      text-decoration: none;
    }

    .forgot-password-link:hover {
      text-decoration: underline;
    }

    .login-footer {
      text-align: center;
      margin-top: 2rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
    }

    :host ::ng-deep {
      .p-password {
        width: 100%;
      }

      .p-message {
        margin-bottom: 1rem;
        width: 100%;
      }
    }
  `],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  isLoading = signal(false);
  errorMessage = signal('');
  currentYear = new Date().getFullYear();

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('帳號或密碼錯誤');
        } else if (error.status === 0) {
          this.errorMessage.set('無法連線至伺服器');
        } else {
          this.errorMessage.set('登入失敗，請稍後再試');
        }
      },
    });
  }
}
