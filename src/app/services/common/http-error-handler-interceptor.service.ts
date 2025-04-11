import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, throwError, EMPTY } from 'rxjs'; // throwError ve EMPTY import edildi
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base/base.component';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerInterceptorService implements HttpInterceptor {

  constructor(
    private toastrService: CustomToastrService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private tokenService: TokenService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError((error: HttpErrorResponse) => {
      this.spinner.hide(SpinnerType.BallSpinClockwise);

      // --- Login Endpoint Özel Kontrolü ---
      if (error.status === HttpStatusCode.Unauthorized && req.url.includes('/api/auth/login')) {
        // Login hatası (401), AuthService'in işlemesi için hatayı olduğu gibi fırlat.
        return throwError(() => error); // Bu doğruydu
      }
      // --- Login Kontrolü Sonu ---

      switch (error.status) {
        case HttpStatusCode.Unauthorized: // Login dışındaki 401'ler
          // Token yenileme denemesi asenkron çalışır
          this.tokenService.refreshToken().then(success => {
            if (!success) {
              this.showUnauthorizedToast();
              this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
            }
            // Başarılı olsa da olmasa da, orijinal istek başarısız oldu ve ele alınmaya çalışıldı.
            // Component'in bu hatayı tekrar ele almasına gerek yok gibi duruyor.
          }).catch(refreshError => {
             console.error("Token refresh attempt failed:", refreshError);
             this.showUnauthorizedToast();
             this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          });

          // Hata ele alınmaya çalışıldıktan sonra, hata akışını durdurmak yerine
          // hatayı yine de fırlatmak daha güvenli olabilir. Böylece eğer component
          // özel bir 401 işlemi yapıyorsa (nadiren gerekir) yapabilir veya global
          // bir error handler yakalayabilir.
          // **DÜZELTME:** `of(error)` yerine `throwError(() => error)` kullanıyoruz.
          return throwError(() => error);
          // Alternatif: Eğer hatayı tamamen yutup component'e hiç bildirmek istemiyorsanız:
          // return EMPTY; // Akışı sonlandırır.

        case HttpStatusCode.InternalServerError:
          this.toastrService.message("Sunucuya ulaşılamıyor.", "Sunucu Hatası!", {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.BottomFullWidth
          });
          // Hata fırlatılmalı ki component haberdar olsun (veya global handler)
          return throwError(() => error); // return ekledik

        case HttpStatusCode.BadRequest:
          if (!req.url.includes('/api/auth/login')) {
             this.toastrService.message("Geçersiz istek.", "Hatalı İşlem!", {
               toastrMessageType: ToastrMessageType.Warning,
               position: ToastrPosition.BottomFullWidth
             });
          }
          // Hata fırlatılmalı
          return throwError(() => error); // return ekledik

        case HttpStatusCode.NotFound:
          this.toastrService.message("Sayfa bulunamadı.", "Sayfa Bulunamadı!", {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopCenter
          });
           // Hata fırlatılmalı
          return throwError(() => error); // return ekledik

        default:
           if (!req.url.includes('/api/auth/login')) {
             console.error("Unhandled HTTP Error:", error);
             /* this.toastrService.message("Beklenmeyen bir hata oluştu.", "Hata!", {
                toastrMessageType: ToastrMessageType.Warning,
                position: ToastrPosition.BottomFullWidth
             }); */
           }
           // Bilinmeyen hatalar da fırlatılmalı
           return throwError(() => error); // return ekledik
      }

      // Switch içindeki her case'den bir Observable dönülmeli (throwError veya EMPTY gibi)
      // Bu satıra normalde ulaşılmamalı ama yine de bir fallback ekleyelim.
      // return throwError(() => error); // Zaten default case'de var.
    }));
  }

  private showUnauthorizedToast() {
    const url = this.router.url;
    if (url == "/products") {
      this.toastrService.message("Sepete ürün eklemek için lütfen giriş yapınız.", "Giriş Gerekli", {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
    } else {
      this.toastrService.message("Bu işlemi yapmak için yetkiniz bulunmamaktadır.", "Yetkisiz İşlem!", {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.BottomFullWidth
      });
    }
  }
}