import {ApplicationConfig, APP_INITIALIZER, ErrorHandler, provideZoneChangeDetection, isDevMode} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {LocationStrategy, PathLocationStrategy} from '@angular/common';
import {Title} from '@angular/platform-browser';

import {routes} from './app.routes';
import {authInterceptor} from './core/interceptors/auth.interceptor';
import {globalErrorHandlerInterceptor} from './shared/services/global-error-handler.interceptor';

import {AppInitializationService} from '@core/services/app-initialization.service';
import {provideServiceWorker} from '@angular/service-worker';



// ✅ Function for `APP_INITIALIZER`
export function initializeApp(appInitService: AppInitializationService) {
  return () => appInitService.loadConfig();
}

// ✅ Updated `appConfig` with `APP_INITIALIZER`
export const appConfig: ApplicationConfig = {
  providers: [
    Title,
    provideHttpClient(withInterceptors([authInterceptor, globalErrorHandlerInterceptor])),
    FormsModule,
    {provide: LocationStrategy, useClass: PathLocationStrategy},
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideAnimations(),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitializationService],
      multi: true, // Ensures it runs before app starts
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
};
