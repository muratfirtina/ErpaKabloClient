import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { Router } from '@angular/router';
import { TokenService } from '../services/common/token.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';


export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const toastrService = inject(CustomToastrService);
  
  // Kimlik doğrulama ve token yenileme endpoint'lerine token ekleme
  if (req.url.includes('/api/auth/login') || 
      req.url.includes('/api/token/login') || 
      req.url.includes('/api/token/refresh')) {
    return next(req);
  }
  
  // Mevcut token'ı al
  const accessToken = tokenService.getAccessToken();
  
  // Token yoksa isteği olduğu gibi gönder
  if (!accessToken) {
    return next(req);
  }
  
  // Token varsa ekle
  req = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  return next(req).pipe(
    catchError(error => {
      // 401 Unauthorized hatası ve token yenileme isteği değilse
      if (error.status === 401 && !req.url.includes('/api/token/refresh')) {
        // Token'ı yenilemeyi dene
        return from(tokenService.refreshToken()).pipe(
          switchMap(success => {
            if (success) {
              // Yeni token ile isteği tekrarla
              const newToken = tokenService.getAccessToken();
              const authReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(authReq);
            } else {
              // Token yenileme başarısız olursa oturumu kapat ve giriş sayfasına yönlendir
              tokenService.clearTokens();
              
              toastrService.message(
                'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.',
                'Oturum Süresi Doldu',
                {
                  toastrMessageType: ToastrMessageType.Warning,
                  position: ToastrPosition.TopRight
                }
              );
              
              router.navigate(['/login'], { 
                queryParams: { returnUrl: router.url }
              });
              
              return throwError(() => error);
            }
          }),
          catchError(refreshError => {
            // Token yenileme sırasında hata olursa
            console.error('Token refresh error:', refreshError);
            tokenService.clearTokens();
            
            router.navigate(['/login'], { 
              queryParams: { returnUrl: router.url }
            });
            
            return throwError(() => error);
          })
        );
      }
      
      // Diğer hataları olduğu gibi fırlat
      return throwError(() => error);
    })
  );
};