import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FaceFilter = 'none' | 'blur' | 'pixel' | 'dog' | 'cat' | 'glasses' | 'alien';

export interface FilterOption {
  id: FaceFilter;
  label: string;
  emoji: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'none',    label: 'No filter',  emoji: '🎥' },
  { id: 'blur',    label: 'Blur face',  emoji: '🌫️' },
  { id: 'pixel',   label: 'Pixel face', emoji: '🟦' },
  { id: 'dog',     label: 'Dog',        emoji: '🐶' },
  { id: 'cat',     label: 'Cat',        emoji: '🐱' },
  { id: 'glasses', label: 'Glasses',    emoji: '🕶️' },
  { id: 'alien',   label: 'Alien',      emoji: '👽' },
];

/**
 * Processes each camera frame through a hidden canvas, applies a face-landmark-based
 * filter, and exposes the result as a captureStream() MediaStream that replaces the
 * raw camera track in WebRTC.
 *
 * MediaPipe FaceMesh provides 468 face landmarks; we use a subset for drawing overlays.
 */
@Injectable({ providedIn: 'root' })
export class FaceFilterService {

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private faceMesh: any;        // @mediapipe/face_mesh FaceMesh instance
  private camera: any;          // @mediapipe/camera_utils Camera instance
  private filteredStream: MediaStream | null = null;
  private rawStream: MediaStream | null = null;
  private currentLandmarks: any[] | null = null;
  private rafId = 0;

  private _activeFilter$ = new BehaviorSubject<FaceFilter>('none');
  public activeFilter$ = this._activeFilter$.asObservable();

  get activeFilter(): FaceFilter { return this._activeFilter$.getValue(); }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Initialises MediaPipe, wires up the canvas pipeline and returns a filtered
   * MediaStream that can be used as the WebRTC video source.
   */
  async start(rawStream: MediaStream): Promise<MediaStream> {
    this.rawStream = rawStream;

    // Create an offscreen canvas matching the video dimensions
    const track = rawStream.getVideoTracks()[0];
    const settings = track.getSettings();
    const w = settings.width  ?? 640;
    const h = settings.height ?? 480;

    this.canvas = document.createElement('canvas');
    this.canvas.width  = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d')!;

    await this.initFaceMesh(w, h);

    // The canvas stream is what gets sent over WebRTC
    this.filteredStream = this.canvas.captureStream(30);

    // Copy the audio tracks from the raw stream
    rawStream.getAudioTracks().forEach(t => this.filteredStream!.addTrack(t));

    return this.filteredStream;
  }

  setFilter(filter: FaceFilter): void {
    this._activeFilter$.next(filter);
  }

  stop(): void {
    this.camera?.stop();
    cancelAnimationFrame(this.rafId);
    this.faceMesh?.close();
    this.filteredStream = null;
    this.rawStream = null;
    this.currentLandmarks = null;
    this._activeFilter$.next('none');
  }

  // ─── MediaPipe setup ───────────────────────────────────────────────────────

  private async initFaceMesh(w: number, h: number): Promise<void> {
    // Dynamically import to avoid SSR/build issues with WASM modules
    const { FaceMesh } = await import('@mediapipe/face_mesh');
    const { Camera }   = await import('@mediapipe/camera_utils');

    this.faceMesh = new FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults((results: any) => {
      this.currentLandmarks = results.multiFaceLandmarks?.[0] ?? null;
      this.renderFrame(results.image, w, h);
    });

    // Create a hidden <video> element backed by the raw stream so Camera can drive it
    const videoEl = document.createElement('video');
    videoEl.srcObject = this.rawStream!;
    videoEl.muted = true;
    videoEl.width  = w;
    videoEl.height = h;

    this.camera = new Camera(videoEl, {
      onFrame: async () => {
        await this.faceMesh.send({ image: videoEl });
      },
      width: w,
      height: h,
    });

    await this.camera.start();
  }

  // ─── Frame rendering ───────────────────────────────────────────────────────

  private renderFrame(image: HTMLVideoElement | HTMLImageElement | ImageBitmap, w: number, h: number): void {
    const ctx  = this.ctx;
    const lm   = this.currentLandmarks;
    const filter = this._activeFilter$.getValue();

    // Always draw the base frame
    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (filter === 'none' || !lm) {
      ctx.drawImage(image, 0, 0, w, h);
      ctx.restore();
      return;
    }

    // ── Pixel / blur: apply CSS filter BEFORE drawing the image ───────────
    if (filter === 'blur') {
      ctx.filter = 'none';
      ctx.drawImage(image, 0, 0, w, h);
      this.applyRegionBlur(ctx, lm, w, h);
    } else if (filter === 'pixel') {
      ctx.filter = 'none';
      ctx.drawImage(image, 0, 0, w, h);
      this.applyRegionPixelate(ctx, lm, w, h);
    } else {
      // Draw frame normally then overlay the decoration
      ctx.drawImage(image, 0, 0, w, h);
      switch (filter) {
        case 'dog':     this.drawDog(ctx, lm, w, h);     break;
        case 'cat':     this.drawCat(ctx, lm, w, h);     break;
        case 'glasses': this.drawGlasses(ctx, lm, w, h); break;
        case 'alien':   this.drawAlien(ctx, lm, w, h);   break;
      }
    }

    ctx.restore();
  }

  // ─── Helpers: landmark → pixel coords ─────────────────────────────────────

  private pt(lm: any[], idx: number, w: number, h: number): [number, number] {
    return [lm[idx].x * w, lm[idx].y * h];
  }

  private faceBounds(lm: any[], w: number, h: number) {
    const xs = lm.map((p: any) => p.x * w);
    const ys = lm.map((p: any) => p.y * h);
    const x  = Math.min(...xs), y  = Math.min(...ys);
    const x2 = Math.max(...xs), y2 = Math.max(...ys);
    return { x, y, width: x2 - x, height: y2 - y, cx: (x + x2) / 2, cy: (y + y2) / 2 };
  }

  // ─── Blur ─────────────────────────────────────────────────────────────────

  private applyRegionBlur(ctx: CanvasRenderingContext2D, lm: any[], w: number, h: number): void {
    const b = this.faceBounds(lm, w, h);
    const pad = 20;

    // Extract the face region, downscale (cheap blur), redraw enlarged
    const fw = b.width + pad * 2, fh = b.height + pad * 2;
    const fx = b.x - pad, fy = b.y - pad;

    // Save face region into a tiny canvas, then draw it back scaled up
    const tmp = document.createElement('canvas');
    const scale = 10; // smaller = more blurry
    tmp.width  = Math.max(1, Math.round(fw / scale));
    tmp.height = Math.max(1, Math.round(fh / scale));
    tmp.getContext('2d')!.drawImage(ctx.canvas, fx, fy, fw, fh, 0, 0, tmp.width, tmp.height);

    // Clip to ellipse around face and paste the pixelated version back
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(b.cx, b.cy, b.width / 2 + pad, b.height / 2 + pad, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, fx, fy, fw, fh);
    ctx.restore();
  }

  // ─── Pixelate ─────────────────────────────────────────────────────────────

  private applyRegionPixelate(ctx: CanvasRenderingContext2D, lm: any[], w: number, h: number): void {
    const b = this.faceBounds(lm, w, h);
    const pad = 20;
    const pixelSize = 18;

    const fx = Math.max(0, b.x - pad);
    const fy = Math.max(0, b.y - pad);
    const fw = Math.min(w - fx, b.width + pad * 2);
    const fh = Math.min(h - fy, b.height + pad * 2);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(b.cx, b.cy, b.width / 2 + pad, b.height / 2 + pad, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;

    for (let px = fx; px < fx + fw; px += pixelSize) {
      for (let py = fy; py < fy + fh; py += pixelSize) {
        const pxW = Math.min(pixelSize, fx + fw - px);
        const pxH = Math.min(pixelSize, fy + fh - py);
        const tmp = document.createElement('canvas');
        tmp.width = 1; tmp.height = 1;
        tmp.getContext('2d')!.drawImage(ctx.canvas, px, py, pxW, pxH, 0, 0, 1, 1);
        const [r, g, b2, a] = tmp.getContext('2d')!.getImageData(0, 0, 1, 1).data;
        ctx.fillStyle = `rgba(${r},${g},${b2},${a / 255})`;
        ctx.fillRect(px, py, pxW, pxH);
      }
    }
    ctx.restore();
  }

  // ─── Dog ──────────────────────────────────────────────────────────────────

  private drawDog(ctx: CanvasRenderingContext2D, lm: any[], w: number, h: number): void {
    // Left ear: landmark 234 (left cheek outer), right ear: 454
    // Nose tip: 4,  mouth center: 13
    const [lEx, lEy] = this.pt(lm, 234, w, h);
    const [rEx, rEy] = this.pt(lm, 454, w, h);
    const [nx,  ny]  = this.pt(lm, 4,   w, h);
    const [,    ty]  = this.pt(lm, 10,  w, h); // forehead top
    const earSize = (rEx - lEx) * 0.38;

    // Floppy ears (brown rounded rectangles drooping from temples)
    ctx.save();
    const drawEar = (cx: number, cy: number, flip: boolean) => {
      ctx.save();
      ctx.translate(cx, cy - earSize * 0.3);
      if (flip) ctx.scale(-1, 1);
      ctx.beginPath();
      ctx.ellipse(0, 0, earSize * 0.45, earSize * 0.75, Math.PI * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#8B4513';
      ctx.fill();
      // Inner lighter area
      ctx.beginPath();
      ctx.ellipse(earSize * 0.05, earSize * 0.1, earSize * 0.22, earSize * 0.45, Math.PI * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#D2691E';
      ctx.fill();
      ctx.restore();
    };
    drawEar(lEx, lEy, false);
    drawEar(rEx, rEy, true);

    // Dog nose patch (dark ellipse at nose tip)
    ctx.beginPath();
    ctx.ellipse(nx, ny, 18, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();

    // Nostrils
    [-7, 7].forEach(dx => {
      ctx.beginPath();
      ctx.ellipse(nx + dx, ny + 3, 4, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();
    });

    ctx.restore();
  }

  // ─── Cat ──────────────────────────────────────────────────────────────────

  private drawCat(ctx: CanvasRenderingContext2D, lm: any[], w: number, h: number): void {
    const [lEx, lEy] = this.pt(lm, 234, w, h);
    const [rEx, rEy] = this.pt(lm, 454, w, h);
    const [nx,  ny]  = this.pt(lm, 4,   w, h);
    const [,    ty]  = this.pt(lm, 10,  w, h);
    const earSize = (rEx - lEx) * 0.25;

    // Pointy cat ears (triangles above forehead)
    ctx.save();
    const drawEar = (cx: number, tipX: number) => {
      const baseY = ty - earSize * 0.2;
      const tipY  = ty - earSize * 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - earSize * 0.6, baseY);
      ctx.lineTo(cx + earSize * 0.6, baseY);
      ctx.lineTo(tipX, tipY);
      ctx.closePath();
      ctx.fillStyle = '#FF8C9E';
      ctx.fill();
      // Inner pink
      ctx.beginPath();
      ctx.moveTo(cx - earSize * 0.3, baseY - 4);
      ctx.lineTo(cx + earSize * 0.3, baseY - 4);
      ctx.lineTo(tipX, tipY + earSize * 0.3);
      ctx.closePath();
      ctx.fillStyle = '#FF4D7D';
      ctx.fill();
    };
    drawEar(lEx + earSize * 0.3, lEx - earSize * 0.1);
    drawEar(rEx - earSize * 0.3, rEx + earSize * 0.1);

    // Cat nose (small pink triangle)
    ctx.beginPath();
    ctx.moveTo(nx, ny - 5);
    ctx.lineTo(nx - 8, ny + 5);
    ctx.lineTo(nx + 8, ny + 5);
    ctx.closePath();
    ctx.fillStyle = '#FF69B4';
    ctx.fill();

    // Whiskers
    const [lCx, lCy] = this.pt(lm, 205, w, h);
    const [rCx, rCy] = this.pt(lm, 425, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    [[-30, -5], [-30, 3], [-30, 11]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(lCx, lCy + dy); ctx.lineTo(lCx + dx, lCy + dy - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rCx, rCy + dy); ctx.lineTo(rCx - dx, rCy + dy - 4); ctx.stroke();
    });

    ctx.restore();
  }

  // ─── Glasses ──────────────────────────────────────────────────────────────

  private drawGlasses(ctx: CanvasRenderingContext2D, lm: any[], w: number, h: number): void {
    // Left eye center: avg of 33, 133 | Right eye: 362, 263
    const lx = (lm[33].x + lm[133].x) / 2 * w;
    const ly = (lm[33].y + lm[133].y) / 2 * h;
    const rx = (lm[362].x + lm[263].x) / 2 * w;
    const ry = (lm[362].y + lm[263].y) / 2 * h;
    const eyeW = Math.abs(lm[133].x - lm[33].x) * w * 1.35;
    const eyeH = eyeW * 0.7;

    ctx.save();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0, 0, 80, 0.35)';

    // Left lens
    ctx.beginPath();
    ctx.ellipse(lx, ly, eyeW / 2, eyeH / 2, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Right lens
    ctx.beginPath();
    ctx.ellipse(rx, ry, eyeW / 2, eyeH / 2, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Bridge between lenses
    ctx.beginPath();
    ctx.moveTo(lx + eyeW / 2, ly);
    ctx.lineTo(rx - eyeW / 2, ry);
    ctx.stroke();

    // Temples (arms going out)
    const [lTx, lTy] = this.pt(lm, 234, w, h);
    const [rTx, rTy] = this.pt(lm, 454, w, h);
    ctx.beginPath(); ctx.moveTo(lx - eyeW / 2, ly); ctx.lineTo(lTx, lTy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx + eyeW / 2, ry); ctx.lineTo(rTx, rTy); ctx.stroke();

    ctx.restore();
  }

  // ─── Alien ────────────────────────────────────────────────────────────────

  private drawAlien(ctx: CanvasRenderingContext2D, lm: any[], w: number, h: number): void {
    const b = this.faceBounds(lm, w, h);

    ctx.save();
    // Green tint overlay on face region
    ctx.beginPath();
    ctx.ellipse(b.cx, b.cy, b.width / 2 + 10, b.height / 2 + 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(50, 205, 50, 0.30)';
    ctx.fill();

    // Big oval eyes overlay (dark with green glow)
    const lx = (lm[33].x + lm[133].x) / 2 * w;
    const ly = (lm[33].y + lm[133].y) / 2 * h;
    const rx = (lm[362].x + lm[263].x) / 2 * w;
    const ry = (lm[362].y + lm[263].y) / 2 * h;
    const ew = Math.abs(lm[133].x - lm[33].x) * w * 1.1;

    [{ cx: lx, cy: ly }, { cx: rx, cy: ry }].forEach(({ cx, cy }) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, ew / 2, ew * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fill();
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.restore();
  }
}
