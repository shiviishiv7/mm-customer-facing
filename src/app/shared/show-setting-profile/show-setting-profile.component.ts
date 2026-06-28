import {Component, inject, OnInit} from '@angular/core';
import {CommunicationBusService} from '../services/communication-bus.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogData} from '@core/models/interface/dialog-data';
import {NotificationService} from '../services/notification.service';
import {Router} from '@angular/router';
import {signOut} from 'aws-amplify/auth';
import {AuthService} from '@core/services/auth.service';
import {ApplicationRoutingEnum} from '@core/enums/application-routing-enum';

@Component({
  selector: 'app-show-setting-profile',
  templateUrl: './show-setting-profile.component.html',
  styleUrls: ['./show-setting-profile.component.scss']
})
export class ShowSettingProfileComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<ShowSettingProfileComponent>);
  email: string;
  private sub: string;

  constructor(
    private router: Router,
    private authService: AuthService,
    private communicationBusService: CommunicationBusService,
    private notificationService: NotificationService
  ) {
  }

  ngOnInit(): void {
    try {
      console.log("ShowSettingProfileComponent");
      this.email = this.communicationBusService.email;
      this.sub = this.communicationBusService.sub;
    } catch (error) {
      this.handleError(error, 'Failed to load user details.');
    }
  }

  signOut($event: MouseEvent): void {
    this.communicationBusService.logout();
    this.dialogRef.close();
  }

  editProfile(): void {
    try {
      this.router.navigate(['/dashboard/profile'], {queryParams: {sub: this.sub}})
      this.dialogRef.close()
      //    this.communicationBusService.routerNavigate('user/profile');
    } catch (error) {
      this.handleError(error, 'Failed to navigate to the profile page.');
    }
  }

  private handleError(error: any, message: string): void {
    console.error('Error:', error);
    this.notificationService.error(message);
  }

  navigateToDashboard() {

    try {
      this.router.navigateByUrl("dashboard");
      this.dialogRef.close()
      //    this.communicationBusService.routerNavigate('student/profile');
    } catch (error) {
      this.handleError(error, 'Failed to navigate to the profile page.');
    }

  }
}
