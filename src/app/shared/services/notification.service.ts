import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _snackBar = inject(MatSnackBar);

  success(message: string, action: string = 'Dismiss') {
    this._snackBar.open(message, action, {
      duration: 3000,
      panelClass: ['default-snackbar', 'success-snackbar'], // ✅ Success Green
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  error(message: string, action: string = 'Dismiss') {
    this._snackBar.open(message, action, {
      duration: 0, // 🔴 Sticky until dismissed
      panelClass: ['default-snackbar', 'error-snackbar'], // ❌ Error Red
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  info(message: string, action: string = 'Dismiss') {
    this._snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['default-snackbar', 'info-snackbar'], // 💜 Soft Purple
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
