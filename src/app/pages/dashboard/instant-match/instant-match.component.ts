import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PoolUser, WebRtcService } from '@core/services/web-rtc.service';
import { MatchFilterDialogComponent } from '@shared/match-filter-dialog/match-filter-dialog.component';

@Component({
  selector: 'app-instant-match',
  standalone: true,
  imports: [NgFor, NgIf, AsyncPipe, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './instant-match.component.html',
  styleUrl: './instant-match.component.scss'
})
export class InstantMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;

  webRtc  = inject(WebRtcService);
  private dialog = inject(MatDialog);

  poolUsers$    = this.webRtc.poolUsers$;
  remoteStream$ = this.webRtc.remoteStream$;
  callStatus$   = this.webRtc.callStatus$;

  ngOnInit(): void {
    this.webRtc.joinPool();
  }

  ngAfterViewInit(): void {
    this.webRtc.localStream$.subscribe(stream => {
      this.localVideoRef.nativeElement.srcObject = stream;
    });

    this.webRtc.remoteStream$.subscribe(stream => {
      this.remoteVideoRef.nativeElement.srcObject = stream;
    });
  }

  openFilters(): void {
    this.dialog.open(MatchFilterDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { mode: 'instant' }
    });
  }

  connect(user: PoolUser): void {
    this.webRtc.requestConnection(user.cognitoSub);
  }

  endCall(): void {
    this.webRtc.leavePool();
  }

  ngOnDestroy(): void {
    this.webRtc.leavePool();
  }
}
