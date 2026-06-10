import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { UserPreferenceService, MatchFilter } from '@core/services/user-preference.service';

export interface FilterDialogData {
  /** Pass existing preferences so the form pre-fills */
  existing?: MatchFilter;
  /** 'instant' or 'scheduled' — controls whether datetime picker shows */
  mode: 'instant' | 'scheduled';
}

@Component({
  selector: 'app-match-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './match-filter-dialog.component.html',
  styleUrl: './match-filter-dialog.component.scss'
})
export class MatchFilterDialogComponent implements OnInit {

  private fb          = inject(FormBuilder);
  private prefService = inject(UserPreferenceService);
  private dialogRef   = inject(MatDialogRef<MatchFilterDialogComponent>);
  data: FilterDialogData = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  saving = false;
  error  = '';

  readonly genderOptions = [
    { value: null,     label: 'No preference' },
    { value: 'MALE',   label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER',  label: 'Other' },
  ];

  ngOnInit(): void {
    const e = this.data?.existing ?? {};
    this.form = this.fb.group({
      // Age
      minAge:               [e.minAge   ?? 18],
      maxAge:               [e.maxAge   ?? 60],
      // Gender
      preferredGender:      [e.preferredGender ?? null],
      // Company
      preferredCompany:     [e.preferredCompany     ?? ''],
      sameCompanyAllowed:   [e.sameCompanyAllowed   ?? false],
      // Education
      preferredCollege:     [e.preferredCollege     ?? ''],
      // Location
      preferredZip:         [e.preferredZip         ?? ''],
      preferredCity:        [e.preferredCity        ?? ''],
      preferredState:       [e.preferredState       ?? ''],
      preferredCountry:     [e.preferredCountry     ?? ''],
      // Timezone
      maxTimezoneOffsetHours: [e.maxTimezoneOffsetHours ?? 5],
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';

    const filter: MatchFilter = {
      ...this.form.value,
      id: this.data?.existing?.id,
      userId: this.data?.existing?.userId,
    };

    this.prefService.save(filter).subscribe({
      next: (res) => {
        this.saving = false;
        this.dialogRef.close({ saved: true, filter, response: res });
      },
      error: (err) => {
        this.saving = false;
        this.error = 'Failed to save preferences. Please try again.';
        console.error('[FilterDialog] save error', err);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close({ saved: false });
  }
}
