import {Component, OnInit} from '@angular/core';
import {UserModel} from '@core/models/class/user-model';
import {finalize, Subscription, tap} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '@core/services/user.service';
import {NotificationService} from '../../../../shared/services/notification.service';
import {ObjectValidationService} from '@core/services/object-validation.service';
import {CommunicationBusService} from '../../../../shared/services/communication-bus.service';
import {NgForm} from '@angular/forms';
import {signOut} from 'aws-amplify/auth';
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit{

  current = 1;
  user: UserModel;
  private subscriptions: Subscription = new Subscription();
  private sub: string | null = null;
  private userId: number;
  private matDialogRef: MatDialogRef<any>;
  adminUser: boolean = false;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    private notificationService: NotificationService,
    private objectValidationService: ObjectValidationService,
    private route: ActivatedRoute,
    private communicationBusService: CommunicationBusService
  ) {
  }

  createUser(): void {
    try {
      this.current = 2;
      this.user = new UserModel();
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

      if (!this.objectValidationService.userValidate(this.user)) {
        return;
      }

      this.communicationBusService.showProgressBar();

      const userOperation = this.user.id
        ? this.userService.updateUser(this.user)
        : this.userService.createUser(this.user);

      userOperation
        .pipe(
          finalize(() => {
            // Ensure progress bar is closed after completion
            this.communicationBusService.closeProgressBar();
          })
        )
        .subscribe({
          next: () => {
            this.current = 3;
            this.notificationService.success('User data saved successfully!');
          },
          error: (err) => {
            this.notificationService.error(err.message || 'An unexpected error occurred.');
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
            this.current = 3;
          },
          error: (err) => {
            if (err.message === 'User does not exist') {
              this.communicationBusService.createUser();
            }
          }
        })

    } catch (error) {
      this.notificationService.error('An unexpected error occurred during initialization.');
      this.communicationBusService.closeProgressBar();
    }
  }


  private handleError(error, errorDisplayingTheProgressBar: string) {
    this.notificationService.error(error.message, 'Dismiss')
  }

  removeUserFromInstitution(user: UserModel) {

    this.communicationBusService.routerNavigate("/dashboard/instant-match");

  }

  viewUserAttempt(user: UserModel) {
    this.communicationBusService.routerNavigate("/dashboard/attempt-history");
  }


  backToPreviousPage() {
    this.communicationBusService.backToPreviousPage();
  }

  protected readonly environment = environment;
}

