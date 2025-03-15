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

  // Rate limiting check only for API requests
  if (!rateLimitService.checkRateLimit(req.url)) {
    toastrService.message(
      "Too many requests have been sent. Please wait a while.",
      "Rate Limit Exceeded",
      {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      }
    );
    return throwError(() => new Error('Rate limit exceeded'));
  }

  // Start performance measurement
  const startTime = performanceMonitor.startMeasurement(req.url);

  // Add token if available
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
          "Your session has expired.",
          "Unauthorized Access",
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      } else if (error.status === 403) {
        rateLimitService.clearRateLimits();
        router.navigate(["/unauthorized"]);
        toastrService.message(
          "You are not authorized to perform this action.",
          "Unauthorized Action",
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      } else if (error.status === 429) {
        toastrService.message(
          "Too many requests have been sent. Please wait a while.",
          "Rate Limit Exceeded",
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      } else {
        toastrService.message(
          "An error occurred.",
          "Error",
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