/**
 * 應用程式設定
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { authInterceptor, errorInterceptor, loadingInterceptor } from '@core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 核心
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor,
      ])
    ),
    provideAnimationsAsync(),

    // PrimeNG 設定
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    }),

    // PrimeNG 服務
    MessageService,
    ConfirmationService,
  ],
};
