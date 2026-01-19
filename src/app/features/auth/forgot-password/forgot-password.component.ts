/**
 * 忘記密碼頁面元件
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
  ],
  template: `
    <div class="forgot-password-container">
      <div class="forgot-password-content">
        <div class="header">
          <h1 class="title">忘記密碼</h1>
          <p class="subtitle">請輸入您的電子郵件，我們將發送密碼重設連結</p>
        </div>

        <p-card styleClass="forgot-password-card">
          @if (isSubmitted()) {
            <div class="success-message">
              <i class="pi pi-check-circle success-icon"></i>
              <h2>郵件已發送</h2>
              <p>
                如果您的帳號存在，我們已將密碼重設連結發送至您的電子郵件信箱。
                請檢查您的收件匣（包括垃圾郵件資料夾）。
              </p>
              <a routerLink="/auth/login" class="back-link">
                <i class="pi pi-arrow-left"></i>
                返回登入頁面
              </a>
            </div>
          } @else {
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
              @if (errorMessage()) {
                <p-message severity="error" [text]="errorMessage()"></p-message>
              }

              <div class="form-field">
                <label for="email">電子郵件</label>
                <input
                  id="email"
                  type="email"
                  pInputText
                  formControlName="email"
                  placeholder="請輸入您的電子郵件"
                  class="w-full"
                  [class.ng-invalid]="isFieldInvalid('email')"
                />
                @if (isFieldInvalid('email')) {
                  <small class="p-error">
                    @if (forgotPasswordForm.get('email')?.errors?.['required']) {
                      請輸入電子郵件
                    } @else if (forgotPasswordForm.get('email')?.errors?.['email']) {
                      請輸入有效的電子郵件格式
                    }
                  </small>
                }
              </div>

              <button
                pButton
                type="submit"
                label="發送重設連結"
                class="w-full"
                [loading]="isLoading()"
                [disabled]="forgotPasswordForm.invalid || isLoading()"
              ></button>

              <div class="login-link">
                <a routerLink="/auth/login">
                  <i class="pi pi-arrow-left"></i>
                  返回登入頁面
                </a>
              </div>
            </form>
          }
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-700) 100%);
      padding: 1rem;
    }

    .forgot-password-content {
      width: 100%;
      max-width: 400px;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
    }

    .title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }

    .subtitle {
      margin: 0;
      opacity: 0.9;
    }

    :host ::ng-deep .forgot-password-card {
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

    .login-link {
      margin-top: 1.5rem;
      text-align: center;
    }

    .login-link a,
    .back-link {
      color: var(--primary-color);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .login-link a:hover,
    .back-link:hover {
      text-decoration: underline;
    }

    .success-message {
      text-align: center;
    }

    .success-icon {
      font-size: 4rem;
      color: var(--green-500);
      margin-bottom: 1rem;
    }

    .success-message h2 {
      margin: 0 0 1rem;
      color: var(--text-color);
    }

    .success-message p {
      color: var(--text-color-secondary);
      margin-bottom: 1.5rem;
    }

    :host ::ng-deep .p-message {
      margin-bottom: 1rem;
      width: 100%;
    }
  `],
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal('');

  isFieldInvalid(field: string): boolean {
    const control = this.forgotPasswordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // 模擬 API 呼叫
    // 實際應用中應呼叫 AuthService 的 forgotPassword 方法
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSubmitted.set(true);
    }, 1500);
  }
}
