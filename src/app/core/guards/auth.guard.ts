import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {CommunicationBusService} from '@shared/services/communication-bus.service';
import {AuthService} from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router); // Fix the injection here
  if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/landing']); // Ensure '/landing' is correct
    return false;
  }
};
