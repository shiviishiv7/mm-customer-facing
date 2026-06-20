import {Component, OnInit} from '@angular/core';
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
export class UserProfileComponent implements OnInit {

  current = 1;
  user: UserModel;
  private subscriptions: Subscription = new Subscription();
  private sub: string | null = null;
  private matDialogRef: MatDialogRef<any>;
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
  ) {
  }

  createUser(): void {
    try {
      this.current = 2;
      this.user = new UserModel();
      this.user.cognitoSub = this.authService.sub;
      this.user.email = this.authService.email;
      this.user.addressVO = {};
    } catch (error) {
      this.notificationService.error('An error occurred while initializing the user.');
    }
  }

  submitForm(form: NgForm): void {
    try {
      if (!form.valid) {
        this.notificationService.error('Form is invalid. Please fix the errors and try again.');
        return;
      }

      // Compute age from dateOfBirth before sending to backend
      if (this.user.dateOfBirth) {
        const dob = new Date(this.user.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        this.user.age = age;
        // Normalize to YYYY-MM-DD string for backend
        this.user.dateOfBirth = dob.toISOString().split('T')[0];
      }

      if (!this.objectValidationService.userValidate(this.user)) {
        return;
      }

      this.communicationBusService.showProgressBar();

      const userOperation = this.user.id
        ? this.userService.updateUser(this.user)
        : this.userService.createUser(this.user);

      userOperation
        .pipe(finalize(() => this.communicationBusService.closeProgressBar()))
        .subscribe({
          next: (res) => {
            this.user = res.data ?? this.user;
            this.current = 3;
            this.notificationService.success('User data saved successfully!');
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
      this.userService.fetchUserByEmail(sub)
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
            if (!this.user.addressVO) this.user.addressVO = {};
            this.current = 3;
          },
          error: (err) => {
            if (err.status === 404 || err.error?.message === 'User does not exist') {
              this.communicationBusService.createUser();
            }
          }
        });
    } catch (error) {
      this.notificationService.error('An unexpected error occurred during initialization.');
      this.communicationBusService.closeProgressBar();
    }
  }

  removeUserFromInstitution(user: UserModel) {
    this.communicationBusService.routerNavigate('/dashboard/instant-match');
  }

  viewUserAttempt(user: UserModel) {
    this.communicationBusService.routerNavigate('/dashboard/attempt-history');
  }

  backToPreviousPage() {
    this.communicationBusService.backToPreviousPage();
  }

  protected readonly environment = environment;
}
