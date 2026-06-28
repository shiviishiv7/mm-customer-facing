import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { UserProfileComponent } from './user/user-profile/user-profile.component';
import { ScheduledMatchComponent } from './scheduled-match/scheduled-match.component';
import { PostMatchComponent } from './post-match/post-match.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: 'post-match',      component: PostMatchComponent,     pathMatch: 'full' },
      { path: 'scheduled-match', component: ScheduledMatchComponent, pathMatch: 'full' },
      { path: 'profile',         component: UserProfileComponent,    pathMatch: 'full' },
      { path: '',                redirectTo: 'post-match',           pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
