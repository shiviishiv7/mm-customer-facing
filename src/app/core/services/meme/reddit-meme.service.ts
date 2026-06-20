import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  { id: 'general',    label: 'General',    emoji: '😂', subreddit: 'memes'          },
  { id: 'dank',       label: 'Dank',       emoji: '🗿', subreddit: 'dankmemes'      },
  { id: 'wholesome',  label: 'Wholesome',  emoji: '🥰', subreddit: 'wholesomememes' },
  { id: 'relatable',  label: 'Relatable',  emoji: '💀', subreddit: 'me_irl'         },
  { id: 'tech',       label: 'Tech',       emoji: '🤓', subreddit: 'ProgrammerHumor'},
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

@Injectable({ providedIn: 'root' })
export class RedditMemeService {

  constructor(private http: HttpClient) {}

  async getMemes(
    subreddit: string,
    sort: MemeSort = 'hot',
    time: MemeTime = 'day',
    limit = 50
  ): Promise<RedditMeme[]> {
    const params = sort === 'top' ? `?t=${time}&limit=${limit}` : `?limit=${limit}`;
    const url    = `https://www.reddit.com/r/${subreddit}/${sort}.json${params}`;

    const res: any = await firstValueFrom(
      this.http.get(url, { headers: { Accept: 'application/json' } })
    );

    return (res?.data?.children ?? [])
      .map((c: any) => c.data)
      .filter((p: any) => this.isImagePost(p))
      .map((p: any) => ({
        title:     p.title,
        url:       p.url,
        thumbnail: p.thumbnail?.startsWith('http') ? p.thumbnail : p.url,
        subreddit: p.subreddit,
        permalink: `https://reddit.com${p.permalink}`,
        score:     p.score,
      }));
  }

  async getRandomMeme(subreddit = 'memes'): Promise<RedditMeme | null> {
    // Reddit's /random endpoint returns a random post
    const url = `https://www.reddit.com/r/${subreddit}/random.json`;
    try {
      const res: any = await firstValueFrom(
        this.http.get(url, { headers: { Accept: 'application/json' } })
      );
      // random.json returns an array with the post listing at [0]
      const post = res?.[0]?.data?.children?.[0]?.data;
      if (!post || !this.isImagePost(post)) return this.getRandomMeme(subreddit);
      return {
        title:     post.title,
        url:       post.url,
        thumbnail: post.thumbnail?.startsWith('http') ? post.thumbnail : post.url,
        subreddit: post.subreddit,
        permalink: `https://reddit.com${post.permalink}`,
        score:     post.score,
      };
    } catch {
      return null;
    }
  }

  private isImagePost(post: any): boolean {
    const url: string = post?.url ?? '';
    return (
      IMAGE_EXTENSIONS.some(ext => url.toLowerCase().includes(ext)) ||
      post?.post_hint === 'image'
    );
  }
}
