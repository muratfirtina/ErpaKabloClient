// src/app/interceptors/tokenValidator.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';

@Injectable()
export class TokenValidatorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastrService: CustomToastrService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Özel token revoked mesajı kontrolü
          if (error.error?.error === "Token has been revoked") {
            
            // Kullanıcıya bildir
            this.toastrService.message(
              'Your session has been terminated from another device',
              'Session terminated', 
              {
                toastrMessageType: ToastrMessageType.Warning,
                position: ToastrPosition.TopRight
              }
            );
          } else if (error.status === 401) {
            // Standart yetkilendirme hatası
            this.toastrService.message(
              'Your session is over, log in again',
              'The session time is full',
              {
                toastrMessageType: ToastrMessageType.Warning,
                position: ToastrPosition.TopRight
              }
            );
          }
          
          // Oturum bilgilerini temizle
          this.authService.logout(() => {
            this.router.navigate(['/login']);
          });
        }
        
        return throwError(() => error);
      })
    );
  }
}