import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RedditMeme } from './reddit-meme.service';

@Injectable({ providedIn: 'root' })
export class MemeStreamService {

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private videoEl!: HTMLVideoElement;
  private memeImg: HTMLImageElement | null = null;
  private rafId = 0;
  private filteredStream: MediaStream | null = null;
  private rawStream: MediaStream | null = null;

  private _activeMeme$ = new BehaviorSubject<RedditMeme | null>(null);
  public activeMeme$ = this._activeMeme$.asObservable();

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start the canvas pipeline. Returns a MediaStream (canvas + original audio)
   * ready to be used as the WebRTC video source.
   */
  start(rawStream: MediaStream): MediaStream {
    this.rawStream = rawStream;

    const settings = rawStream.getVideoTracks()[0].getSettings();
    const w = settings.width  ?? 640;
    const h = settings.height ?? 480;

    // 2D canvas — safe to use getContext('2d') here (no WebGL clash)
    this.canvas = document.createElement('canvas');
    this.canvas.width  = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d')!;

    // Hidden video element to draw raw camera frames from
    this.videoEl = document.createElement('video');
    this.videoEl.srcObject = rawStream;
    this.videoEl.muted     = true;
    this.videoEl.play();

    this.renderLoop();

    this.filteredStream = this.canvas.captureStream(30);
    rawStream.getAudioTracks().forEach(t => this.filteredStream!.addTrack(t));

    return this.filteredStream;
  }

  /** Apply a Reddit meme — peer sees this image instead of your camera */
  async applyMeme(meme: RedditMeme): Promise<void> {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload  = () => resolve();
      img.onerror = () => reject(new Error('Failed to load meme image'));
      img.src = meme.url;
    });

    this.memeImg = img;
    this._activeMeme$.next(meme);
  }

  /** Go back to raw camera feed */
  clearMeme(): void {
    this.memeImg = null;
    this._activeMeme$.next(null);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.memeImg    = null;
    this.rawStream  = null;
    this.filteredStream = null;
    this._activeMeme$.next(null);
  }

  // ── RAF render loop ────────────────────────────────────────────────────────

  private renderLoop(): void {
    this.rafId = requestAnimationFrame(() => this.renderLoop());
    const { canvas, ctx } = this;

    if (this.memeImg) {
      this.drawMeme(ctx, this.memeImg, canvas.width, canvas.height);
    } else {
      // Raw camera passthrough
      ctx.drawImage(this.videoEl, 0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Draw meme centered + cover (like CSS object-fit: cover),
   * with a semi-transparent title bar at the bottom.
   */
  private drawMeme(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    cw: number,
    ch: number
  ): void {
    // Cover fit
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw    = img.naturalWidth  * scale;
    const dh    = img.naturalHeight * scale;
    const dx    = (cw - dw) / 2;
    const dy    = (ch - dh) / 2;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);

    // Title bar
    const meme = this._activeMeme$.getValue();
    if (meme?.title) {
      const barH = 36;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, ch - barH, cw, barH);
      ctx.fillStyle = '#fff';
      ctx.font      = '13px sans-serif';
      ctx.fillText(this.truncate(meme.title, 70), 10, ch - 10);
    }
  }

  private truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }
}
