import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import {
  RedditMemeService, RedditMeme, MemeSort,
  MEME_CATEGORIES, MemeCategory
} from '@core/services/meme/reddit-meme.service';
import { MemeStreamService } from '@core/services/meme/meme-stream.service';

interface SortOption { value: MemeSort; label: string; emoji: string; }

@Component({
  selector: 'app-meme-picker-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatTabsModule, MatProgressSpinnerModule, MatTooltipModule, MatChipsModule
  ],
  templateUrl: './meme-picker-dialog.component.html',
  styleUrl:    './meme-picker-dialog.component.scss'
})
export class MemePickerDialogComponent implements OnInit {

  private redditSvc  = inject(RedditMemeService);
  private memeSvc    = inject(MemeStreamService);
  private dialogRef  = inject(MatDialogRef<MemePickerDialogComponent>);

  categories: MemeCategory[] = MEME_CATEGORIES;
  sortOptions: SortOption[] = [
    { value: 'hot',    label: 'Hot',       emoji: '🔥' },
    { value: 'top',    label: 'Top Today', emoji: '⭐' },
    { value: 'new',    label: 'New',       emoji: '🆕' },
    { value: 'rising', label: 'Rising',    emoji: '📈' },
  ];

  activeCategory = this.categories[0];
  activeSort: MemeSort = 'hot';
  memes: RedditMeme[] = [];
  selected: RedditMeme | null = null;
  preview: RedditMeme | null = null;

  loading        = false;
  loadingRandom  = false;
  applying       = false;
  error: string | null = null;

  async ngOnInit(): Promise<void> {
    // Pre-select the currently active meme if any
    this.selected = this.memeSvc['_activeMeme$'].getValue();
    await this.loadMemes();
  }

  async selectCategory(cat: MemeCategory): Promise<void> {
    this.activeCategory = cat;
    await this.loadMemes();
  }

  async selectSort(sort: MemeSort): Promise<void> {
    this.activeSort = sort;
    await this.loadMemes();
  }

  async loadMemes(): Promise<void> {
    this.loading = true;
    this.error   = null;
    try {
      this.memes = await this.redditSvc.getMemes(
        this.activeCategory.subreddit, this.activeSort
      );
    } catch (e: any) {
      this.error = 'Could not load memes — Reddit may be rate-limiting. Try again.';
    } finally {
      this.loading = false;
    }
  }

  async randomMeme(): Promise<void> {
    this.loadingRandom = true;
    this.error = null;
    try {
      const meme = await this.redditSvc.getRandomMeme(this.activeCategory.subreddit);
      if (meme) {
        this.preview  = meme;
        this.selected = meme;
      }
    } catch {
      this.error = 'Could not fetch random meme.';
    } finally {
      this.loadingRandom = false;
    }
  }

  pick(meme: RedditMeme): void {
    this.preview  = meme;
    this.selected = meme;
  }

  async apply(): Promise<void> {
    if (!this.selected) return;
    this.applying = true;
    try {
      await this.memeSvc.applyMeme(this.selected);
      this.dialogRef.close('applied');
    } catch (e: any) {
      this.error = `Could not load image: ${e?.message}. Try another meme.`;
    } finally {
      this.applying = false;
    }
  }

  noFilter(): void {
    this.memeSvc.clearMeme();
    this.dialogRef.close('cleared');
  }

  close(): void { this.dialogRef.close(); }
}
