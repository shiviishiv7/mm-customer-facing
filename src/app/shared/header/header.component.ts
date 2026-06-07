import {Component, HostListener, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';
import {CommunicationBusService} from '../services/communication-bus.service';
import {MatDialog} from '@angular/material/dialog';
import {ShowSettingProfileComponent} from '../show-setting-profile/show-setting-profile.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  @ViewChild('sideNav') sideNav?: MatSidenav;
  user: any = null;

  readonly dialog = inject(MatDialog);
  desktopMode: boolean = false;

  constructor(public commBus: CommunicationBusService) {
  }

  ngOnInit(): void {
    this.user = this.commBus.user;
    this.desktopMode = !this.commBus.isMobileView();
  }

  showSetting($event: MouseEvent) {
    const dialogRef = this.dialog.open(ShowSettingProfileComponent, {
      position: {
        top: `100px`,
        right: `100px`
      },
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {});
  }
}
