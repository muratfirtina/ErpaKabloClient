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
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';

@Injectable()
export class TokenValidatorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private toastrService: CustomToastrService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // --- YENİ KONTROL ---
        // Eğer hata 401 ise VE istek login endpoint'ine yapıldıysa,
        // bu interceptor'da HİÇBİR ŞEY YAPMA. Hata diğer interceptor'a
        // ve component'e iletilecek ve orada ele alınacak.
        if (error.status === 401 && request.url.includes('/api/auth/login')) {
          return throwError(() => error); // Hatayı olduğu gibi fırlat
        }
        // --- YENİ KONTROL SONU ---

        // --- MEVCUT MANTIK (Login dışı 401/403'ler için çalışacak) ---
        if (error.status === 401 || error.status === 403) {
          let shouldLogout = false; // Logout yapılıp yapılmayacağını belirle

          // Özel token revoked mesajı kontrolü
          if (error.error?.error === "Token has been revoked") {
            this.toastrService.message(
              'Your session has been terminated from another device.',
              'Session Terminated',
              {
                toastrMessageType: ToastrMessageType.Warning,
                position: ToastrPosition.TopRight
              }
            );
            shouldLogout = true; // Bu durumda logout yap
          }
          // SADECE 401 ise (ve login URL'si değilse ve revoked değilse)
          else if (error.status === 401) {
            this.toastrService.message(
              'Your session has expired. Please log in again.',
              'Your session has expired',
              {
                toastrMessageType: ToastrMessageType.Warning,
                position: ToastrPosition.TopRight
              }
            );
            shouldLogout = true; // Bu durumda da logout yap
          }

          // Eğer logout yapılması gerekiyorsa
          if (shouldLogout) {
            // Oturum bilgilerini temizle ve kullanıcıyı login sayfasına yönlendir
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: this.router.url }
            });
          }
        }
        // Her durumda hatayı fırlat
        return throwError(() => error);
      })
    );
  }

  private showUnauthorizedToast() {
    const url = this.router.url;
    if (url == "/products") {
      this.toastrService.message("Please login to add a product to the cart.", "Login required", {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
    } else {
      this.toastrService.message("You do not have authority to do this.", "Unauthorized transaction!", {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomFullWidth
      });
    }
  }
}