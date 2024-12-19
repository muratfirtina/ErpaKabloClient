// sitemap-monitoring.service.ts
import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HttpClientService } from '../common/http-client.service';
import { SitemapMonitoringReport, SitemapStatus } from 'src/app/contracts/sitemap/sitemap.model';

@Injectable({
  providedIn: 'root'
})
export class SitemapMonitoringService {
  private readonly sitemapTypes = [
    'sitemap.xml',
    'products.xml',
    'categories.xml',
    'brands.xml',
    'images.xml',
    'static-pages.xml'
  ];

  constructor(private httpClientService: HttpClientService) {}

  /**
   * Tüm sitemap'lerin durumunu kontrol eder
   */
  monitorAllSitemaps(): Observable<SitemapMonitoringReport> {
    const startTime = Date.now();
    const statuses: SitemapStatus[] = [];
    const issues: any[] = [];

    return new Observable(observer => {
      this.sitemapTypes.forEach(type => {
        this.checkSitemapHealth(type).subscribe({
          next: (status) => {
            statuses.push(status);
            
            // Tüm kontroller tamamlandığında raporu oluştur
            if (statuses.length === this.sitemapTypes.length) {
              const report = this.generateMonitoringReport(statuses);
              observer.next(report);
              observer.complete();
            }
          },
          error: (error) => {
            issues.push({
              severity: 'high',
              message: `Failed to check ${type}: ${error.message}`,
              sitemap: type
            });
          }
        });
      });
    });
  }

  /**
   * Belirli bir sitemap'in sağlığını kontrol eder
   */
  private checkSitemapHealth(sitemapType: string): Observable<SitemapStatus> {
    const startTime = Date.now();

    return this.httpClientService.get<string>({
      controller: "sitemaps",
      action: sitemapType,
      responseType: "text"
    }).pipe(
      map(response => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response, "text/xml");
        const urls = xmlDoc.getElementsByTagName('url').length;
        const lastMod = xmlDoc.querySelector('lastmod')?.textContent;

        return {
          url: `sitemaps/${sitemapType}`,
          lastChecked: new Date(),
          isAccessible: true,
          responseTime: Date.now() - startTime,
          fileSize: new Blob([response]).size,
          urlCount: urls,
          lastModified: lastMod ? new Date(lastMod) : null
        };
      }),
      catchError(error => {
        return [{
          url: `sitemaps/${sitemapType}`,
          lastChecked: new Date(),
          isAccessible: false,
          responseTime: Date.now() - startTime,
          fileSize: 0,
          urlCount: 0,
          lastModified: null,
          errors: [error.message]
        }];
      })
    );
  }

  /**
   * Monitoring raporu oluşturur
   */
  private generateMonitoringReport(statuses: SitemapStatus[]): SitemapMonitoringReport {
    const issues: any[] = [];
    let totalUrls = 0;
    let healthScore = 100;

    statuses.forEach(status => {
      totalUrls += status.urlCount;

      // Response time kontrolü
      if (status.responseTime > 2000) {
        issues.push({
          severity: 'medium',
          message: `Slow response time (${status.responseTime}ms) for ${status.url}`,
          sitemap: status.url
        });
        healthScore -= 10;
      }

      // Erişilebilirlik kontrolü
      if (!status.isAccessible) {
        issues.push({
          severity: 'high',
          message: `Sitemap ${status.url} is not accessible`,
          sitemap: status.url
        });
        healthScore -= 20;
      }

      // URL sayısı kontrolü
      if (status.urlCount === 0) {
        issues.push({
          severity: 'medium',
          message: `Sitemap ${status.url} contains no URLs`,
          sitemap: status.url
        });
        healthScore -= 15;
      }
    });

    return {
      sitemaps: statuses,
      totalUrls,
      lastFullCheck: new Date(),
      healthScore: Math.max(0, healthScore),
      issues
    };
  }

  /**
   * Periyodik kontrol başlatır
   */
  startPeriodicMonitoring(intervalMinutes: number = 60): Observable<SitemapMonitoringReport> {
    return interval(intervalMinutes * 60 * 1000).pipe(
      switchMap(() => this.monitorAllSitemaps())
    );
  }
}