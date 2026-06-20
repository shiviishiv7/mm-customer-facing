import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM, VRMUtils, VRMExpressionPresetName } from '@pixiv/three-vrm';
import { AVATAR_PRESETS, AvatarPreset } from './avatar-presets';

@Injectable({ providedIn: 'root' })
export class AvatarService {

  // ── Public state ───────────────────────────────────────────────────────────
  private _selectedAvatar$ = new BehaviorSubject<AvatarPreset | null>(null);
  private _loading$        = new BehaviorSubject<boolean>(false);
  private _error$          = new BehaviorSubject<string | null>(null);

  public selectedAvatar$ = this._selectedAvatar$.asObservable();
  public loading$        = this._loading$.asObservable();
  public error$          = this._error$.asObservable();
  public presets         = AVATAR_PRESETS;

  // ── Three.js / VRM internals ───────────────────────────────────────────────
  private canvas!: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private vrm: VRM | null = null;
  private rafId = 0;
  private rawVideoPlane: THREE.Mesh | null = null;  // fullscreen plane for no-filter mode

  // ── MediaPipe internals ────────────────────────────────────────────────────
  private faceMesh: any;
  private mpCamera: any;
  private rawStream: MediaStream | null = null;
  private filteredStream: MediaStream | null = null;

  // ── Last face rig (updated by MediaPipe callback) ──────────────────────────
  private faceRig: any = null;
  private rawVideoEl: HTMLVideoElement | null = null; // used for "no avatar" passthrough
  private rawMode = false;                            // true = draw raw camera, skip Three.js

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start the avatar pipeline.
   * Returns a MediaStream backed by the Three.js canvas — ready for WebRTC.
   */
  async start(rawStream: MediaStream): Promise<MediaStream> {
    this.rawStream = rawStream;

    const track    = rawStream.getVideoTracks()[0].getSettings();
    const w        = track.width  ?? 640;
    const h        = track.height ?? 480;

    this.setupThreeJS(w, h);
    await this.initMediaPipe(w, h);

    // Default to first preset if nothing is selected yet
    if (!this._selectedAvatar$.getValue()) {
      await this.selectAvatar(AVATAR_PRESETS[0]);
    }

    this.filteredStream = this.canvas.captureStream(30);
    rawStream.getAudioTracks().forEach(t => this.filteredStream!.addTrack(t));

    return this.filteredStream;
  }

  /** Switch to raw camera — no VRM, no Three.js, just the real video feed. */
  useNoAvatar(): void {
    this.rawMode = true;
    this._selectedAvatar$.next({ id: 'none', name: 'No filter', emoji: '📷', url: '' });
  }

  async selectAvatar(preset: AvatarPreset): Promise<void> {
    this.rawMode = false;          // leave raw-camera mode when a VRM is chosen
    this._loading$.next(true);
    this._error$.next(null);
    try {
      await this.loadVRM(preset.url);
      this._selectedAvatar$.next(preset);
    } catch (err: any) {
      this._error$.next(`Could not load avatar: ${err?.message ?? err}`);
      console.error('[Avatar] Load failed:', err);
    } finally {
      this._loading$.next(false);
    }
  }

  /** Load a custom VRM from a user-provided File object (e.g. from VRoid Hub download) */
  async loadFromFile(file: File): Promise<void> {
    this._loading$.next(true);
    this._error$.next(null);
    try {
      const url = URL.createObjectURL(file);
      await this.loadVRM(url);
      this._selectedAvatar$.next({ id: 'custom', name: file.name, emoji: '🧑', url });
    } catch (err: any) {
      this._error$.next(`Could not load VRM: ${err?.message ?? err}`);
    } finally {
      this._loading$.next(false);
    }
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.mpCamera?.stop();
    this.faceMesh?.close();
    this.renderer?.dispose();
    this.vrm = null;
    this.rawStream = null;
    this.filteredStream = null;
    this.faceRig = null;
    this.rawVideoEl = null;
    this.rawMode = false;
    if (this.rawVideoPlane) {
      this.scene?.remove(this.rawVideoPlane);
      this.rawVideoPlane = null;
    }
    this._selectedAvatar$.next(null);
  }

  // ── Three.js setup ─────────────────────────────────────────────────────────

  private setupThreeJS(w: number, h: number): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width  = w;
    this.canvas.height = h;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: true,
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e); // dark background

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(1, 2, 3);
    this.scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
    fillLight.position.set(-2, 0, -1);
    this.scene.add(fillLight);

    // Camera — framed for a bust/portrait view
    this.camera = new THREE.PerspectiveCamera(30, w / h, 0.01, 50);
    this.camera.position.set(0, 1.45, 1.6); // face-level, ~1.5m back
    this.camera.lookAt(0, 1.45, 0);

    this.renderLoop();
  }

  private renderLoop(): void {
    this.rafId = requestAnimationFrame(() => this.renderLoop());
    const delta = this.clock.getDelta();

    // Toggle between raw video plane and VRM
    if (this.rawVideoPlane) this.rawVideoPlane.visible = this.rawMode;
    if (this.vrm)           this.vrm.scene.visible     = !this.rawMode;

    if (!this.rawMode && this.vrm) {
      this.applyFaceRig();
      this.vrm.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  // ── VRM loading ────────────────────────────────────────────────────────────

  private async loadVRM(url: string): Promise<void> {
    // Remove previous model
    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
      VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }

    const loader = new GLTFLoader();
    loader.register(parser => new VRMLoaderPlugin(parser));

    const gltf = await loader.loadAsync(url);
    const vrm  = gltf.userData.vrm as VRM;

    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);

    // Face the camera (VRM models face +Z by default)
    VRMUtils.rotateVRM0(vrm);

    this.vrm = vrm;
    this.scene.add(vrm.scene);

    // Reset to neutral expression
    vrm.expressionManager?.setValue(VRMExpressionPresetName.Neutral, 1);
    console.log('[Avatar] VRM loaded:', url);
  }

  // ── Face rig application ───────────────────────────────────────────────────

  private applyFaceRig(): void {
    if (!this.vrm || !this.faceRig) return;

    const rig = this.faceRig;
    const humanoid = this.vrm.humanoid;
    const expr     = this.vrm.expressionManager;

    // ── Head rotation ────────────────────────────────────────────────────────
    const head = humanoid?.getNormalizedBoneNode('head');
    if (head && rig.head) {
      head.rotation.set(
        THREE.MathUtils.lerp(head.rotation.x, rig.head.x * 0.8, 0.3),
        THREE.MathUtils.lerp(head.rotation.y, rig.head.y * 0.8, 0.3),
        THREE.MathUtils.lerp(head.rotation.z, rig.head.z * 0.8, 0.3),
        'XYZ'
      );
    }

    // ── Eye look direction ───────────────────────────────────────────────────
    if (rig.pupil) {
      expr?.setValue(VRMExpressionPresetName.LookLeft,  Math.max(0,  rig.pupil.x) * 0.6);
      expr?.setValue(VRMExpressionPresetName.LookRight, Math.max(0, -rig.pupil.x) * 0.6);
      expr?.setValue(VRMExpressionPresetName.LookUp,    Math.max(0, -rig.pupil.y) * 0.6);
      expr?.setValue(VRMExpressionPresetName.LookDown,  Math.max(0,  rig.pupil.y) * 0.6);
    }

    // ── Eye blink ────────────────────────────────────────────────────────────
    if (rig.eye) {
      const blinkL = 1 - Math.min(1, Math.max(0, rig.eye.l));
      const blinkR = 1 - Math.min(1, Math.max(0, rig.eye.r));
      expr?.setValue(VRMExpressionPresetName.BlinkLeft,  blinkL);
      expr?.setValue(VRMExpressionPresetName.BlinkRight, blinkR);
    }

    // ── Mouth shapes (lip sync) ──────────────────────────────────────────────
    if (rig.mouth?.shape) {
      const s = rig.mouth.shape;
      expr?.setValue(VRMExpressionPresetName.Aa, clamp(s.A ?? 0));
      expr?.setValue(VRMExpressionPresetName.Ih, clamp(s.I ?? 0));
      expr?.setValue(VRMExpressionPresetName.Ou, clamp(s.U ?? 0));
      expr?.setValue(VRMExpressionPresetName.Ee, clamp(s.E ?? 0));
      expr?.setValue(VRMExpressionPresetName.Oh, clamp(s.O ?? 0));
    }
  }

  // ── MediaPipe FaceMesh ────────────────────────────────────────────────────

  private async initMediaPipe(w: number, h: number): Promise<void> {
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
    this.faceMesh.onResults((results: any) => this.onFaceResults(results, w, h));

    const videoEl = document.createElement('video');
    videoEl.srcObject = this.rawStream!;
    videoEl.muted = true;
    videoEl.width = w; videoEl.height = h;
    this.rawVideoEl = videoEl;

    this.mpCamera = new Camera(videoEl, {
      onFrame: async () => this.faceMesh.send({ image: videoEl }),
      width: w, height: h,
    });
    await this.mpCamera.start();

    // Build the fullscreen plane used by "No filter" mode
    this.setupRawVideoPlane(videoEl, w, h);
  }

  /**
   * Creates a THREE.Mesh that fills the camera frustum and shows the raw
   * camera video via a VideoTexture. Hidden by default; shown in rawMode.
   */
  private setupRawVideoPlane(videoEl: HTMLVideoElement, w: number, h: number): void {
    const fovRad  = (30 * Math.PI) / 180; // must match camera FOV
    const dist    = this.camera.position.z - 0;  // distance from cam to plane z=0
    const planeH  = 2 * Math.tan(fovRad / 2) * dist;
    const planeW  = planeH * (w / h);

    const texture = new THREE.VideoTexture(videoEl);
    texture.colorSpace = THREE.SRGBColorSpace;
    // Mirror horizontally so it feels like a mirror (same as local video element)
    texture.repeat.set(-1, 1);
    texture.offset.set(1, 0);

    const geo = new THREE.PlaneGeometry(planeW, planeH);
    const mat = new THREE.MeshBasicMaterial({ map: texture });
    this.rawVideoPlane = new THREE.Mesh(geo, mat);
    // Place at camera look-at point (y=1.45, z=0)
    this.rawVideoPlane.position.set(0, 1.45, 0);
    this.rawVideoPlane.visible = false; // hidden until user picks "No filter"
    this.scene.add(this.rawVideoPlane);
  }

  private onFaceResults(results: any, w: number, h: number): void {
    const landmarks = results.multiFaceLandmarks?.[0];
    if (!landmarks) return;

    // Dynamically import kalidokit UMD to avoid ESM directory-import bug
    import('kalidokit/dist/kalidokit.umd.js' as any).then((kit: any) => {
      const Kalidokit = kit.default ?? kit;
      this.faceRig = Kalidokit.Face.solve(landmarks, {
        runtime: 'mediapipe',
        video: { width: w, height: h },
        imageSize: { width: w, height: h },
        smoothBlink: true,
        blinkSettings: [0.25, 0.75],
      });
    });
  }
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}
