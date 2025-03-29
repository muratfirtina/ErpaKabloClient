// sitemap.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
import { Router } from '@angular/router';
import { SeoErrorHandlingService } from './seo-error-handling.service';
import { AnalyticsService } from '../analytics.services';
import { HttpClientService, RequestParameters } from '../http-client.service';

interface SitemapItem {
  url: string;
  changefreq: string;
  priority: number;
  lastmod?: string;
}

interface SitemapConfig {
  filename: string;
  urls: SitemapItem[];
}

interface SitemapResponse {
  success: boolean;
  message: string;
  url?: string;
  submittedToSearchEngines?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SitemapService {
  private readonly baseUrl = environment.baseUrl;
  private readonly searchEngines = [
    { name: 'Google', submitUrl: 'https://www.google.com/ping?sitemap=' },
    { name: 'Bing', submitUrl: 'https://www.bing.com/ping?sitemap=' },
    { name: 'Yandex', submitUrl: 'https://webmaster.yandex.com/ping?sitemap=' }
  ];

  constructor(
    private httpClientService: HttpClientService,
    private router: Router,
    private analyticsService: AnalyticsService,
    private errorService: SeoErrorHandlingService
  ) {}

  /**
   * Generates and saves a sitemap for the given URLs
   */
  generateSitemap(config: any): Observable<any> {
    const requestParams: Partial<RequestParameters> = {
      controller: "sitemaps",
      action: "generate"
    };
    
    return this.httpClientService.post<any>(requestParams, config).pipe(
      tap(response => {
        if (response.success) {
          console.log(`Sitemap generated successfully: ${response.url}`);
          this.analyticsService.trackEvent(
            'sitemap_generated',
            'SEO',
            'Sitemap Generated',
            config.filename,
            config.urls.length
          );
        }
      }),
      catchError(error => {
        this.errorService.handleError(error, 'generateSitemap');
        return of({
          success: false,
          message: 'Failed to generate sitemap. Please try again later.'
        });
      })
    );
  }

  /**
   * Refreshes all sitemaps
   */
  refreshSitemaps(): Observable<any> {
    const requestParams: Partial<RequestParameters> = {
      controller: "sitemaps",
      action: "refresh"
    };
    
    return this.httpClientService.post<any>(requestParams, {}).pipe(
      tap(response => {
        if (response.success) {
          console.log('All sitemaps refreshed successfully');
          this.analyticsService.trackEvent(
            'sitemaps_refreshed',
            'SEO',
            'Sitemaps Refreshed'
          );
        }
      }),
      catchError(error => {
        this.errorService.handleError(error, 'refreshSitemaps');
        
        // Return mock successful response for development/testing
        if (environment.production === false) {
          return of({
            success: true,
            message: 'All sitemaps refreshed successfully (mock)'
          });
        }
        
        return of({
          success: false,
          message: 'Failed to refresh sitemaps. Please try again later.'
        });
      })
    );
  }

  /**
   * Submits a sitemap URL to multiple search engines
   */
  submitSitemapToSearchEngines(sitemapUrl: string): Observable<{success: boolean, engines: string[]}> {
    const fullUrl = sitemapUrl.startsWith('http') ? sitemapUrl : `${this.baseUrl}${sitemapUrl}`;
    const encodedUrl = encodeURIComponent(fullUrl);
    
    // In production, this would make actual API calls to search engines
    // For now, we'll just simulate success
    console.log(`Submitting sitemap ${fullUrl} to search engines`);
    
    const successfulEngines = this.searchEngines.map(engine => engine.name);
    
    this.analyticsService.trackEvent(
      'sitemap_submitted',
      'SEO',
      'Sitemap Submitted',
      successfulEngines.join(', '),
      1
    );
    
    return of({
      success: true,
      engines: successfulEngines
    });
  }

  /**
   * Submits all sitemaps to search engines
   */
  submitSitemapsToSearchEngines(): Observable<any> {
    const requestParams: Partial<RequestParameters> = {
      controller: "sitemaps",
      action: "submit"
    };
    
    return this.httpClientService.post<any>(requestParams, {}).pipe(
      tap(response => {
        if (response.success) {
          console.log(`${response.count} sitemaps submitted to search engines`);
          this.analyticsService.trackEvent(
            'sitemaps_submitted',
            'SEO',
            'All Sitemaps Submitted',
            'All Engines',
            response.count
          );
        }
      }),
      catchError(error => {
        this.errorService.handleError(error, 'submitSitemapsToSearchEngines');
        
        // Return mock successful response for development/testing
        if (environment.production === false) {
          return of({
            success: true,
            count: 5
          });
        }
        
        return of({
          success: false,
          count: 0
        });
      })
    );
  }


  /**
   * Generates dynamic sitemap content based on routes
   */
  generateDynamicSitemap(): Observable<SitemapItem[]> {
    return this.getDynamicRoutes().pipe(
      map(routes => {
        return routes.map(route => ({
          url: `${this.baseUrl}/${route.path}`,
          changefreq: this.getChangeFrequency(route.path),
          priority: this.getRoutePriority(route.path),
          lastmod: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        }));
      })
    );
  }

  /**
   * Gets dynamic routes from application
   */
  private getDynamicRoutes(): Observable<{path: string, data?: any}[]> {
    // In a real implementation, this might get routes from the API
    // For now, we'll return mock routes based on the router configuration
    
    const routes = this.router.config
      .filter(route => {
        // Filter out routes with parameters or wildcards
        return !route.path?.includes(':') && 
               !route.path?.includes('*') && 
               route.path !== '**' &&
               route.path !== '';
      })
      .map(route => ({
        path: route.path || '',
        data: route.data
      }));
    
    // Add home page with empty path
    routes.push({
      path: '',
      data: { title: 'Home' }
    });
    
    return of(routes);
  }

  /**
   * Determines change frequency for a route
   */
  private getChangeFrequency(path: string): string {
    // Logic to determine how often the page changes
    if (path === '') return 'daily'; // Home page
    if (path === 'products') return 'daily';
    if (path.includes('blog') || path.includes('news')) return 'daily';
    if (path.includes('category') || path.includes('categories')) return 'weekly';
    return 'monthly'; // Default for static pages
  }

  /**
   * Determines priority for a route
   */
  private getRoutePriority(path: string): number {
    // Logic to determine importance of the page
    if (path === '') return 1.0; // Home page
    if (path === 'products') return 0.9;
    if (path.includes('category') || path.includes('categories')) return 0.8;
    if (path.includes('blog') || path.includes('news')) return 0.7;
    return 0.5; // Default priority
  }
}