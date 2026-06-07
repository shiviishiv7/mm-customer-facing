import {Routes} from '@angular/router';
import {authGuard} from './core/guards/auth.guard';



export const routes: Routes = [
  {
    path: 'landing', data: {title: 'Landing Page'},
    loadChildren: () =>
      import('./pages/landing-page/landing-page.module').then(m => m.LandingPageModule),
  },

  {
    path: 'dashboard', data: {title: 'Landing Page'},
    canActivate: [authGuard],
    loadChildren: () =>
      import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule),
  },

  {
    path: 'general', data: {title: 'Landing Page'},
    loadChildren: () =>
      import('./pages/general/general.module').then(m => m.GeneralModule),
  },
  {
    path: 'signin', data: {title: 'Sign in Page'},
    loadChildren: () =>
      import('./pages/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'signout', data: {title: 'Sign out'},
    loadChildren: () =>
      import('./pages/auth/auth.module').then(m => m.AuthModule),
  },
  {path: '', redirectTo: 'landing', pathMatch: 'full'}, // Default landing page
  {
    path: '**',
    loadChildren: () =>
      import('./pages/page-not-found/page-not-found.module').then(m => m.PageNotFoundModule),
  },
];
