import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AvatarService } from '@core/services/avatar/avatar.service';
import { AvatarPreset } from '@core/services/avatar/avatar-presets';
import { VRoidBrowserDialogComponent } from '@shared/vroid-browser/vroid-browser-dialog.component';

@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  templateUrl: './avatar-picker.component.html',
  styleUrl:    './avatar-picker.component.scss'
})
export class AvatarPickerComponent {
  avatarService = inject(AvatarService);
  private dialog = inject(MatDialog);

  selected$ = this.avatarService.selectedAvatar$;
  loading$  = this.avatarService.loading$;
  error$    = this.avatarService.error$;
  presets   = this.avatarService.presets;

  noAvatar(): void {
    this.avatarService.useNoAvatar();
  }

  select(preset: AvatarPreset): void {
    this.avatarService.selectAvatar(preset);
  }

  openVRoidBrowser(): void {
    this.dialog.open(VRoidBrowserDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '85vh',
    });
  }

  onFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file?.name.endsWith('.vrm')) {
      this.avatarService.loadFromFile(file);
    }
  }
}
