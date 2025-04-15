import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';

// Fonksiyonel interceptor'a geçiş
export const authInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  const toastrService = inject(CustomToastrService);
  
  // Kimlik doğrulama ve token yenileme endpoint'lerine token ekleme
  if (req.url.includes('/api/auth/login') || 
      req.url.includes('/api/token/login') || 
      req.url.includes('/api/token/refresh')) {
    return next(req);
  }
  
  // Mevcut token'ı al
  const accessToken = localStorage.getItem('accessToken');
  
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
        // Burada token yenileme mantığını tokenService'e olan bağımlılığı kaldırmak için değiştiriyoruz
        // Token'ı yerel depolama üzerinden temizle
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        toastrService.message(
          'Your session has expired. Please log in again.',
          'Your session has expired.',
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
        
        router.navigate(['/login'], { 
          queryParams: { returnUrl: router.url }
        });
      }
      
      // Diğer hataları olduğu gibi fırlat
      return throwError(() => error);
    })
  );
};