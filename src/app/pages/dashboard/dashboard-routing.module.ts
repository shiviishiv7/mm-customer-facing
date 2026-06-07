import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard.component';
import {UserProfileComponent} from './user/user-profile/user-profile.component';
import {InstantMatchComponent} from './instant-match/instant-match.component';


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
      {
        path: 'instant-match',
        component: InstantMatchComponent,
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'instant-match',
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
