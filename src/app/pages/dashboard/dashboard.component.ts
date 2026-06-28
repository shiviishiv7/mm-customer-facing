import {Component, ElementRef, HostListener, OnInit, signal, ViewChild} from '@angular/core';

import {MatDrawer} from '@angular/material/sidenav';
import {CommunicationBusService} from '@shared/services/communication-bus.service';
import {ApplicationRoutingEnum} from '@core/enums/application-routing-enum';
import {finalize} from 'rxjs';
import {UserService} from '@core/services/user.service';
import {NotificationService} from '@shared/services/notification.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  @ViewChild('drawer') drawer: MatDrawer;

  constructor(public commBus: CommunicationBusService,private userService:UserService,private notificationService:NotificationService) {
  }


  ngOnInit() {
    this.commBus.footerOff();
    this.fetchUser(this.commBus.sub);
  }


  protected readonly ApplicationRoutingEnum = ApplicationRoutingEnum;
  private fetchUser(sub: string) {
    try {

      this.userService.fetchUserByCognitoSub(sub)
        .pipe(finalize(() => this.commBus.closeProgressBar()))
        .subscribe({
          next: (baseVO) => {
            const {data} = baseVO;
            if (!data) {
              this.notificationService.error('User data not found.');
              this.commBus.user = data;
              return;
            }
            this.commBus.user = data;

          },
          error: (err) => {
            // User not found means Lambda post-signup hook hasn't run yet or failed
            if (err.status === 404 || err.error?.message === 'User does not exist') {
              this.notificationService.error('Your profile is not set up yet. Please contact support.');
            } else {
              this.notificationService.error(err.error?.message || 'Failed to load profile.');
            }
          }
        });
    } catch (error) {
      this.notificationService.error('An unexpected error occurred during initialization.');
      this.commBus.closeProgressBar();
    }
  }
}
