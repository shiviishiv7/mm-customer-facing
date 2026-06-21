import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { UserPreferenceService } from '@core/services/user-preference.service';
import {
  AvailableFilterOption,
  FilterChip,
  FilterDialogData,
  MatchFilter
} from '@core/models/interface/some-interface';
import {
  baseOptions,
  categoryGroupOptions,
  matchCategoriesMaster,
  subCategoryAttributeMap
} from '@core/constants/common-constant';

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
    MatAutocompleteModule
  ],
  templateUrl: './match-filter-dialog.component.html',
  styleUrl: './match-filter-dialog.component.scss'
})
export class MatchFilterDialogComponent implements OnInit {

  private fb           = inject(FormBuilder);
  private prefService  = inject(UserPreferenceService);
  private dialogRef    = inject(MatDialogRef<MatchFilterDialogComponent>);
  data: FilterDialogData = inject(MAT_DIALOG_DATA);

  form!: FormGroup;

  /**
   * FIX Error 1 — searchCtrl value type.
   * Angular Material autocomplete sets the control value to the full
   * AvailableFilterOption object when the user selects from the dropdown.
   * Using a typed union here so _filterOptions() can handle both cases.
   */
  searchCtrl     = new FormControl<string | AvailableFilterOption>('');
  valueInputCtrl = new FormControl('', Validators.required);
  saving = false;
  error  = '';

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('valueInput')  valueInput!: ElementRef<HTMLInputElement>;

  activeFilters: FilterChip[] = [];
  pendingDynamicFilter: AvailableFilterOption | null = null;
  filteredEnumOptions: { enumValue: string; displayName: string }[] = [];
  activeSubCategory: string | null = null;
  allOptions: AvailableFilterOption[] = [];
  filteredOptions!: Observable<AvailableFilterOption[]>;

  private allOptions$ = new BehaviorSubject<AvailableFilterOption[]>([]);

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const e = this.data?.existing ?? {};
    this.form = this.fb.group({
      maxTimezoneOffsetHours: [e.maxTimezoneOffsetHours ?? 5],
      sameCompanyAllowed:     [e.sameCompanyAllowed ?? false],
    });

    this.hydrateExistingFilters(e);
    this.rebuildAutocompleteOptions();

    this.filteredOptions = combineLatest([
      this.searchCtrl.valueChanges.pipe(startWith('')),
      this.allOptions$
    ]).pipe(
      debounceTime(0),   // flush in same tick, prevents ExpressionChangedAfterCheck
      map(([searchValue, options]) =>
        this._filterOptions(searchValue, options)
      )
    );
  }

  // ── Autocomplete option builder ────────────────────────────────────────────

  private rebuildAutocompleteOptions(): void {
    const hasParentCategory  = this.activeFilters.some(f => f.key === 'parentCategory');
    const hasChildCategory   = this.activeFilters.some(f => f.key === 'childCategory');

    const attrOptions = this.activeSubCategory
      ? (subCategoryAttributeMap[this.activeSubCategory] ?? [])
      : [];

    // Show category groups only when no category chosen at all.
    // When parent is chosen but child was removed, auto-open the
    // sub-category picker for that parent group instead.
    const showCategoryGroups = !hasParentCategory && !hasChildCategory;

    this.allOptions = [
      ...baseOptions,
      ...(showCategoryGroups ? categoryGroupOptions : []),
      ...attrOptions,
    ];

    this.allOptions$.next(this.allOptions);

    // When parent category exists but child was removed, immediately
    // re-trigger the sub-category picker so user can pick a track.
    if (hasParentCategory && !hasChildCategory && !this.pendingDynamicFilter) {
      const parentChip = this.activeFilters.find(f => f.key === 'parentCategory');
      if (parentChip) {
        const parentGroup = parentChip.value as string;
        const matchingCategoryOption = categoryGroupOptions.find(o => o.key === parentGroup);
        if (matchingCategoryOption) {
          this.pendingDynamicFilter = matchingCategoryOption;
          this.filteredEnumOptions  = matchCategoriesMaster
            .filter(c => c.parentGroup === parentGroup)
            .map(c => ({ enumValue: c.enumValue, displayName: c.displayName }));
          this.valueInputCtrl.reset();
        }
      }
    }
  }

  // ── Filter function ────────────────────────────────────────────────────────

  /**
   * FIX Error 1 — value can be a string OR an AvailableFilterOption object.
   * When the user selects an option from the mat-autocomplete, Angular Material
   * sets the FormControl value to the option object. We extract the label string
   * for filtering, and return empty list so the panel closes after selection.
   */
  private _filterOptions(
    value: string | AvailableFilterOption | null,
    options: AvailableFilterOption[]
  ): AvailableFilterOption[] {
    // If value is an object (option was selected), show nothing — panel should close
    if (value !== null && typeof value === 'object') {
      return [];
    }

    // TypeScript still sees string | AvailableFilterOption here despite the guard above,
    // so we cast explicitly after ruling out object and null.
    const filterValue = ((value as string) ?? '').toLowerCase();

    return options.filter(option => {
      const baseKey = option.key.split(':')[0];
      const matchesSearch = option.label.toLowerCase().includes(filterValue);
      const notAlreadyActive = !this.activeFilters.some(f => f.key === baseKey);
      return matchesSearch && notAlreadyActive;
    });
  }

  // ── Hydration ──────────────────────────────────────────────────────────────

  private hydrateExistingFilters(e: any): void {
    if (e.preferredGender) {
      this.addChip('preferredGender', 'Gender', e.preferredGender, e.preferredGender);
    }
    if (e.preferredCity)    this.addChip('preferredCity',    'City',    e.preferredCity,    e.preferredCity);
    if (e.preferredState)   this.addChip('preferredState',   'State',   e.preferredState,   e.preferredState);
    if (e.preferredCountry) this.addChip('preferredCountry', 'Country', e.preferredCountry, e.preferredCountry);
    if (e.preferredZip)     this.addChip('preferredZip',     'Zip',     e.preferredZip,     e.preferredZip);

    if (e.parentCategory) {
      this.addChip('parentCategory', 'Category', e.parentCategory, e.parentCategory);
    }

    if (e.childCategory) {
      const match = matchCategoriesMaster.find(m => m.enumValue === e.childCategory);
      const displayName = match ? match.displayName : e.childCategory;
      this.addChip('childCategory', 'Track', e.childCategory, displayName);
      this.activeSubCategory = e.childCategory;

      const attrOptions = subCategoryAttributeMap[e.childCategory] ?? [];
      attrOptions.forEach(opt => {
        if (e[opt.key] !== undefined && e[opt.key] !== null) {
          const cleanLabel = opt.label.replace('...', '').replace('?', '').trim();
          this.addChip(opt.key, cleanLabel, e[opt.key], String(e[opt.key]), e.childCategory);
        }
      });
    }
  }

  // ── Chip selection from autocomplete ──────────────────────────────────────

  selected(event: MatAutocompleteSelectedEvent): void {
    const selectedOption = event.option.value as AvailableFilterOption;

    if (!selectedOption.isDynamic) {
      const [key, val] = selectedOption.key.split(':');
      this.addChip(key, selectedOption.label.split(':')[0].trim(), val, val);
      this.rebuildAutocompleteOptions();
      this.clearSearchInput();
      return;
    }

    const isCategoryGroup = categoryGroupOptions.some(o => o.key === selectedOption.key);
    if (isCategoryGroup) {
      this.pendingDynamicFilter = selectedOption;
      this.filteredEnumOptions  = matchCategoriesMaster
        .filter(c => c.parentGroup === selectedOption.key)
        .map(c => ({ enumValue: c.enumValue, displayName: c.displayName }));
      this.valueInputCtrl.reset();
      this.clearSearchInput();
      return;
    }

    this.pendingDynamicFilter = selectedOption;
    this.valueInputCtrl.reset();

    if (selectedOption.type === 'ENUM_SELECT' && selectedOption.options) {
      this.filteredEnumOptions = selectedOption.options.map(o => ({ enumValue: o, displayName: o }));
    } else if (selectedOption.type !== 'BOOLEAN') {
      setTimeout(() => this.valueInput?.nativeElement?.focus(), 50);
    }

    this.clearSearchInput();
  }

  // ── Value commit methods ───────────────────────────────────────────────────

  commitEnumSelection(event: any): void {
    if (!this.pendingDynamicFilter) return;
    this.valueInputCtrl.setValue(event.value);
    this.executeEnumCommit(event.value);
  }

  commitBooleanSelection(val: boolean): void {
    if (!this.pendingDynamicFilter) return;
    const cleanLabel = this.pendingDynamicFilter.label.replace('?', '').trim();
    this.addChip(
      this.pendingDynamicFilter.key,
      cleanLabel,
      val,
      val ? 'Yes' : 'No',
      this.activeSubCategory ?? undefined
    );
    this.pendingDynamicFilter = null;
    this.rebuildAutocompleteOptions();
    this.clearSearchInput();
  }

  commitPendingValue(): void {
    if (!this.pendingDynamicFilter) return;
    if (
      this.pendingDynamicFilter.type === 'TEXT' ||
      this.pendingDynamicFilter.type === 'NUMBER' ||
      this.pendingDynamicFilter.type === 'DATE'
    ) {
      this.commitDynamicValue();
    } else if (this.pendingDynamicFilter.type === 'ENUM_SELECT') {
      const val = this.valueInputCtrl.value;
      if (val) this.executeEnumCommit(val);
    }
  }

  commitDynamicValue(): void {
    if (this.valueInputCtrl.invalid || !this.pendingDynamicFilter) return;
    const rawValue   = this.valueInputCtrl.value!.toString().trim();
    const cleanLabel = this.pendingDynamicFilter.label.replace('...', '').replace('?', '').trim();
    this.addChip(
      this.pendingDynamicFilter.key,
      cleanLabel,
      rawValue,
      rawValue,
      this.activeSubCategory ?? undefined
    );
    this.pendingDynamicFilter = null;
    this.rebuildAutocompleteOptions();
    this.clearSearchInput();
  }

  cancelDynamicValue(): void {
    // If the user cancels while picking a sub-category (Track),
    // the parent category chip is also removed — a category without
    // a track is a half-complete state and unusable for matching.
    if (this.pendingDynamicFilter &&
      categoryGroupOptions.some(o => o.key === this.pendingDynamicFilter!.key)) {
      this.activeFilters = this.activeFilters.filter(
        f => f.key !== 'parentCategory' && f.key !== 'childCategory' && !f.ownerSubCategory
      );
      this.activeSubCategory = null;
    }

    this.pendingDynamicFilter = null;
    this.valueInputCtrl.reset();
    this.rebuildAutocompleteOptions();
    this.clearSearchInput();
  }

  private executeEnumCommit(enumVal: string): void {
    if (!this.pendingDynamicFilter) return;

    const isCategoryGroup = categoryGroupOptions.some(o => o.key === this.pendingDynamicFilter!.key);

    if (isCategoryGroup) {
      const matchedNode = matchCategoriesMaster.find(c => c.enumValue === enumVal);
      if (!matchedNode) return;
      this.addChip('parentCategory', 'Category', matchedNode.parentGroup, matchedNode.parentGroup);
      this.addChip('childCategory',  'Track',    enumVal, matchedNode.displayName);
      this.activeSubCategory = enumVal;
    } else {
      const cleanLabel = this.pendingDynamicFilter.label.replace('...', '').replace('?', '').trim();
      this.addChip(
        this.pendingDynamicFilter.key,
        cleanLabel,
        enumVal,
        enumVal,
        this.activeSubCategory ?? undefined
      );
    }

    this.pendingDynamicFilter = null;
    this.rebuildAutocompleteOptions();
    this.clearSearchInput();
  }

  // ── Chip removal ──────────────────────────────────────────────────────────

  removeFilter(chip: FilterChip): void {
    if (chip.key === 'parentCategory') {
      this.removeCategoryAndBelow();
    } else if (chip.key === 'childCategory') {
      this.removeSubCategoryAndBelow();
    } else {
      this.activeFilters = this.activeFilters.filter(f => f.key !== chip.key);
    }
    this.rebuildAutocompleteOptions();
    this.clearSearchInput();
  }

  private removeCategoryAndBelow(): void {
    this.activeFilters = this.activeFilters.filter(
      f => f.key !== 'parentCategory' && f.key !== 'childCategory' && !f.ownerSubCategory
    );
    this.activeSubCategory = null;
  }

  private removeSubCategoryAndBelow(): void {
    this.activeFilters = this.activeFilters.filter(
      f => f.key !== 'childCategory' && !f.ownerSubCategory
    );
    this.activeSubCategory = null;
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  resetAllFilters(): void {
    this.activeFilters     = [];
    this.activeSubCategory = null;
    this.form.reset({ maxTimezoneOffsetHours: 5, sameCompanyAllowed: false });
    this.rebuildAutocompleteOptions();
    this.clearSearchInput();
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  save(): void {
    this.saving = true;
    this.error  = '';

    const payload: Record<string, any> = {};
    this.activeFilters.forEach(f => payload[f.key] = f.value);

    const filter: MatchFilter = {
      ...this.form.value,
      ...payload,
      id:         this.data?.existing?.id,
      cognitoSub: this.data?.existing?.cognitoSub,
    };
    console.log(filter)

    this.prefService.save(filter).subscribe({
      next: (res) => {
        this.saving = false;
        this.dialogRef.close({ saved: true, filter, response: res });
      },
      error: () => {
        this.saving = false;
        this.error  = 'Failed to save filter. Please try again.';
      }
    });
  }

  cancel(): void {
    this.dialogRef.close({ saved: false });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private addChip(
    key: string,
    label: string,
    value: any,
    displayValue: string,
    ownerSubCategory?: string
  ): void {
    this.activeFilters = this.activeFilters.filter(f => f.key !== key);
    this.activeFilters.push({ key, label, value, displayValue, ownerSubCategory });
  }

  private clearSearchInput(): void {
    this.searchCtrl.setValue('');
    if (this.searchInput) this.searchInput.nativeElement.value = '';
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  /**
   * Used by the template as [displayWith] on mat-autocomplete.
   * When Angular Material sets the control value to an option object,
   * this tells the input what string to display (empty string = clears input).
   */
  displayFn(_option: AvailableFilterOption | string | null): string {
    return '';
  }

  get activeSubCategoryLabel(): string {
    if (!this.activeSubCategory) return '';
    const match = matchCategoriesMaster.find(m => m.enumValue === this.activeSubCategory);
    return match ? match.displayName : this.activeSubCategory;
  }

  get hasAttributeFilters(): boolean {
    return this.activeFilters.some(f => !!f.ownerSubCategory);
  }
}
