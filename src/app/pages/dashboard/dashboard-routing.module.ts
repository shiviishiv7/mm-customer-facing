import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard.component';
import {UserProfileComponent} from './user/user-profile/user-profile.component';
import {InstantMatchComponent} from './instant-match/instant-match.component';
import {ScheduledMatchComponent} from './scheduled-match/scheduled-match.component';
import {HomeComponent} from './home/home.component';
import {ParseMatchComponent} from './parse-match/parse-match.component';
import {PostMatchComponent} from './post-match/post-match.component';


const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'home',
        component: HomeComponent,
        pathMatch: 'full',
      },
      {
        path: 'profile',
        component: UserProfileComponent,
        pathMatch: 'full',
      },
      {
        path: 'instance-meeting',
        component: InstantMatchComponent,
        pathMatch: 'full',
      },
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
        path: 'parser-match',
        component: ParseMatchComponent,
        pathMatch: 'full',
      },
      {
        path: 'post-match',
        component: PostMatchComponent,
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'home',
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
