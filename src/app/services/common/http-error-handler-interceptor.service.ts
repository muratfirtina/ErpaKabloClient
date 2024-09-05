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
}
