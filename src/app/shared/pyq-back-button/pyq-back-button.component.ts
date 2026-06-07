import { Component } from '@angular/core';
import {Location} from '@angular/common';

@Component({
  selector: 'app-pyq-back-button',
   templateUrl: './pyq-back-button.component.html',
  styleUrl: './pyq-back-button.component.scss'
})
export class PyqBackButtonComponent {
   constructor(private location: Location) {
   }
  backToPreviousPage() {
     this.location.back();
  }
}
