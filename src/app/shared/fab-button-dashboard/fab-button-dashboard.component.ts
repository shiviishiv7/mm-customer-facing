import {Component, Input, OnInit} from '@angular/core';
import {MatDrawer} from '@angular/material/sidenav';
import {MatMiniFabButton} from '@angular/material/button';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-fab-button-dashboard',
  templateUrl: './fab-button-dashboard.component.html',
  styleUrl: './fab-button-dashboard.component.scss'
})
export class FabButtonDashboardComponent implements OnInit{

  @Input('drawer') drawer: MatDrawer;

  //
  // @HostListener('window:resize', ['$event'])
  // onResize() {
  //   this.checkViewport();
  // }

  ngOnInit() {
    this.checkViewport();
  }

  private checkViewport() {
    if (this.drawer && window.innerWidth < 768) {
      this.drawer.close();
    }
  }
}
