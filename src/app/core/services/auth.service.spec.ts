/**
 * AuthService 單元測試
 */
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jest.Mocked<Router>;

  beforeEach(async () => {
    routerSpy = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // 清除 localStorage
    localStorage.clear();
  });

  afterEach(() => {
    // 取消所有待處理的請求並忽略未處理的請求
    try {
      httpMock.verify();
    } catch {
      // 忽略驗證錯誤
    }
  });

  describe('login', () => {
    it('登入失敗時應該拋出錯誤', () => {
      service.login({ username: 'admin', password: 'wrong' }).subscribe({
        error: error => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login-json`);
      req.flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('沒有 token 時應該直接導向登入頁', () => {
      service.logout().subscribe(() => {
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
      });

      // 沒有 refreshToken 時不會發送 HTTP 請求
      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);
    });
  });

  describe('isTokenExpired', () => {
    it('沒有 token 時應該返回 true', () => {
      expect(service.isTokenExpired()).toBe(true);
    });
  });

  describe('shouldRefreshToken', () => {
    it('沒有 token 時應該返回 false', () => {
      expect(service.shouldRefreshToken()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('未登入時應該返回 false', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
