import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, of, catchError } from 'rxjs';
import { CommunicationBusService } from '@shared/services/communication-bus.service';
import { UserService } from '@core/services/user.service';

export const profileCompleteGuard: CanActivateFn = (route, state) => {
  const commBus = inject(CommunicationBusService);
  const userService = inject(UserService);
  const router = inject(Router);

  const redirectToProfile = () => {
    router.navigate(['/dashboard/profile'], { queryParams: { sub: commBus.sub } });
    return false;
  };

  // If user is already loaded in the bus, check synchronously
  if (commBus.user !== null && commBus.user !== undefined) {
    return commBus.user.isProfileComplete ? true : redirectToProfile();
  }

  // User not loaded yet (direct URL navigation) — fetch then check
  if (!commBus.sub) {
    return redirectToProfile();
  }

  return userService.fetchUserByCognitoSub(commBus.sub).pipe(
    map(res => {
      const user = res?.data;
      if (user) {
        commBus.user = user; // cache it so DashboardComponent doesn't need to re-fetch
      }
      return user?.isProfileComplete ? true : redirectToProfile();
    }),
    catchError(() => of(redirectToProfile()))
  );
};
