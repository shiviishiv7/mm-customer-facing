import { Component } from '@angular/core';
import {WebSocketConnectionService} from '@core/services/web-socket-connection.service';

@Component({
  selector: 'app-web-socket-user',
  standalone: true,
  imports: [],
  templateUrl: './web-socket-user.component.html',
  styleUrl: './web-socket-user.component.scss'
})
export class WebSocketUserComponent {



  constructor(public webSocketConnectionService:WebSocketConnectionService) {
  }



  public init(){
    this.webSocketConnectionService.initClient()
  }

}
