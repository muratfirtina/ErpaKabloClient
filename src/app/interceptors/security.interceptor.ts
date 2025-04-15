import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, finalize } from 'rxjs';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';
import { Router } from '@angular/router';
import { RateLimitService } from '../services/common/rate-limit.service';
import { PerformanceMonitorService } from '../services/common/performance-monitor.service';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  constructor(
    private toastrService: CustomToastrService,
    private rateLimitService: RateLimitService,
    private performanceMonitor: PerformanceMonitorService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Rate limiting check only for API requests
    if (!this.rateLimitService.checkRateLimit(req.url)) {
      this.toastrService.message(
        "Çok fazla istek gönderildi. Lütfen bir süre bekleyin.",
        "İstek Limiti Aşıldı",
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
      return throwError(() => new Error('Rate limit exceeded'));
    }

    // Start performance measurement
    const startTime = this.performanceMonitor.startMeasurement(req.url);

    return next.handle(req).pipe(
      finalize(() => {
        this.performanceMonitor.endMeasurement(req.url, startTime);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          this.rateLimitService.clearRateLimits();
          this.router.navigate(["/unauthorized"]);
          this.toastrService.message(
            "Bu işlemi gerçekleştirmek için yetkiniz yok.",
            "Yetkisiz İşlem",
            {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.TopRight
            }
          );
        } else if (error.status === 429) {
          this.toastrService.message(
            "Çok fazla istek gönderildi. Lütfen bir süre bekleyin.",
            "İstek Limiti Aşıldı",
            {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.TopRight
            }
          );
        }
        return throwError(() => error);
      })
    );
  }
}