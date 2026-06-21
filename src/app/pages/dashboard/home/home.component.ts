import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';
import { ApplicationRoutingEnum } from '@core/enums/application-routing-enum';
import {MatchFilterDialogComponent} from '@shared/match-filter-dialog/match-filter-dialog.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  private router = inject(Router);
  private dialog = inject(MatDialog);
  auth = inject(AuthService);

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  goInstant(): void {
      this.dialog.open(MatchFilterDialogComponent, { width: '820px', maxWidth: '95vw', data: { mode: 'instant' } })
        .afterClosed()
        .subscribe(res=>{
          if (res['saved']){
            this.router.navigateByUrl(`${ApplicationRoutingEnum.DASHBOARD}/${ApplicationRoutingEnum.INSTANCE_MEETING}`);
          }
        })
   }

  goScheduled(): void {
    this.router.navigateByUrl(`${ApplicationRoutingEnum.DASHBOARD}/${ApplicationRoutingEnum.SCHEDULED_MATCH}`);
  }
}
