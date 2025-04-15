import { Injectable } from '@angular/core';
import { HttpEvent, HttpRequest, HttpHandler, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PerformanceMonitorService } from '../services/common/performance-monitor.service';

@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {
  constructor(private performanceMonitor: PerformanceMonitorService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip monitoring for certain URLs
    const config = this.performanceMonitor.getConfig().monitoring.performance;
    if (config.endpointExclusions.some(pattern => req.url.includes(pattern))) {
      return next.handle(req);
    }
    
    const startTime = performance.now();
    
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);
          
          // Record successful endpoint performance
          this.performanceMonitor.recordEndpointPerformance(
            req.url,
            duration,
            true
          );
        }
      }),
      catchError(error => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        // Record failed endpoint performance
        this.performanceMonitor.recordEndpointPerformance(
          req.url,
          duration,
          false
        );
        
        throw error;
      })
    );
  }
}