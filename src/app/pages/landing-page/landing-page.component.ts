import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommunicationBusService} from '@shared/services/communication-bus.service';
import {environment} from '@environments/environment';
import {catchError, pipe, finalize, of, Subject, tap, takeUntil} from 'rxjs';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(public commBus: CommunicationBusService) {
  }

  ngOnInit(): void {
    // Initialization logic (if needed in the future)
  }

  startAuthentication(): void {
    this.isLoading = true;
   this.commBus.startAttemptingExam();
    // this.commBus.showProgressBar();
  //  this.commBus.checkCurrentUser().then(r => {});
  }

  ngOnDestroy(): void {
    // Emit a value to trigger unsubscription for all observables in the component
    this.destroy$.next();
    this.destroy$.complete();
  }
}
