import {inject, Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpHandlerFn, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {delay, Observable} from 'rxjs';
import {CommunicationBusService} from '@shared/services/communication-bus.service';
import {AuthService} from '../services/auth.service';


export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Inject the current `AuthService` and use it to get an authentication token:
  const auth = inject(AuthService)
  const originSource = "CustomerFacing"
  const token = auth.getToken();

  const newReq = req.clone({
    headers: req.headers
      .append('OriginSource', originSource)
      .append('Authorization', `${token}`),
  });
  return next(newReq).pipe(
    delay(1000) // Introduces a 1-second delay before the response is emitted
  );
}
