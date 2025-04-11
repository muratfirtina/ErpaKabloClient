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
              'Your session has been terminated from another device', // Oturumunuz başka bir cihazdan sonlandırıldı
              'Session terminated', // Oturum Sonlandırıldı
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
              'Your session is over, log in again', // Oturumunuz sona erdi, tekrar giriş yapın
              'The session time is full', // Oturum Süresi Doldu
              {
                toastrMessageType: ToastrMessageType.Warning,
                position: ToastrPosition.TopRight
              }
            );
            shouldLogout = true; // Bu durumda da logout yap
          }
          // Eğer 403 ise ve özel revoked mesajı yoksa, şimdilik sadece hata fırlatılır.
          // HttpErrorHandlerInterceptor 403 için genel bir mesaj gösterebilir.

          // Eğer logout yapılması gerekiyorsa
          if (shouldLogout) {
            // Oturum bilgilerini temizle ve kullanıcıyı login sayfasına yönlendir
            this.authService.logout(() => {
              // Yönlendirme callback içinde yapılarak logout işleminin bitmesi beklenebilir
              // (logout asenkron ise önemlidir, değilse dışarıda da olabilir)
              this.router.navigate(['/login'], {
                // Mevcut sayfayı query param olarak ekleyebiliriz ki
                // kullanıcı giriş yaptıktan sonra geri dönebilsin.
                queryParams: { returnUrl: this.router.url }
              });
            });
          }
        }
        // --- MEVCUT MANTIK SONU ---

        // Her durumda hatayı fırlat ki diğer interceptor'lar veya error handler'lar yakalayabilsin.
        return throwError(() => error);
      })
    );
  }
}