import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, mergeMap } from 'rxjs/operators';

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      this.retryWithBackoff(),
      catchError((error: HttpErrorResponse) => {
        // Son hata işleme mantığı
        console.error('HTTP isteği başarısız oldu:', error);
        return throwError(() => error);
      })
    );
  }

  // Üstel geri çekilme stratejisi
  private retryWithBackoff(maxRetries = 3, initialDelay = 500, backoffFactor = 2) {
    return (source: Observable<any>) => 
      source.pipe(
        retry({
          count: maxRetries,
          delay: (error, retryCount) => {
            // 429 hataları için retry yapalım
            if (error.status === 429) {
              console.log(`Retry ${retryCount} için ${initialDelay * Math.pow(backoffFactor, retryCount - 1)}ms bekleniyor...`);
              
              // Her denemede artan bekleme süresi
              return timer(initialDelay * Math.pow(backoffFactor, retryCount - 1));
            }
            
            // Diğer HTTP hataları için retry yapmayalım
            return throwError(() => error);
          }
        })
      );
  }
}