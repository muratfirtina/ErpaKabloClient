/* import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClientService } from './http-client.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';

@Injectable({
  providedIn: 'root'
})
export class VisitorAnalyticsService {
  constructor(
    private httpClientService: HttpClientService,
    private toastrService: CustomToastrService
  ) { }

  // Analiz özet verileri
  getAnalyticsSummary(startDate: string, endDate: string, source: string = 'internal'): Observable<any> {
    return this.httpClientService.get<any>({
      controller: 'analytics',
      action: 'summary',
      queryString: `startDate=${startDate}&endDate=${endDate}&source=${source}`
    }).pipe(
      tap(data => console.log('Analiz özeti alındı:', data)),
      catchError(this.handleError<any>('getAnalyticsSummary', null))
    );
  }

  // En popüler yönlendiriciler (referrers)
  getTopReferrers(startDate: string, endDate: string, source: string = 'internal', limit: number = 20): Observable<any[]> {
    return this.httpClientService.get<any[]>({
      controller: 'analytics',
      action: 'top-referrers',
      queryString: `startDate=${startDate}&endDate=${endDate}&source=${source}&limit=${limit}`
    }).pipe(
      tap(data => console.log('Top referrers alındı:', data)),
      catchError(this.handleError<any[]>('getTopReferrers', []))
    );
  }

  // En popüler sayfalar
  getTopPages(startDate: string, endDate: string, source: string = 'internal', limit: number = 20): Observable<any[]> {
    return this.httpClientService.get<any[]>({
      controller: 'analytics',
      action: 'top-pages',
      queryString: `startDate=${startDate}&endDate=${endDate}&source=${source}&limit=${limit}`
    }).pipe(
      tap(data => console.log('Top pages alındı:', data)),
      catchError(this.handleError<any[]>('getTopPages', []))
    );
  }

  // Cihaz ve tarayıcı istatistikleri
  getDeviceStats(startDate: string, endDate: string, source: string = 'internal'): Observable<any> {
    return this.httpClientService.get<any>({
      controller: 'analytics',
      action: 'device-stats',
      queryString: `startDate=${startDate}&endDate=${endDate}&source=${source}`
    }).pipe(
      tap(data => console.log('Cihaz istatistikleri alındı:', data)),
      catchError(this.handleError<any>('getDeviceStats', null))
    );
  }

  // Ziyaretçi zaman çizelgesi
  getVisitorTimeline(startDate: string, endDate: string, source: string = 'internal'): Observable<any[]> {
    return this.httpClientService.get<any[]>({
      controller: 'analytics',
      action: 'visitor-timeline',
      queryString: `startDate=${startDate}&endDate=${endDate}&source=${source}`
    }).pipe(
      tap(data => console.log('Ziyaretçi zaman çizelgesi alındı:', data)),
      catchError(this.handleError<any[]>('getVisitorTimeline', []))
    );
  }

  // UTM Kampanya analizi
  getCampaignStats(startDate: string, endDate: string, source: string = 'internal'): Observable<any[]> {
    return this.httpClientService.get<any[]>({
      controller: 'analytics',
      action: 'campaign-stats',
      queryString: `startDate=${startDate}&endDate=${endDate}&source=${source}`
    }).pipe(
      tap(data => console.log('Kampanya istatistikleri alındı:', data)),
      catchError(this.handleError<any[]>('getCampaignStats', []))
    );
  }

  // Coğrafi konum analizi
  getGeographyStats(startDate: string, endDate: string, source: string = 'internal'): Observable<any[]> {
    return this.httpClientService.get<any[]>({
      controller: 'analytics',
      action: 'geography-stats',
      queryString: `startDate=${startDate}&endDate=${endDate}&source=${source}`
    }).pipe(
      tap(data => console.log('Coğrafi istatistikler alındı:', data)),
      catchError(this.handleError<any[]>('getGeographyStats', []))
    );
  }

  // Google Analytics entegrasyonu durumunu kontrol et
  checkGoogleAnalyticsStatus(): Observable<boolean> {
    return this.httpClientService.get<any>({
      controller: 'analytics',
      action: 'ga-status'
    }).pipe(
      map((response: any) => response.isConfigured === true),
      catchError(this.handleError<boolean>('checkGoogleAnalyticsStatus', false))
    );
  }

  // Hata işleme
  private handleError<T>(operation: string, result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} işlemi sırasında hata:`, error);
      
      // Kullanıcıya hata bildirimini göster
      this.toastrService.message(
        `Analiz verileri yüklenirken bir hata oluştu: ${error.error?.message || error.message || 'Bilinmeyen hata'}`, 
        'Hata', 
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
      
      // Varsayılan boş değer döndür
      return of(result as T);
    };
  }
} */