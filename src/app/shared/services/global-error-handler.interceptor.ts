import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {NotificationService} from '../services/notification.service';
import {catchError, throwError} from 'rxjs';

export const globalErrorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error) => {
  //    console.error('HTTP Error:', error);
      if (error) {
        switch (error.status) {
          case 0: // Network issue
            notificationService.error('No internet connection. Please check your network.');
            break;
          case 401: // Unauthorized
            notificationService.error(`Session expired. Please log in again. ${error?.error.message}`);
            break;
          case 403: // Forbidden
            notificationService.error('Access denied. You do not have permission.');
            break;
          case 404: // Not Found
            notificationService.error('Requested resource not found.');
            break;
          case 500: // Internal Server Error
            notificationService.error('Server error. Please try again later.');
            break;
          default:
            notificationService.error('An unexpected error occurred.');
        }
        return throwError(() => error.error);
      }

      return throwError(() => error);
    })
  );
};
