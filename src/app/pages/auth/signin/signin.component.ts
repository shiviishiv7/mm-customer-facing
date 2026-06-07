import {Component, inject, OnInit} from '@angular/core';
import {CommunicationBusService} from '@shared/services/communication-bus.service';

import {SigninDialogComponent} from '../signin-dialog/signin-dialog.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  constructor(private comm: CommunicationBusService) {
  }

  ngOnInit(): void {
    // this.comm.startAttemptingExam();
    // if (!this.comm.isMobileView()){
    //
    // } else{
    //   const dialogRef = this.dialog.open(SigninDialogComponent, {
    //     position: {
    //       top: `70vw`,
    //       right: `100px`
    //     },
    //     panelClass: 'custom-dialog-container'
    //   });
    //
    //   dialogRef.afterClosed().subscribe(result => {
    //   });
    // }
  }

  goToDashboard() {
    this.comm.startAttemptingExam();
  }
}
