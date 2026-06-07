import {Component, Input, OnInit} from '@angular/core';
import {MatDrawer} from '@angular/material/sidenav';
import {MatMiniFabButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-fab-toggle-test',
  templateUrl: './fab-toggle-test.component.html',
  styleUrl: './fab-toggle-test.component.scss'
})
export class FabToggleTestComponent implements OnInit{

  ngOnInit(): void {
    console.log('Method not implemented.');
  }
  @Input('drawer-ref') drawer: MatDrawer;
}
