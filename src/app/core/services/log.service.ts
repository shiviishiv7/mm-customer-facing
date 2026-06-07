import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  log(message: string, data?: any): void {
    console.log(`[LOG]: ${message}`, data);
  }


  logError(message: string, error: any) {
    console.log(`[LOG]: ${message}`, error);
  }
}
