import {Component, ElementRef, HostListener, OnInit, signal, ViewChild} from '@angular/core';

import {MatDrawer} from '@angular/material/sidenav';
import {CommunicationBusService} from '@shared/services/communication-bus.service';
import {ApplicationRoutingEnum} from '@core/enums/application-routing-enum';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  @ViewChild('drawer') drawer: MatDrawer;

  constructor(public commBus: CommunicationBusService) {
  }


  ngOnInit() {
    this.commBus.footerOff();
  }


  protected readonly ApplicationRoutingEnum = ApplicationRoutingEnum;
}
