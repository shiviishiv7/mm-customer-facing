import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VRoidOAuthService, VRoidCharacter } from '@core/services/vroid/vroid-oauth.service';
import { AvatarService } from '@core/services/avatar/avatar.service';

@Component({
  selector: 'app-vroid-browser-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatTabsModule,
    MatProgressSpinnerModule, MatIconModule, MatTooltipModule
  ],
  templateUrl: './vroid-browser-dialog.component.html',
  styleUrl:    './vroid-browser-dialog.component.scss'
})
export class VRoidBrowserDialogComponent implements OnInit {

  private vroid        = inject(VRoidOAuthService);
  private avatarSvc    = inject(AvatarService);
  private dialogRef    = inject(MatDialogRef<VRoidBrowserDialogComponent>);

  isLoggedIn$ = this.vroid.isLoggedIn$;
  loading     = false;
  loadingId: string | null = null;
  error: string | null = null;

  myCharacters:      VRoidCharacter[] = [];
  heartedCharacters: VRoidCharacter[] = [];

  async ngOnInit(): Promise<void> {
    if (this.vroid.isLoggedIn$.getValue()) {
      await this.loadCharacters();
    }
  }

  async login(): Promise<void> {
    // Store current URL so callback can return here
    sessionStorage.setItem('vroid_return', window.location.pathname);
    await this.vroid.login();
  }

  logout(): void {
    this.vroid.logout();
    this.myCharacters = [];
    this.heartedCharacters = [];
  }

  async loadCharacters(): Promise<void> {
    this.loading = true;
    this.error   = null;
    try {
      const [mine, hearted] = await Promise.all([
        this.vroid.getMyCharacters(),
        this.vroid.getHeartedCharacters(),
      ]);
      this.myCharacters      = mine;
      this.heartedCharacters = hearted;
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to load characters.';
    } finally {
      this.loading = false;
    }
  }

  async selectCharacter(char: VRoidCharacter): Promise<void> {
    this.loadingId = char.id;
    this.error     = null;
    try {
      const model      = await this.vroid.getLatestModel(char.id);
      const downloadUrl = await this.vroid.getDownloadUrl(model.id);

      // Fetch the VRM blob and create an object URL — avoids CORS on direct links
      const blob    = await fetch(downloadUrl).then(r => r.blob());
      const blobUrl = URL.createObjectURL(blob);

      await this.avatarSvc.selectAvatar({
        id:   char.id,
        name: char.name,
        emoji: '🧑',
        url:  blobUrl,
      });

      this.dialogRef.close();
    } catch (e: any) {
      this.error = `Could not load avatar: ${e?.message ?? e}`;
    } finally {
      this.loadingId = null;
    }
  }

  close(): void { this.dialogRef.close(); }
}
