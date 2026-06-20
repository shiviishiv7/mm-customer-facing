import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface RedditMeme {
  title: string;
  url: string;
  thumbnail: string;
  subreddit: string;
  permalink: string;
  score: number;
}

export type MemeSort = 'hot' | 'top' | 'new' | 'rising';
export type MemeTime = 'day' | 'week' | 'month' | 'all';

export interface MemeCategory {
  id: string;
  label: string;
  emoji: string;
  subreddit: string;
}

export const MEME_CATEGORIES: MemeCategory[] = [
  { id: 'general',   label: 'General',   emoji: '😂', subreddit: 'memes'          },
  { id: 'dank',      label: 'Dank',      emoji: '🗿', subreddit: 'dankmemes'      },
  { id: 'wholesome', label: 'Wholesome', emoji: '🥰', subreddit: 'wholesomememes' },
  { id: 'relatable', label: 'Relatable', emoji: '💀', subreddit: 'me_irl'         },
  { id: 'tech',      label: 'Tech',      emoji: '🤓', subreddit: 'ProgrammerHumor'},
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

@Injectable({ providedIn: 'root' })
export class RedditMemeService {

  private http = inject(HttpClient);
  // All Reddit calls go through our backend proxy to avoid CORS / User-Agent blocks
  private proxyBase = `${environment.apiUrl}/reddit`;

  async getMemes(
    subreddit: string,
    sort: MemeSort = 'hot',
    time: MemeTime = 'day',
    limit = 50
  ): Promise<RedditMeme[]> {
    const res: any = await firstValueFrom(
      this.http.get(`${this.proxyBase}/memes`, {
        params: { subreddit, sort, t: time, limit }
      })
    );

    return (res?.data?.children ?? [])
      .map((c: any) => c.data)
      .filter((p: any) => this.isImagePost(p))
      .map((p: any) => this.toMeme(p));
  }

  async getRandomMeme(subreddit = 'memes'): Promise<RedditMeme | null> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.proxyBase}/random`, { params: { subreddit } })
      );
      // random.json returns an array — post data is at [0]
      const post = Array.isArray(res)
        ? res?.[0]?.data?.children?.[0]?.data
        : res?.data?.children?.[0]?.data;

      if (!post || !this.isImagePost(post)) return this.getRandomMeme(subreddit);
      return this.toMeme(post);
    } catch {
      return null;
    }
  }

  private toMeme(post: any): RedditMeme {
    return {
      title:     post.title,
      url:       post.url,
      thumbnail: post.thumbnail?.startsWith('http') ? post.thumbnail : post.url,
      subreddit: post.subreddit,
      permalink: `https://reddit.com${post.permalink}`,
      score:     post.score,
    };
  }

  private isImagePost(post: any): boolean {
    const url: string = post?.url ?? '';
    return (
      IMAGE_EXTENSIONS.some(ext => url.toLowerCase().includes(ext)) ||
      post?.post_hint === 'image'
    );
  }
}
