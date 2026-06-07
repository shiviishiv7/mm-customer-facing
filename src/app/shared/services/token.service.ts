import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor() { }

  // Save an item to local storage
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  // Retrieve an item from local storage
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  // Remove an item from local storage
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all items from local storage
  clear(): void {
    localStorage.clear();
  }

  // Save a token to local storage
  setToken(token: string): void {
    this.setItem('authToken', token);
  }

  // Retrieve the token from local storage
  getToken(): string | null {
    return this.getItem('authToken');
  }

  // Remove the token from local storage
  removeToken(): void {
    this.removeItem('authToken');
  }

  // Check if a token exists in local storage
  hasToken(): boolean {
    return this.getToken() !== null;
  }

  // Save a JSON object to local storage
  setObject(key: string, value: object): void {
    this.setItem(key, JSON.stringify(value));
  }

  // Retrieve a JSON object from local storage
  getObject<T>(key: string): T | null {
    const item = this.getItem(key);
    return item ? JSON.parse(item) as T : null;
  }

}
