import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {AmplifyAuthenticatorModule} from '@aws-amplify/ui-angular';
import {SharedModule} from './shared/shared.module';
import {CommunicationBusService} from './shared/services/communication-bus.service';
import {filter, Subscription} from 'rxjs';
import {ShowHideComponentModel} from './core/models/class/show-hide-component.model';
import {CommonModule} from '@angular/common';

import {HttpClient} from '@angular/common/http';
import {UserService} from './core/services/user.service';
import {AuthService} from './core/services/auth.service';

import {environment} from '../environments/environment';
import {Title} from '@angular/platform-browser';
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker';
import {map} from 'rxjs/operators';
import {Platform} from '@angular/cdk/platform';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AmplifyAuthenticatorModule, SharedModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], // Fixed typo: `styleUrl` -> `styleUrls`
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'student';
  private hubListener: Function;
  showHideComponentModel: ShowHideComponentModel = new ShowHideComponentModel();
  private showHideComponentSubscription$: Subscription;

  constructor(
    private communicationBusService: CommunicationBusService,
    private userService: UserService,
    private authService: AuthService,
    private platform: Platform,
    private swUpdate: SwUpdate,
    private http: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private titleService: Title
  ) {
  }

  async ngOnInit() {
    // Subscribing to the component visibility changes

    this.showHideComponentSubscription$ = this.communicationBusService.componentShowHideBus.subscribe((data) => {
      this.showHideComponentModel = data;
      this.cdr.detectChanges(); // Trigger Angular change detection manually
    });

    // Initialize the application resources
    await this.communicationBusService.applicationInitializer();
    // console.log('Application initialized successfully');
    this.handleSetComponentTitle();
    this.pwaInitializing();
  }

  ngOnDestroy(): void {
    if (this.showHideComponentSubscription$) {
      this.showHideComponentSubscription$.unsubscribe();
    }
    this.communicationBusService.clearResource();
  }

  private handleSetComponentTitle() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {

        var rt = this.getChild(this.activatedRoute)

        rt.data.subscribe(data => {
          // console.log(data);
          this.titleService.setTitle(data.title)
        })
      })

  }

  getChild(activatedRoute: ActivatedRoute) {
    if (activatedRoute.firstChild) {
      return this.getChild(activatedRoute.firstChild);
    } else {
      return activatedRoute;
    }

  }

  // below code related to pwa
  modalPwaEvent: any;
  modalPwaPlatform: string | undefined;
  modalVersion: boolean;


  public updateVersion(): void {
    this.modalVersion = false;
    window.location.reload();
  }

  public closeVersion(): void {
    this.modalVersion = false;
  }

  private loadModalPwa(): void {
    if (this.platform.ANDROID) {
      window.addEventListener('beforeinstallprompt', (event: any) => {
        event.preventDefault();
        this.modalPwaEvent = event;
        this.modalPwaPlatform = 'ANDROID';
      });
    }

    if (this.platform.IOS && this.platform.SAFARI) {
      const isInStandaloneMode = ('standalone' in window.navigator) && ((<any>window.navigator)['standalone']);
      if (!isInStandaloneMode) {
        this.modalPwaPlatform = 'IOS';
      }
    }
  }

  public addToHomeScreen(): void {
    this.modalPwaEvent.prompt();
    this.modalPwaPlatform = undefined;
  }

  public closePwa(): void {
    this.modalPwaPlatform = undefined;
  }


//
  private pwaInitializing() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter((evt: any): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        map((evt: any) => {
          console.info(`currentVersion=[${evt.currentVersion} | latestVersion=[${evt.latestVersion}]`);
          this.modalVersion = true;
        }),
      );
    }

    this.loadModalPwa();
  }
}
