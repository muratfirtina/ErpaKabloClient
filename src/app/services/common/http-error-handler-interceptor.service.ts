import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { UserAuthService } from './models/user-auth.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base/base.component';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerInterceptorService implements HttpInterceptor {

  constructor(private toastrService:CustomToastrService, private userAuthService:UserAuthService,private router:Router,private spinner:NgxSpinnerService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(req).pipe(catchError(error => {
      switch (error.status) {
        
        case HttpStatusCode.Unauthorized:
          
          this.userAuthService.refreshTokenLogin(localStorage.getItem("refreshToken"),(state)=>{
            if(!state){
              const url = this.router.url;
              if(url == "/products"){
                this.toastrService.message("Sepete ürün eklemek için oturum açınız.", "Oturum açınız!",{
                  toastrMessageType: ToastrMessageType.Warning,
                  position: ToastrPosition.TopRight
                });
    
              }else
              this.toastrService.message("Bu işlemi yapmaya yetkiniz yok.", "Yetkisiz işlem!",{
                toastrMessageType: ToastrMessageType.Warning,
                position: ToastrPosition.BottomFullWidth
              });
            }
          }).then(data => {
            
          })
          break;
        case HttpStatusCode.InternalServerError:
          this.toastrService.message("The server is unreachable","Server Error",{
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.BottomFullWidth
          });
          break;
        case HttpStatusCode.BadRequest:
          this.toastrService.message("Geçersiz istek.", "Unauthorized operation!",{
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.BottomFullWidth
          });
          break;
        case HttpStatusCode.NotFound:
          this.toastrService.message("Page not found.", "Page not found!",{
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopCenter
          });
          break;
          default:
            this.toastrService.message("An unexpected error occurred.", "Error!",{
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.BottomFullWidth
            });
            break;
      }
      this.spinner.hide(SpinnerType.BallSpinClockwise);
      return of(error);
    }));
    
    
  }

  // Mevcut ErrorService'e ekleyebilirsiniz
handleError(error: any, customMessage?: string): void {
  let errorMessage = customMessage || 'An error occurred';
  
  console.error('Error details:', error);
  
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
      errorMessage = `Validation error: ${validationErrors}`;
    }
  }
  
  // HTTP durum koduna göre kullanıcı dostu mesajlar
  if (error.status === 400) {
    errorMessage = customMessage || 'Invalid request. Please check your information.';
  } else if (error.status === 401) {
    errorMessage = 'Authentication required. Please log in.';
    // Oturumun süresi dolmuş olabilir, login sayfasına yönlendir
    // this.router.navigate(['/login']);
  } else if (error.status === 403) {
    errorMessage = 'You do not have permission to perform this action.';
  } else if (error.status === 404) {
    errorMessage = 'The requested resource was not found.';
  } else if (error.status === 500) {
    errorMessage = 'Server error. Please try again later.';
  }
  
  // Toast bildirimini göster
  this.toastrService.message(
    errorMessage,
    'Error',
    {
      toastrMessageType: ToastrMessageType.Error,
      position: ToastrPosition.TopRight
    }
  );
}
}
