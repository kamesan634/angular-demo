/**
 * 變更密碼頁面元件
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { AuthService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="變更密碼"
      subtitle="請輸入您的舊密碼與新密碼"
    ></app-page-header>

    <p-card styleClass="max-w-30rem">
      <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
        @if (errorMessage()) {
          <p-message severity="error" [text]="errorMessage()"></p-message>
        }

        <div class="form-field">
          <label for="currentPassword">目前密碼</label>
          <p-password
            id="currentPassword"
            formControlName="currentPassword"
            placeholder="請輸入目前密碼"
            [toggleMask]="true"
            [feedback]="false"
            styleClass="w-full"
            inputStyleClass="w-full"
          ></p-password>
          @if (isFieldInvalid('currentPassword')) {
            <small class="p-error">請輸入目前密碼</small>
          }
        </div>

        <div class="form-field">
          <label for="newPassword">新密碼</label>
          <p-password
            id="newPassword"
            formControlName="newPassword"
            placeholder="請輸入新密碼"
            [toggleMask]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
            promptLabel="請輸入新密碼"
            weakLabel="弱"
            mediumLabel="中"
            strongLabel="強"
          ></p-password>
          @if (isFieldInvalid('newPassword')) {
            <small class="p-error">
              @if (passwordForm.get('newPassword')?.errors?.['required']) {
                請輸入新密碼
              } @else if (passwordForm.get('newPassword')?.errors?.['minlength']) {
                密碼至少需要 8 個字元
              }
            </small>
          }
        </div>

        <div class="form-field">
          <label for="confirmPassword">確認新密碼</label>
          <p-password
            id="confirmPassword"
            formControlName="confirmPassword"
            placeholder="請再次輸入新密碼"
            [toggleMask]="true"
            [feedback]="false"
            styleClass="w-full"
            inputStyleClass="w-full"
          ></p-password>
          @if (isFieldInvalid('confirmPassword')) {
            <small class="p-error">
              @if (passwordForm.get('confirmPassword')?.errors?.['required']) {
                請確認新密碼
              } @else if (passwordForm.get('confirmPassword')?.errors?.['passwordMismatch']) {
                兩次輸入的密碼不一致
              }
            </small>
          }
        </div>

        <div class="form-actions">
          <button
            pButton
            type="button"
            label="取消"
            class="p-button-text"
            (click)="onCancel()"
          ></button>
          <button
            pButton
            type="submit"
            label="變更密碼"
            [loading]="isLoading()"
            [disabled]="passwordForm.invalid || isLoading()"
          ></button>
        </div>
      </form>
    </p-card>
  `,
  styles: [`
    .form-field {
      margin-bottom: 1.25rem;
    }

    .form-field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
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
export class ChangePasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  passwordForm: FormGroup = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator,
    }
  );

  isLoading = signal(false);
  errorMessage = signal('');

  isFieldInvalid(field: string): boolean {
    const control = this.passwordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    this.authService
      .changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: '成功',
            detail: '密碼已變更',
          });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading.set(false);
          if (error.status === 400) {
            this.errorMessage.set('目前密碼錯誤');
          } else {
            this.errorMessage.set('變更密碼失敗，請稍後再試');
          }
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
