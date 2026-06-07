import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() {
  }

  extractDomainName(): string {
    try {

      const origin = window.location.origin;
      console.log("origin", origin);
      // Use the URL API to parse the URL
      const hostname = new URL(origin).hostname;
      // Split the hostname by '.' and take the last two or three segments
      const parts = hostname.split(".");
      const rootDomain = parts.slice(-3).join("."); // Adjust based on your TLD (e.g., '.in.net' has 2 levels)
      return rootDomain;
    } catch (error) {
      // Handle invalid URLs
      console.error('Invalid URL:', error);
      return '';
    }
  }

}
