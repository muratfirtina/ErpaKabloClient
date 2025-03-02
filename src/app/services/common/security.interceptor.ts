import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
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
    return next.handle(req).pipe(catchError(error => {
      switch (error.status) {
        case HttpStatusCode.Unauthorized:
          // Token yenileme işlemini TokenService ile yap
          this.tokenService.refreshToken().then(success => {
            if (!success) {
              const url = this.router.url;
              if (url == "/products") {
                this.toastrService.message("Sepete ürün eklemek için oturum açınız.", "Oturum açınız!", {
                  toastrMessageType: ToastrMessageType.Warning,
                  position: ToastrPosition.TopRight
                });
              } else {
                this.toastrService.message("Bu işlemi yapmaya yetkiniz yok.", "Yetkisiz işlem!", {
                  toastrMessageType: ToastrMessageType.Warning,
                  position: ToastrPosition.BottomFullWidth
                });
              }
              
              // Oturumun süresi dolmuşsa login sayfasına yönlendir
              this.router.navigate(['/login'], { 
                queryParams: { returnUrl: this.router.url }
              });
            }
          });
          break;
        case HttpStatusCode.InternalServerError:
          this.toastrService.message("Sunucu ulaşılamaz durumda","Sunucu Hatası", {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.BottomFullWidth
          });
          break;
        case HttpStatusCode.BadRequest:
          this.toastrService.message("Geçersiz istek.", "Hatalı İşlem!", {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.BottomFullWidth
          });
          break;
        case HttpStatusCode.NotFound:
          this.toastrService.message("Sayfa bulunamadı.", "Sayfa bulunamadı!", {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopCenter
          });
          break;
        default:
          this.toastrService.message("Beklenmeyen bir hata oluştu.", "Hata!", {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.BottomFullWidth
          });
          break;
      }
      this.spinner.hide(SpinnerType.BallSpinClockwise);
      return of(error);
    }));
  }

  // Hata işleme yardımcı metodu
  handleError(error: any, customMessage?: string): void {
    let errorMessage = customMessage || 'Bir hata oluştu';
    
    console.error('Hata detayları:', error);
    
    // HTTP hata yanıtlarını ele al
    if (error.error) {
      // Backend'den gelen hata mesajı
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
      // Daha karmaşık hata nesnesi
      else if (error.error.message) {
        errorMessage = error.error.message;
      }
      // Validation hataları
      else if (error.error.errors) {
        const validationErrors = Object.values(error.error.errors).join(', ');
        errorMessage = `Doğrulama hatası: ${validationErrors}`;
      }
    }
    
    // HTTP durum koduna göre kullanıcı dostu mesajlar
    if (error.status === 400) {
      errorMessage = customMessage || 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
    } else if (error.status === 401) {
      errorMessage = 'Kimlik doğrulama gerekli. Lütfen giriş yapın.';
      // Oturumun süresi dolmuş olabilir, login sayfasına yönlendir
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url }
      });
    } else if (error.status === 403) {
      errorMessage = 'Bu işlemi gerçekleştirmek için yetkiniz yok.';
    } else if (error.status === 404) {
      errorMessage = 'İstenen kaynak bulunamadı.';
    } else if (error.status === 500) {
      errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
    }
    
    // Toast bildirimini göster
    this.toastrService.message(
      errorMessage,
      'Hata',
      {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      }
    );
  }
}