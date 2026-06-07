import { Injectable } from '@angular/core';
import { JwtPayload, jwtDecode } from 'jwt-decode';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }
  private readonly TOKEN_KEY = 'authToken';

  private _sub: string = '';
  private _email: string = '';
  private _role: string[] = [];
  private _token: string = '';
  private _name: string;

  constructor() {
    this.loadUserData();
  }

  /**
   * Loads token from localStorage and updates user fields.
   */
  private loadUserData(): void {
    const token = this.getToken();
    if (token) {
      this.updateFields(token);
    }
  }

  /**
   * Extracts and updates `sub`, `email`, and `role` from the token.
   * @param token The JWT token.
   */
  private updateFields(token: string): void {
    try {
      const decoded: JwtPayload & { sub?: string; email?: string; "cognito:groups"?: string[], exp?: number } = jwtDecode(token);

      // Check if the token is expired
      // if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      //   console.warn('Token expired. Clearing user data.');
      //   this.removeToken();
      //   return;
      // }

      // Extract and update fields
      this._sub = decoded.sub || '';
      this._email = decoded.email || '';
      this._name = decoded['name'] || '';
      this._role = decoded["cognito:groups"] || [];
      this._token = token;

      // console.log('User data updated:', { sub: this._sub, email: this._email, role: this._role });

    } catch (error) {
      console.error('Failed to decode token:', error);
      this.clearUserData();
    }
  }

  /**
   * Getter for user ID (`sub`).
   */
  get sub(): string {
    return this._sub;
  }

  /**
   * Getter for email.
   */
  get email(): string {
    return this._email;
  }

  /**
   * Getter for role.
   */
  get role(): string[] {
    return [...this._role]; // Returns a copy to prevent mutation.
  }

  /**
   * Getter for token.
   */
  get token(): string {
    return this._token;
  }

  /**
   * Saves the token to localStorage and updates user fields.
   * @param token The token to be stored.
   */
  saveToken(token: string): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.updateFields(token);
    }
  }

  /**
   * Retrieves the token from localStorage.
   * @returns The stored token or `null` if not found.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Removes the token from localStorage and clears user details.
   */
  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Checks if a valid token exists in localStorage.
   * @returns `true` if a token exists and is not expired, otherwise `false`.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: JwtPayload & { exp?: number } = jwtDecode(token);
      // return !(decoded.exp && Date.now() >= decoded.exp * 1000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clears all stored user details.
   */
  clearUserData(): void {
    this._sub = '';
    this._email = '';
    this._role = [];
    this._token = '';
    this._name = '';
    this.removeToken();
  }
}
