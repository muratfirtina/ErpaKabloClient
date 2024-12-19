// services/seo-error-handling.service.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr'; // Bildirim için

interface ErrorReport {
  context: string;
  error: any;
  timestamp: Date;
  severity: 'critical' | 'warning' | 'info';
  userMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoErrorHandlingService {
  constructor(
    private toastr: ToastrService
  ) {}

  handleError(error: any, context: string): void {
    console.error(`SEO Error in ${context}:`, error);
    
    // Hata tipine göre işlem yap
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error, context);
    } else if (error instanceof TypeError) {
      this.handleTypeError(error, context);
    } else {
      this.handleGenericError(error, context);
    }
  }

  private handleHttpError(error: HttpErrorResponse, context: string): void {
    let userMessage = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
    let severity: 'critical' | 'warning' | 'info' = 'warning';

    switch (error.status) {
      case 400:
        userMessage = 'Geçersiz SEO yapılandırması. Lütfen ayarlarınızı kontrol edin.';
        severity = 'warning';
        break;

      case 401:
        userMessage = 'Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.';
        severity = 'warning';
        break;

      case 403:
        userMessage = 'Bu işlem için gerekli yetkiniz bulunmuyor.';
        severity = 'warning';
        break;

      case 404:
        userMessage = 'SEO yapılandırması bulunamadı.';
        severity = 'warning';
        break;

      case 422:
        userMessage = 'SEO ayarları geçersiz formatda. Lütfen kontrol edin.';
        severity = 'warning';
        break;

      case 429:
        userMessage = 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.';
        severity = 'warning';
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        userMessage = 'Sunucu kaynaklı bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        severity = 'critical';
        break;

      default:
        userMessage = 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        severity = 'critical';
    }

    const report: ErrorReport = {
      context: `SEO_HTTP_${context}`,
      error: {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        url: error.url
      },
      timestamp: new Date(),
      severity,
      userMessage
    };

    this.reportError(report);
  }

  private handleTypeError(error: TypeError, context: string): void {
    let userMessage = 'SEO yapılandırmasında bir sorun oluştu.';
    let severity: 'critical' | 'warning' | 'info' = 'warning';

    // TypeError'ların spesifik durumları
    if (error.message.includes('undefined')) {
      userMessage = 'SEO ayarlarında eksik bilgi bulunuyor.';
    } else if (error.message.includes('null')) {
      userMessage = 'SEO yapılandırması bulunamadı.';
    } else if (error.message.includes('not a function')) {
      severity = 'critical';
      userMessage = 'SEO servisinde teknik bir sorun oluştu.';
    }

    const report: ErrorReport = {
      context: `SEO_TYPE_${context}`,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date(),
      severity,
      userMessage
    };

    this.reportError(report);
  }

  private handleGenericError(error: any, context: string): void {
    const report: ErrorReport = {
      context: `SEO_GENERIC_${context}`,
      error: error,
      timestamp: new Date(),
      severity: 'critical',
      userMessage: 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    };

    this.reportError(report);
  }

  private reportError(report: ErrorReport): void {
    // Console'a log
    console.error('SEO Error Report:', report);

    // Kullanıcıya bildirim
    switch (report.severity) {
      case 'critical':
        this.toastr.error(report.userMessage, 'Hata');
        break;
      case 'warning':
        this.toastr.warning(report.userMessage, 'Uyarı');
        break;
      case 'info':
        this.toastr.info(report.userMessage, 'Bilgi');
        break;
    }

    // Hata raporlama servisi veya analytics'e gönderme
    this.sendToErrorTracking(report);
  }

  private sendToErrorTracking(report: ErrorReport): void {
    // Burada projenizin hata izleme sistemine gönderim yapabilirsiniz
    // Örneğin: Sentry, LogRocket, vb.
    try {
      // ErrorTrackingService.report(report);
      // veya
      // Analytics.logError(report);
    } catch (error) {
      console.error('Error reporting failed:', error);
    }
  }

  handleBusinessException(error: any , context:any): void {
    if (error?.error?.Message) {
      this.toastr.error(error.error.Message, 'İşlem Başarısız');
    } else {
      this.handleGenericError(error,context);
    }
  }
}