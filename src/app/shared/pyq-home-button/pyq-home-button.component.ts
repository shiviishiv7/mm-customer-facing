import {Component, Input} from '@angular/core';
import {CommunicationBusService} from '../services/communication-bus.service';
import {ApplicationRoutingEnum} from '@core/enums/application-routing-enum';

@Component({
  selector: 'app-pyq-home-button',
  templateUrl: './pyq-home-button.component.html',
  styleUrl: './pyq-home-button.component.scss'
})
export class PyqHomeButtonComponent {
  @Input() isMobileView: any;

  constructor(private communicationBusService: CommunicationBusService) {
  }

  goBackToDashboard() {
    this.communicationBusService.routerNavigate(ApplicationRoutingEnum.DASHBOARD)
  }
}
