import { HttpInterceptorFn, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';
import { Router } from '@angular/router';
import { catchError, throwError, finalize } from 'rxjs';
import { SecurityService } from '../services/common/security.service';
import { RateLimitService } from '../services/common/rate-limit.service';
import { PerformanceMonitorService } from '../services/common/performance-monitor.service';

export const securityInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const toastrService = inject(CustomToastrService);
  const rateLimitService = inject(RateLimitService);
  const performanceMonitor = inject(PerformanceMonitorService);
  const router = inject(Router);

  // Rate limiting kontrolü sadece API istekleri için
  if (!rateLimitService.checkRateLimit(req.url)) {
    toastrService.message(
      "Çok fazla istek gönderildi. Lütfen bir süre bekleyin.", 
      "Rate Limit Aşıldı",
      {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      }
    );
    return throwError(() => new Error('Rate limit exceeded'));
  }

  // Performans ölçümü başlat
  const startTime = performanceMonitor.startMeasurement(req.url);

  // Token varsa ekle
  const token = localStorage.getItem("accessToken");
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    finalize(() => {
      performanceMonitor.endMeasurement(req.url, startTime);
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem("accessToken");
        router.navigate(["login"], { 
          queryParams: { returnUrl: router.routerState.snapshot.url } 
        });
        toastrService.message(
          "Oturumunuz sonlandırıldı.", 
          "Yetkisiz Erişim",
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      } else if (error.status === 403) {
        rateLimitService.clearRateLimits();
        router.navigate(["/unauthorized"]);
        toastrService.message(
          "Bu işlem için yetkiniz bulunmamaktadır.", 
          "Yetkisiz İşlem",
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      } else if (error.status === 429) {
        toastrService.message(
          "Çok fazla istek gönderildi. Lütfen bir süre bekleyin.", 
          "Rate Limit Aşıldı",
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      } else {
        toastrService.message(
          "Bir hata oluştu.", 
          "Hata",
          {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
      }
      return throwError(() => error);
    })
  );
};