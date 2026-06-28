import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserModel} from '@core/models/class/user-model';
import {finalize, Subscription} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '@core/services/user.service';
import {NotificationService} from '../../../../shared/services/notification.service';
import {ObjectValidationService} from '@core/services/object-validation.service';
import {CommunicationBusService} from '../../../../shared/services/communication-bus.service';
import {NgForm} from '@angular/forms';
import {environment} from '../../../../../environments/environment';
import {AuthService} from '@core/services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit, OnDestroy {

  current = 1;
  user: UserModel;
  private subscriptions: Subscription = new Subscription();
  private sub: string | null = null;
  adminUser: boolean = false;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    private notificationService: NotificationService,
    private objectValidationService: ObjectValidationService,
    private route: ActivatedRoute,
    private communicationBusService: CommunicationBusService,
    private authService: AuthService
  ) {}

  submitForm(form: NgForm): void {
    try {
      if (!form.valid) {
        this.notificationService.error('Please fill in all required fields.');
        return;
      }

      // Normalize dateOfBirth to YYYY-MM-DD
      if (this.user.dateOfBirth) {
        const dob = new Date(this.user.dateOfBirth);
        this.user.dateOfBirth = dob.toISOString().split('T')[0];
      }

      this.communicationBusService.showProgressBar();

      this.userService.updateUser(this.user)
        .pipe(finalize(() => this.communicationBusService.closeProgressBar()))
        .subscribe({
          next: (res) => {
            this.user = res.data ?? this.user;
            // Update shared bus so dashboard banner refreshes
            this.communicationBusService.user = this.user;
            this.current = 3;
            this.notificationService.success('Profile saved successfully!');
          },
          error: (err) => {
            this.notificationService.error(err.error?.message || err.message || 'An unexpected error occurred.');
          },
        });
    } catch (error) {
      console.error('Error in submitForm:', error);
      this.notificationService.error(error.message || 'An unexpected error occurred.');
      this.communicationBusService.closeProgressBar();
    }
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((queryParams) => {
      this.sub = queryParams.get('sub');
      if (this.sub) {
        this.fetchUser(this.sub);
      }
    });
  }

  ngOnDestroy(): void {
    try {
      this.subscriptions.unsubscribe();
    } catch (error) {
      this.notificationService.error('An error occurred during cleanup.');
    }
  }

  private fetchUser(sub: string) {
    try {
      this.communicationBusService.showProgressBar();
      this.userService.fetchUserByCognitoSub(sub)
        .pipe(finalize(() => this.communicationBusService.closeProgressBar()))
        .subscribe({
          next: (baseVO) => {
            const {data} = baseVO;
            if (!data) {
              this.notificationService.error('User data not found.');
              this.current = 2;
              return;
            }
            this.user = data;
            // Go straight to edit mode if profile is not yet complete
            this.current = this.user.isProfileComplete ? 3 : 2;
          },
          error: (err) => {
            if (err.status === 404) {
              this.notificationService.error('Your profile is not set up yet. Please contact support.');
            } else {
              this.notificationService.error(err.error?.message || 'Failed to load profile.');
            }
          }
        });
    } catch (error) {
      this.notificationService.error('An unexpected error occurred during initialization.');
      this.communicationBusService.closeProgressBar();
    }
  }

  backToPreviousPage() {
    this.communicationBusService.backToPreviousPage();
  }

  protected readonly environment = environment;
}
