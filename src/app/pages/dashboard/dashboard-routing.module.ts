import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard.component';
import {UserProfileComponent} from './user/user-profile/user-profile.component';
import {InstantMatchComponent} from './instant-match/instant-match.component';
import {ScheduledMatchComponent} from './scheduled-match/scheduled-match.component';


const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'profile',
        component: UserProfileComponent,
        pathMatch: 'full',
      },
      // Primary route used on the live site
      {
        path: 'instance-meeting',
        component: InstantMatchComponent,
        pathMatch: 'full',
      },
      // Alias kept for backwards compatibility
      {
        path: 'instant-match',
        redirectTo: 'instance-meeting',
        pathMatch: 'full',
      },
      {
        path: 'scheduled-match',
        component: ScheduledMatchComponent,
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'instance-meeting',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {
}
