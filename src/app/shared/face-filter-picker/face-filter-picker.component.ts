import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaceFilterService, FILTER_OPTIONS, FaceFilter } from '@core/services/face-filter/face-filter.service';

@Component({
  selector: 'app-face-filter-picker',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './face-filter-picker.component.html',
  styleUrl: './face-filter-picker.component.scss'
})
export class FaceFilterPickerComponent {
  filterService = inject(FaceFilterService);
  options = FILTER_OPTIONS;
  active$ = this.filterService.activeFilter$;

  select(id: FaceFilter): void {
    this.filterService.setFilter(id);
  }
}
