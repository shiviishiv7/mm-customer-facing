import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface VRoidCharacter {
  id: string;
  name: string;
  description: string;
  character_models: VRoidModel[];
  icon: { sq170: string };
}

export interface VRoidModel {
  id: string;
  version: number;
  download_url?: string;
}

const STORAGE_KEY = 'vroid_access_token';
const BASE        = 'https://hub.vroid.com';
const API_VERSION = '11';

@Injectable({ providedIn: 'root' })
export class VRoidOAuthService {

  private _token$    = new BehaviorSubject<string | null>(localStorage.getItem(STORAGE_KEY));
  private _loading$  = new BehaviorSubject(false);

  public token$    = this._token$.asObservable();
  public loading$  = this._loading$.asObservable();
  public isLoggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem(STORAGE_KEY));

  constructor(private http: HttpClient) {}

  // ── OAuth PKCE login ──────────────────────────────────────────────────────

  async login(): Promise<void> {
    const verifier  = this.generateVerifier();
    const challenge = await this.generateChallenge(verifier);
    const state     = this.randomString(16);

    sessionStorage.setItem('vroid_verifier', verifier);
    sessionStorage.setItem('vroid_state',    state);

    const params = new URLSearchParams({
      response_type:         'code',
      client_id:             environment.vroid.clientId,
      redirect_uri:          environment.vroid.redirectUri,
      scope:                 environment.vroid.scope,
      state,
      code_challenge:        challenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${BASE}/oauth/authorize?${params}`;
  }

  /** Called by VRoidCallbackComponent after redirect */
  async handleCallback(code: string, state: string): Promise<void> {
    const savedState   = sessionStorage.getItem('vroid_state');
    const codeVerifier = sessionStorage.getItem('vroid_verifier');

    if (state !== savedState) throw new Error('OAuth state mismatch');

    this._loading$.next(true);
    try {
      const body = new HttpParams()
        .set('grant_type',    'authorization_code')
        .set('code',          code)
        .set('redirect_uri',  environment.vroid.redirectUri)
        .set('client_id',     environment.vroid.clientId)
        .set('client_secret', environment.vroid.clientSecret)
        .set('code_verifier', codeVerifier ?? '');

      const res: any = await firstValueFrom(
        this.http.post(`${BASE}/oauth/token`, body.toString(), {
          headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
        })
      );

      this.saveToken(res.access_token);
    } finally {
      this._loading$.next(false);
      sessionStorage.removeItem('vroid_verifier');
      sessionStorage.removeItem('vroid_state');
    }
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._token$.next(null);
    this.isLoggedIn$.next(false);
  }

  // ── VRoid Hub API ─────────────────────────────────────────────────────────

  /** Fetch the authenticated user's own characters */
  async getMyCharacters(): Promise<VRoidCharacter[]> {
    return this.apiGet<VRoidCharacter[]>('/api/v1/account/characters');
  }

  /** Fetch characters the user has hearted (liked) */
  async getHeartedCharacters(): Promise<VRoidCharacter[]> {
    return this.apiGet<VRoidCharacter[]>('/api/v1/account/heart/characters');
  }

  /** Get the latest model download info for a character */
  async getLatestModel(characterId: string): Promise<VRoidModel> {
    const models = await this.apiGet<VRoidModel[]>(
      `/api/v1/characters/${characterId}/character_models`
    );
    return models[0]; // latest first
  }

  /** Get a short-lived download URL for a specific model */
  async getDownloadUrl(modelId: string): Promise<string> {
    const res = await this.apiGet<{ url: string }>(
      `/api/v1/character_models/${modelId}/download`
    );
    return res.url;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async apiGet<T>(path: string): Promise<T> {
    const token = this._token$.getValue();
    if (!token) throw new Error('Not logged in to VRoid Hub');

    const res: any = await firstValueFrom(
      this.http.get(`${BASE}${path}`, {
        headers: new HttpHeaders({
          Authorization:  `Bearer ${token}`,
          'X-Api-Version': API_VERSION,
        })
      })
    );
    // VRoid API wraps responses in { data: ... }
    return (res.data ?? res) as T;
  }

  private saveToken(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
    this._token$.next(token);
    this.isLoggedIn$.next(true);
  }

  // ── PKCE helpers ──────────────────────────────────────────────────────────

  private generateVerifier(): string {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private async generateChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private randomString(len: number): string {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }
}
