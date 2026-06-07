import {NgModule} from '@angular/core';
import {UserProfileComponent} from './user/user-profile/user-profile.component';
import {DashboardComponent} from './dashboard.component';
import {CommonModule} from '@angular/common';
import {DashboardRoutingModule} from './dashboard-routing.module';
import {SharedModule} from '@shared/shared.module';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    DashboardComponent,
    UserProfileComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    FormsModule,
  ], exports: [UserProfileComponent]
})
export class DashboardModule {
}
