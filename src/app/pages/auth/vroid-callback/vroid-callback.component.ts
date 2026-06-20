import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VRoidOAuthService } from '@core/services/vroid/vroid-oauth.service';

@Component({
  selector: 'app-vroid-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-wrap">
      <mat-progress-spinner mode="indeterminate" diameter="48" color="primary"
        *ngIf="!error"></mat-progress-spinner>
      <p *ngIf="!error" class="msg">Connecting to VRoid Hub…</p>
      <p *ngIf="error"  class="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .callback-wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100vh; gap: 1rem;
    }
    .msg   { color: #555; }
    .error { color: #c62828; font-weight: 500; }
  `]
})
export class VRoidCallbackComponent implements OnInit {

  private vroid  = inject(VRoidOAuthService);
  private router = inject(Router);

  error: string | null = null;

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');
    const err    = params.get('error');

    if (err) {
      this.error = `VRoid Hub denied access: ${err}`;
      return;
    }

    if (!code || !state) {
      this.error = 'Missing OAuth parameters.';
      return;
    }

    try {
      await this.vroid.handleCallback(code, state);
      // Return to wherever the user was — dashboard instant-meeting by default
      this.router.navigateByUrl('/dashboard/instance-meeting');
    } catch (e: any) {
      this.error = e?.message ?? 'OAuth exchange failed.';
    }
  }
}
