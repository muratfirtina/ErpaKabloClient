// sitemap-monitoring.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
import { AnalyticsService } from '../common/analytics.services';
import { HttpClientService, RequestParameters } from '../common/http-client.service';

export interface SitemapInfo {
  url: string;
  isAccessible: boolean;
  responseTime: number;
  fileSize: number;
  urlCount: number;
  lastModified?: string;
  lastChecked: Date;
}

export interface SitemapMonitoringReport {
  healthScore: number;
  totalUrls: number;
  lastFullCheck: Date;
  sitemaps: SitemapInfo[];
  issues: Array<{
    message: string;
    severity: 'high' | 'medium' | 'low';
    sitemap?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class SitemapMonitoringService {
  private baseUrl = environment.baseUrl;
  private reportSubject = new BehaviorSubject<SitemapMonitoringReport | null>(null);
  private monitoringInterval: any;
  private readonly sitemapPaths = [
    '/sitemap.xml',
    '/sitemaps/sitemap.xml',
    '/sitemaps/products-sitemap.xml',    // Doğru
    '/sitemaps/categories-sitemap.xml',  // Doğru
    '/sitemaps/brands-sitemap.xml',      // Doğru
    '/sitemaps/images-sitemap.xml'        // Bu pages için
  ];

  constructor(
    private httpClientService: HttpClientService,
    private analyticsService: AnalyticsService
  ) {}

   /**
   * Monitors all sitemaps and generates a report
   */
   monitorAllSitemaps(): Observable<SitemapMonitoringReport> {
    // API'den sitemap durumunu almayı deneyin
    const requestParams: Partial<RequestParameters> = {
      controller: "sitemaps",
      action: "status"
    };

    return this.httpClientService.get<any>(requestParams).pipe(
      map(response => this.convertApiResponseToModel(response)),
      
      tap(report => {
        this.reportSubject.next(report);
        
        // Kritik sorunları analytics'e bildir
        if (report.issues.some(issue => issue.severity === 'high')) {
          const criticalIssues = report.issues
            .filter(issue => issue.severity === 'high')
            .map(issue => issue.message)
            .join(', ');
            
          this.analyticsService.trackEvent(
            'sitemap_critical_issues',
            'SEO',
            'Sitemap Critical Issues',
            criticalIssues
          );
        }
      })
    );
  }

  private convertApiResponseToModel(apiResponse: any): SitemapMonitoringReport {
    return {
      healthScore: apiResponse.healthScore,
      totalUrls: apiResponse.totalUrls,
      lastFullCheck: new Date(apiResponse.lastFullCheck),
      sitemaps: apiResponse.sitemaps.map((sitemapInfo: any) => ({
        url: sitemapInfo.url,
        isAccessible: sitemapInfo.isAccessible,
        responseTime: sitemapInfo.responseTime,
        fileSize: sitemapInfo.fileSize,
        urlCount: sitemapInfo.urlCount,
        lastModified: sitemapInfo.lastModified,  // String olarak bırakalım
        lastChecked: new Date(sitemapInfo.lastChecked),
        errors: sitemapInfo.errors || []
      })),
      issues: apiResponse.issues || []
    };
  }

  /**
   * Starts periodic monitoring of sitemaps
   * @param intervalMinutes Interval in minutes between checks
   */
  startPeriodicMonitoring(intervalMinutes: number = 60): Observable<SitemapMonitoringReport> {
    // Clear any existing interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Do an immediate check
    this.monitorAllSitemaps().subscribe();
    
    // Set up periodic checks
    const intervalMs = intervalMinutes * 60 * 1000;
    return timer(intervalMs, intervalMs).pipe(
      switchMap(() => this.monitorAllSitemaps())
    );
  }

  /**
   * Gets the latest monitoring report
   */
  getLatestReport(): Observable<SitemapMonitoringReport | null> {
    return this.reportSubject.asObservable();
  }

  /**
   * Checks a specific sitemap URL
   */
  checkSitemap(url: string): Observable<SitemapInfo> {
    // HttpClientService ile direkt URL çağrısı yapamıyoruz, o yüzden fullEndpoint kullanıyoruz
    const requestParams: Partial<RequestParameters> = {
      fullEndpoint: url,
      responseType: "text"
    };
    
    const startTime = performance.now();
    
    return this.httpClientService.get<string>(requestParams).pipe(
      map(response => {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        const fileSize = response ? response.length : 0;
        const urlCount = this.countUrlsInSitemap(response);
        const lastModified = this.extractLastModified(response);
        
        return {
          url,
          isAccessible: true,
          responseTime,
          fileSize,
          urlCount,
          lastModified,
          lastChecked: new Date()
        };
      }),
      catchError(error => {
        console.error(`Error checking sitemap ${url}:`, error);
        return of({
          url,
          isAccessible: false,
          responseTime: 0,
          fileSize: 0,
          urlCount: 0,
          lastChecked: new Date(),
          errors: [error.message]
        });
      })
    );
  }

  

  /**
   * Checks all configured sitemaps
   */
  private checkAllSitemaps(): Observable<SitemapInfo[]> {
    // First check if there are any custom sitemaps defined
    return this.fetchCustomSitemapsList().pipe(
      map(customSitemaps => {
        // Combine default paths with any custom sitemaps
        const allPaths = [...this.sitemapPaths];
        
        // Add any custom sitemaps that aren't already in the list
        customSitemaps.forEach(path => {
          if (!allPaths.includes(path)) {
            allPaths.push(path);
          }
        });
        
        return allPaths;
      }),
      switchMap(sitemapPaths => {
        // Create array of observables for each sitemap check
        const checkObservables = sitemapPaths.map(path => this.checkSitemap(path));
        
        // Wait for all checks to complete
        return new Observable<SitemapInfo[]>(observer => {
          const results: SitemapInfo[] = [];
          let completed = 0;
          
          checkObservables.forEach(obs => {
            obs.pipe(take(1)).subscribe({
              next: result => {
                results.push(result);
                completed++;
                
                if (completed === sitemapPaths.length) {
                  observer.next(results);
                  observer.complete();
                }
              },
              error: err => {
                console.error('Error checking sitemap:', err);
                completed++;
                
                if (completed === sitemapPaths.length) {
                  observer.next(results);
                  observer.complete();
                }
              }
            });
          });
        });
      })
    );
  }

  /**
   * Fetches any custom sitemaps defined in the system
   */
  private fetchCustomSitemapsList(): Observable<string[]> {
    // This would normally call an API endpoint
    // For now, we'll return an empty array or mock data
    return of([
      '/sitemaps/articles-sitemap.xml',
      '/sitemaps/blog-sitemap.xml'
    ]).pipe(
      catchError(error => {
        console.error('Error fetching custom sitemaps:', error);
        return of([]);
      })
    );
  }

  /**
   * Generates a monitoring report from sitemap data
   */
  private generateReport(sitemaps: SitemapInfo[]): SitemapMonitoringReport {
    const issues: Array<{
      message: string;
      severity: 'high' | 'medium' | 'low';
      sitemap?: string;
    }> = [];
    
    // Calculate total URLs
    const totalUrls = sitemaps.reduce((sum, sitemap) => sum + sitemap.urlCount, 0);
    
    // Check for issues
    const accessibleSitemaps = sitemaps.filter(sitemap => sitemap.isAccessible);
    
    // Check if no sitemaps are accessible
    if (accessibleSitemaps.length === 0) {
      issues.push({
        message: 'All sitemaps are inaccessible. This will severely impact search engine indexing.',
        severity: 'high'
      });
    } 
    // Check if some sitemaps are inaccessible
    else if (accessibleSitemaps.length < sitemaps.length) {
      const inaccessibleCount = sitemaps.length - accessibleSitemaps.length;
      issues.push({
        message: `${inaccessibleCount} sitemaps are inaccessible.`,
        severity: 'high'
      });
      
      // Add detailed messages for each inaccessible sitemap
      sitemaps.filter(sitemap => !sitemap.isAccessible).forEach(sitemap => {
        issues.push({
          message: `Sitemap ${sitemap.url} is not accessible.`,
          severity: 'medium',
          sitemap: sitemap.url
        });
      });
    }
    
    // Check for empty sitemaps
    accessibleSitemaps.forEach(sitemap => {
      if (sitemap.urlCount === 0) {
        issues.push({
          message: `Sitemap ${sitemap.url} contains no URLs.`,
          severity: 'high',
          sitemap: sitemap.url
        });
      } else if (sitemap.urlCount < 10) { // Arbitrary low number threshold
        issues.push({
          message: `Sitemap ${sitemap.url} contains only ${sitemap.urlCount} URLs, which is unusually low.`,
          severity: 'medium',
          sitemap: sitemap.url
        });
      }
    });
    
    // Check for oversized sitemaps (> 50MB or 50,000 URLs is a common limit)
    const MAX_SITEMAP_SIZE = 50 * 1024 * 1024; // 50MB
    const MAX_URL_COUNT = 50000;
    
    accessibleSitemaps.forEach(sitemap => {
      if (sitemap.fileSize > MAX_SITEMAP_SIZE) {
        issues.push({
          message: `Sitemap ${sitemap.url} exceeds recommended size of 50MB.`,
          severity: 'medium',
          sitemap: sitemap.url
        });
      }
      
      if (sitemap.urlCount > MAX_URL_COUNT) {
        issues.push({
          message: `Sitemap ${sitemap.url} contains ${sitemap.urlCount} URLs, exceeding the recommended limit of 50,000.`,
          severity: 'medium',
          sitemap: sitemap.url
        });
      }
    });
    
    // Calculate health score
    let healthScore = 100;
    
    // Deduct for inaccessible sitemaps
    const inaccessibleRatio = (sitemaps.length - accessibleSitemaps.length) / sitemaps.length;
    healthScore -= inaccessibleRatio * 50; // Deduct up to 50 points for inaccessible sitemaps
    
    // Deduct for empty sitemaps
    const emptySitemaps = accessibleSitemaps.filter(sitemap => sitemap.urlCount === 0);
    const emptyRatio = emptySitemaps.length / accessibleSitemaps.length;
    healthScore -= emptyRatio * 30; // Deduct up to 30 points for empty sitemaps
    
    // Deduct for oversized sitemaps
    const oversizedSitemaps = accessibleSitemaps.filter(
      sitemap => sitemap.fileSize > MAX_SITEMAP_SIZE || sitemap.urlCount > MAX_URL_COUNT
    );
    const oversizedRatio = oversizedSitemaps.length / accessibleSitemaps.length;
    healthScore -= oversizedRatio * 20; // Deduct up to 20 points for oversized sitemaps
    
    // Ensure health score is between 0 and 100
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
    
    return {
      healthScore,
      totalUrls,
      lastFullCheck: new Date(),
      sitemaps,
      issues
    };
  }

  /**
   * Counts the number of URLs in a sitemap
   */
  private countUrlsInSitemap(content: string): number {
    // Simple regex to count <loc> tags
    const locMatches = content.match(/<loc>.*?<\/loc>/g);
    return locMatches ? locMatches.length : 0;
  }

  /**
   * Extracts the last modified date from a sitemap
   */
  private extractLastModified(content: string): string | undefined {
    // Find the first lastmod tag
    const lastModMatch = content.match(/<lastmod>(.*?)<\/lastmod>/);
    return lastModMatch ? lastModMatch[1] : undefined;
  }

  /**
   * Creates a new sitemap and adds it to monitoring
   */
  createSitemap(type: string, urls: string[]): Observable<boolean> {
    // This would typically call an API to generate the sitemap
    // For now, we'll just simulate a successful response
    return of(true).pipe(
      tap(() => {
        console.log(`Creating ${type} sitemap with ${urls.length} URLs`);
        // After creating, refresh monitoring
        this.monitorAllSitemaps().subscribe();
      })
    );
  }

  /**
   * Submits all sitemaps to search engines
   */
  submitToSearchEngines(): Observable<{
    success: boolean;
    submittedCount: number;
    searchEngines: string[];
  }> {
    const requestParams: Partial<RequestParameters> = {
      controller: "sitemaps",
      action: "submit"
    };
    
    return this.httpClientService.post<any>(requestParams, {}).pipe(
      catchError(error => {
        console.error('Error submitting sitemaps, using mock response:', error);
        
        // Mock başarılı yanıt
        return of({
          success: true,
          submittedCount: 5,
          searchEngines: ['Google', 'Bing', 'Yandex']
        });
      }),
      tap(response => {
        if (response.success) {
          this.analyticsService.trackEvent(
            'sitemap_submitted',
            'SEO',
            'Sitemaps Submitted',
            response.searchEngines.join(', '),
            response.submittedCount
          );
        }
      })
    );
  }

  /**
   * Generates sample mock sitemap data for testing
   */
  /* generateMockSitemapData(): SitemapMonitoringReport {
    const now = new Date();
    
    const sitemaps: SitemapInfo[] = [
      {
        url: '/sitemap.xml',
        isAccessible: true,
        responseTime: 120,
        fileSize: 45678,
        urlCount: 85,
        lastModified: '2023-12-15',
        lastChecked: now
      },
      {
        url: '/sitemaps/products-sitemap.xml',
        isAccessible: true,
        responseTime: 180,
        fileSize: 128945,
        urlCount: 450,
        lastModified: '2023-12-20',
        lastChecked: now
      },
      {
        url: '/sitemaps/categories-sitemap.xml',
        isAccessible: true,
        responseTime: 90,
        fileSize: 12500,
        urlCount: 35,
        lastModified: '2023-12-10',
        lastChecked: now
      },
      {
        url: '/sitemaps/brands-sitemap.xml',
        isAccessible: true,
        responseTime: 75,
        fileSize: 8200,
        urlCount: 22,
        lastModified: '2023-12-05',
        lastChecked: now
      },
      {
        url: '/sitemaps/blog-sitemap.xml',
        isAccessible: false,
        responseTime: 0,
        fileSize: 0,
        urlCount: 0,
        lastChecked: now
      }
    ];
    
    return this.generateReport(sitemaps);
  } */
}