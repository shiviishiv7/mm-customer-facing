import {HostListener, Injectable, signal} from '@angular/core';
import {BehaviorSubject, catchError, delay, Observable, of, Subject, tap, throwError} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {getCurrentUser, fetchAuthSession, signOut} from 'aws-amplify/auth';

import {LoadingDialogComponent} from '../loading-dialog/loading-dialog.component';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import {ShowHideComponentModel} from '@core/models/class/show-hide-component.model';

import {NotificationService} from '../services/notification.service';
import {Location} from '@angular/common';
import {UserModel} from '@core/models/class/user-model';

import {BreakpointObserver} from '@angular/cdk/layout';
import {Hub} from 'aws-amplify/utils';

import {AuthService} from '@core/services/auth.service';
import {UtilsService} from '@core/utils/utils.service';
import {WindowRefService} from '@core/services/window-ref.service';
import {UserService} from '@core/services/user.service';
import {jwtDecode} from 'jwt-decode';
import {ApplicationRoutingEnum} from '@core/enums/application-routing-enum';

@Injectable({
  providedIn: 'root'
})
export class CommunicationBusService {
  private hubListener: Function;
  // Signals for application state management
  isMobileView = signal<boolean>(false); // Initialized in constructor
  user: any = null;
  // Subjects for event-based communication


  private matDialogRef: MatDialogRef<any>;
  public showHideComponentModel: ShowHideComponentModel;
  componentShowHideBus: BehaviorSubject<ShowHideComponentModel>;
  private studentModel: UserModel;
  sub: string;
  email: string;
  name: string;
  paymentNotification$: Subject<any>;

  constructor(private location: Location,
              public dialog: MatDialog,
              private route: ActivatedRoute,
              private http: HttpClient,
              private router: Router,
              private windowRef: WindowRefService,
              private userService: UserService,
              private utilsService: UtilsService,
              private authService: AuthService,
              private notificationService: NotificationService,
              private breakpointObserver: BreakpointObserver,
  ) {
    try {
      // Initialize Subjects
      this.sub = this.authService.sub;
      this.email = this.authService.email;
      this.name = this.authService.name;
      this.paymentNotification$ = new Subject();

      // Initialize application state
      this.showHideComponentModel = new ShowHideComponentModel();
      this.componentShowHideBus = new BehaviorSubject<ShowHideComponentModel>(this.showHideComponentModel);
    } catch (error) {
      this.handleError(error, 'Failed to initialize CommunicationBusService.');
    }
  }


  showProgressBar(): void {
    try {
      this.matDialogRef = this.dialog.open(LoadingDialogComponent, {
        disableClose: true,
        panelClass: 'custom-dialog-overlay',
        backdropClass: 'custom-backdrop'
      });
    } catch (error) {
      this.handleError(error, 'Error displaying the progress bar.');
    }
  }

  closeProgressBar(): void {
    try {
      if (this.matDialogRef) {
        this.matDialogRef.close();
      }
    } catch (error) {
      this.handleError(error, 'Error closing the progress bar.');
    }
  }

  openConfirmationDialog(data: any): MatDialogRef<any> {
    try {
      return this.dialog.open(ConfirmationDialogComponent, {data, disableClose: true});
    } catch (error) {
      this.handleError(error, 'Error opening the confirmation dialog.');
      return null;
    }
  }

  routerNavigate(url: string): void {
    try {
      this.router.navigateByUrl(url);
    } catch (error) {
      this.handleError(error, 'Error navigating to the requested page.');
    }
  }

  logout(): void {
    try {
      this.sub = null;
      this.authService.clearUserData();

      signOut().then(() => {
      });
      this.routerNavigate(ApplicationRoutingEnum.LANDING_PAGE)
    } catch (error) {
      this.handleError(error, 'Error during logout.');
    }
  }


  // Header and Footer Visibility Methods
  headerOff(): void {
    try {
      this.showHideComponentModel.headerVisibility = false;
      this.componentShowHideBus.next(this.showHideComponentModel);
    } catch (error) {
      this.handleError(error, 'Error turning off the header.');
    }
  }

  headerOn(): void {
    try {
      this.showHideComponentModel.headerVisibility = true;
      this.componentShowHideBus.next(this.showHideComponentModel);
    } catch (error) {
      this.handleError(error, 'Error turning on the header.');
    }
  }

  footerOff(): void {
    try {
      this.showHideComponentModel.footerVisibility = false;
      this.componentShowHideBus.next(this.showHideComponentModel);
    } catch (error) {
      this.handleError(error, 'Error turning off the footer.');
    }
  }

  footerOn(): void {
    try {
      this.showHideComponentModel.footerVisibility = true;
      this.componentShowHideBus.next(this.showHideComponentModel);
    } catch (error) {
      this.handleError(error, 'Error turning on the footer.');
    }
  }

  headerFooterOff(): void {
    try {
      this.showHideComponentModel.headerVisibility = false;
      this.showHideComponentModel.footerVisibility = false;
      this.componentShowHideBus.next(this.showHideComponentModel);
    } catch (error) {
      this.handleError(error, 'Error turning off both header and footer.');
    }
  }

  headerFooterOn(): void {
    try {
      this.showHideComponentModel.headerVisibility = true;
      this.showHideComponentModel.footerVisibility = true;
      this.componentShowHideBus.next(this.showHideComponentModel);
    } catch (error) {
      this.handleError(error, 'Error turning on both header and footer.');
    }
  }

  handleError(error: any, message: string): void {
    console.error('Error:', error);
    this.notificationService.error(message);
  }

  backToPreviousPage(): void {
    this.location.back();
  }

  extractInstitutionCode(hostname: string): string | null {
    try {
      let parts = hostname.split('.');
      if (parts.length >= 3) {
        return parts[1]; // Extract subdomain (e.g., sub.example.com -> sub)
      }
      return "matchmaking"; // If the hostname format is unexpected
    } catch (error) {
      console.error("Error extracting institution code:", error);
      return null;
    }
  }

  async applicationInitializer() {

    // const hostname = this.extractInstitutionCode(window.location.hostname);
    this.checkViewport();
    this.authenticationChangeListener();
    this.startAttemptingExam();
  }


  authenticationChangeListener() {
    this.hubListener = Hub.listen('auth', ({payload}) => {
      switch (payload.event as any) { // Type assertion to bypass TS2678
        case 'signedIn':
          this.checkCurrentUser();
          break;

        case 'tokenRefresh':
          console.log('🔄 Token refreshed');
          this.checkCurrentUser();
          break;

        case 'tokenRefresh_failure':
          console.error('❌ Token refresh failed:', payload);
          break;

        default:
          console.warn('⚠️ Unhandled auth event:', payload.event);
          break;
      }
    });
  }

  clearResource() {
    if (this.hubListener) {
      this.hubListener(); // Unsubscribe from the listener on component destroy
    }

  }


  routeUser() {

    // if (this.user) {
    //   let adminUser = '/dashboard';//means he is student
    //   if (this.amiAdminUser()) {
    //     adminUser = '/admin';
    //   }
    //   if (this.router.url === '/landing') {
    //     this.routerNavigate(adminUser);
    //   } else if (this.router.url === '/login') {
    //     this.routerNavigate(adminUser);
    //   } else if (this.router.url.startsWith('/dashboard/update-institution')) {
    //     this.routerNavigate(adminUser);
    //   }
    // }
  }

  // @HostListener('window:resize', ['$event'])
  // onResize() {
  //   this.checkViewport();
  // }

  private checkViewport() {
    if (window.innerWidth < 700) {
      this.isMobileView.set(true);
      // this.desktopMode = true;
    } else {
      this.isMobileView.set(false);
      // this.desktopMode = false;
    }
  }

  // private initializeView(): void {
  //   this.breakpointObserver.observe([Breakpoints.Handset]).subscribe({
  //     next: (result) => {
  //
  //       // this.isMobileView = result.matches;
  //     },
  //     error: (err) => {
  //       this.handleError(err, 'Error detecting device type.');
  //     },
  //   });
  // }


  public async createUser(): Promise<void> {
    try {
      const token = this.authService.getToken();
      if (!token) {
        console.error('❌ No token found. Cannot create user.');
        return;
      }
      const user = new UserModel();
      const jwtPayload: Record<string, any> = jwtDecode(token);
      user.name = jwtPayload.name;
      user.sub = jwtPayload.sub;
      user.email = jwtPayload.email;
      user.role = 'student';

      this.userService.createUser(user)
        .pipe(tap(v => this.success('✅ User created successfully')),
          catchError(err => of())).subscribe()
    } catch (error) {
      console.error('❌ Error in createUser:', error);
    }
  }

  public async checkCurrentUser(): Promise<void> {
    try {
      // Fetch the latest authentication session
      const {accessToken, idToken} = (await fetchAuthSession()).tokens ?? {};
      if (idToken && idToken.payload?.sub) {
        this.sub = idToken.payload.sub;
        this.authService.saveToken(idToken.toString());
        this.startAttemptingExam();
      } else {
        throw new Error("Valid User not found");
      }
      this.closeProgressBar();
    } catch (error) {
      this.error('❌ No valid ID token found in the session.');
      this.logout();
    }
  }

  startAttemptingExam() {
    try {
      const hasUser = this.authService.isAuthenticated();
      const url = hasUser ? 'dashboard' : 'signin';
      if (hasUser) {
        this.footerOff();
      }
      setTimeout(() => {
        this.router.navigateByUrl(url)
      }, 500);
    } catch (error) {
      this.error('❌ Error starting exam attempt:');
    }
  }

  success(message: string) {
    this.notificationService.success(message);
  }

  error(message: string) {
    this.notificationService.error(message);
  }

  info(msg: string) {
    this.notificationService.info(msg)
  }
}
