// performance-monitor.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';
import { AnalyticsService } from '../common/analytics.services';
import { HttpClientService, RequestParameters } from './http-client.service';
import { environment } from 'src/environments/environment.prod';

export interface EndpointMetric {
  endpoint: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastResponseTime: number;
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  lastRequest: Date;
  responseHistory: {
    timestamp: Date;
    duration: number;
    success: boolean;
  }[];
}

export interface PerformanceAlert {
  timestamp: Date;
  endpoint: string;
  duration: number;
  threshold: number;
  type: 'warning' | 'critical';
  message: string;
}

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  source?: string;
}

export interface SystemMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  responseTimeAvg: number;
  errorRate: number;
  activeUsers?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private metrics: Map<string, EndpointMetric> = new Map();
  private metricsSubject = new BehaviorSubject<EndpointMetric[]>([]);
  private alertsSubject = new BehaviorSubject<PerformanceAlert[]>([]);
  private systemMetricsSubject = new BehaviorSubject<SystemMetrics>({
    responseTimeAvg: 0,
    errorRate: 0
  });
  private webVitalsSubject = new BehaviorSubject<WebVitalMetric[]>([]);
  private alerts: PerformanceAlert[] = [];
  private config = {
    monitoring: {
      enabled: true,
      performance: {
        highLatencyThresholdMs: 500,
        criticalLatencyThresholdMs: 1000,
        endpointExclusions: ['/api/metrics', '/api/health'],
        sampleRate: 1.0, // 1.0 = monitor all requests, 0.5 = monitor 50% of requests
        historyLimit: 100, // Maximum number of history entries per endpoint
        alertsLimit: 50 // Maximum number of stored alerts
      }
    }
  };
  lastRateLimitError: number | null = null;

  constructor(
    private httpClientService: HttpClientService,
    private analyticsService: AnalyticsService
  ) {
    // Start periodic background metrics collection
    this.startPeriodicMetricsCollection();
  }

  /**
   * Starts a performance measurement for an endpoint
   * @param url The URL being measured
   * @returns A timestamp for the start time
   */
  startMeasurement(url: string): number {
    return performance.now();
  }

  /**
   * Ends a performance measurement and records the result
   * @param url The URL that was measured
   * @param startTime The timestamp from startMeasurement
   */
  endMeasurement(url: string, startTime: number): void {
    const duration = Math.round(performance.now() - startTime);
    this.recordEndpointPerformance(url, duration, true);
  }

  /**
   * Records performance data for an endpoint
   */
  recordEndpointPerformance(endpoint: string, duration: number, success: boolean): void {
    if (!this.config.monitoring.enabled) return;
    
    // Check for endpoint exclusions
    if (this.config.monitoring.performance.endpointExclusions.some(pattern => 
        endpoint.includes(pattern))) {
      return;
    }
    
    // Apply sampling rate
    if (Math.random() > this.config.monitoring.performance.sampleRate) {
      return;
    }
    
    // Get or create metric object for this endpoint
    let metric = this.metrics.get(endpoint);
    const now = new Date();
    
    if (!metric) {
      metric = {
        endpoint,
        avgResponseTime: duration,
        minResponseTime: duration,
        maxResponseTime: duration,
        lastResponseTime: duration,
        totalRequests: 1,
        successRequests: success ? 1 : 0,
        failedRequests: success ? 0 : 1,
        lastRequest: now,
        responseHistory: [{
          timestamp: now,
          duration,
          success
        }]
      };
    } else {
      // Update existing metric
      const newTotalRequests = metric.totalRequests + 1;
      const newAvgResponseTime = ((metric.avgResponseTime * metric.totalRequests) + duration) / newTotalRequests;
      
      metric = {
        ...metric,
        avgResponseTime: newAvgResponseTime,
        minResponseTime: Math.min(metric.minResponseTime, duration),
        maxResponseTime: Math.max(metric.maxResponseTime, duration),
        lastResponseTime: duration,
        totalRequests: newTotalRequests,
        successRequests: metric.successRequests + (success ? 1 : 0),
        failedRequests: metric.failedRequests + (success ? 0 : 1),
        lastRequest: now
      };
      
      // Add to history with limit
      metric.responseHistory.push({
        timestamp: now,
        duration,
        success
      });
      
      // Limit history size
      if (metric.responseHistory.length > this.config.monitoring.performance.historyLimit) {
        metric.responseHistory = metric.responseHistory.slice(-this.config.monitoring.performance.historyLimit);
      }
    }
    
    // Check for alerts
    this.checkForPerformanceAlert(endpoint, duration);
    
    // Store updated metric
    this.metrics.set(endpoint, metric);
    
    // Publish updated metrics list
    this.publishMetrics();
    
    // Update system-wide metrics
    this.updateSystemMetrics();
  }
  
  /**
   * Checks whether performance warrants an alert
   */
  private checkForPerformanceAlert(endpoint: string, duration: number): void {
    const config = this.config.monitoring.performance;
    let alertType: 'warning' | 'critical' | null = null;
    let threshold = 0;
    
    if (duration > config.criticalLatencyThresholdMs) {
      alertType = 'critical';
      threshold = config.criticalLatencyThresholdMs;
    } else if (duration > config.highLatencyThresholdMs) {
      alertType = 'warning';
      threshold = config.highLatencyThresholdMs;
    }
    
    if (alertType) {
      const alert: PerformanceAlert = {
        timestamp: new Date(),
        endpoint,
        duration,
        threshold,
        type: alertType,
        message: `Endpoint "${endpoint}" response time (${duration}ms) exceeded ${threshold}ms threshold`
      };
      
      // Add alert to list
      this.alerts.unshift(alert);
      
      // Limit alerts size
      if (this.alerts.length > this.config.monitoring.performance.alertsLimit) {
        this.alerts = this.alerts.slice(0, this.config.monitoring.performance.alertsLimit);
      }
      
      // Publish alerts
      this.alertsSubject.next([...this.alerts]);
      
      // Report to analytics if critical
      if (alertType === 'critical') {
        this.analyticsService.trackEvent(
          'performance_alert',
          'Performance',
          'Critical Alert',
          endpoint,
          duration
        );
      }
    }
  }
  
  /**
   * Updates overall system metrics
   */
  private updateSystemMetrics(): void {
    const metricsList = Array.from(this.metrics.values());
    
    if (metricsList.length === 0) return;
    
    // Calculate average response time across all endpoints
    const totalRequests = metricsList.reduce((sum, metric) => sum + metric.totalRequests, 0);
    const weightedResponseTime = metricsList.reduce(
      (sum, metric) => sum + (metric.avgResponseTime * metric.totalRequests), 
      0
    );
    const avgResponseTime = totalRequests > 0 ? weightedResponseTime / totalRequests : 0;
    
    // Calculate error rate
    const totalFailedRequests = metricsList.reduce((sum, metric) => sum + metric.failedRequests, 0);
    const errorRate = totalRequests > 0 ? (totalFailedRequests / totalRequests) * 100 : 0;
    
    // Update system metrics
    this.systemMetricsSubject.next({
      responseTimeAvg: avgResponseTime,
      errorRate
    });
  }
  
  /**
   * Records Web Vitals metrics
   */
  recordWebVital(metric: WebVitalMetric): void {
    if (!this.config.monitoring.enabled) return;
    
    // Get current metrics
    const currentMetrics = this.webVitalsSubject.value;
    
    // Add new metric
    currentMetrics.push(metric);
    
    // Limit size if needed
    if (currentMetrics.length > 100) {
      currentMetrics.shift();
    }
    
    // Publish updated metrics
    this.webVitalsSubject.next([...currentMetrics]);
    
    // Report to analytics if poor
    if (metric.rating === 'poor') {
      this.analyticsService.trackEvent(
        'web_vital_poor',
        'Performance',
        'Poor Web Vital',
        metric.name,
        metric.value
      );
    }
  }
  
  /**
   * Clears all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.alerts = [];
    this.publishMetrics();
    this.alertsSubject.next([]);
    this.systemMetricsSubject.next({
      responseTimeAvg: 0,
      errorRate: 0
    });
    this.webVitalsSubject.next([]);
  }
  
  /**
   * Gets the count of high latency endpoints
   */
  getHighLatencyCount(): number {
    let count = 0;
    this.metrics.forEach(metric => {
      if (metric.avgResponseTime > this.config.monitoring.performance.highLatencyThresholdMs) {
        count++;
      }
    });
    return count;
  }
  
  /**
   * Gets all metrics
   */
  getMetrics(): Observable<EndpointMetric[]> {
    return this.metricsSubject.asObservable();
  }
  
  /**
   * Gets all alerts
   */
  getAlerts(): Observable<PerformanceAlert[]> {
    return this.alertsSubject.asObservable();
  }
  
  /**
   * Gets system metrics
   */
  getSystemMetrics(): Observable<SystemMetrics> {
    return this.systemMetricsSubject.asObservable();
  }
  
  /**
   * Gets Web Vitals metrics
   */
  getWebVitals(): Observable<WebVitalMetric[]> {
    return this.webVitalsSubject.asObservable();
  }
  
  /**
   * Gets configuration
   */
  getConfig(): any {
    return this.config;
  }
  
  /**
   * Starts collecting metrics periodically from the server
   */
   private startPeriodicMetricsCollection(): void {
    // Poll metrics from server every 30 seconds
    timer(0, 300000).pipe(
      switchMap(() => this.fetchServerMetrics())
    ).subscribe({
      next: (serverMetrics) => {
        if (serverMetrics) {
          this.mergeServerMetrics(serverMetrics);
        }
      },
      error: (err) => {
        console.error('Error fetching server metrics:', err);
      }
    });
  }
  
  /**
   * Fetches metrics from server
   */
  private fetchServerMetrics(): Observable<any> {
    // Eğer üretim ortamında değilsek veya monitoring etkin değilse mock veri döndür
    if (!this.config.monitoring.enabled || environment.production === false) {
      return of(this.generateMockServerMetrics());
    }
    
    // Request limit sonrası backoff stratejisi uygulayalım
    // Son 429 hatasından sonra en az 1 dakika bekleyelim
    const now = Date.now();
    if (this.lastRateLimitError && (now - this.lastRateLimitError) < 60000) {
      console.log('Skipping metrics request due to recent rate limit error');
      return of(this.generateMockServerMetrics());
    }
    
    const requestParams: Partial<RequestParameters> = {
      controller: "metrics"
    };
    
    return this.httpClientService.get<any>(requestParams).pipe(
      catchError((err) => {
        console.error('Error fetching server metrics:', err);
        if (err.status === 429) {
          this.lastRateLimitError = Date.now();
        }
        return of(this.generateMockServerMetrics());
      })
    );
  }
  
  /**
   * Merges server metrics with client-side metrics
   */
  private mergeServerMetrics(serverMetrics: any): void {
    // Server might return CPU, memory usage, active users, etc.
    if (serverMetrics.systemMetrics) {
      const currentMetrics = this.systemMetricsSubject.value;
      this.systemMetricsSubject.next({
        ...currentMetrics,
        cpuUsage: serverMetrics.systemMetrics.cpuUsage,
        memoryUsage: serverMetrics.systemMetrics.memoryUsage,
        activeUsers: serverMetrics.systemMetrics.activeUsers
      });
    }
    
    // Server might also return endpoint metrics
    if (serverMetrics.endpoints && Array.isArray(serverMetrics.endpoints)) {
      serverMetrics.endpoints.forEach((endpoint: any) => {
        if (endpoint.path && endpoint.avgResponseTime) {
          const existingMetric = this.metrics.get(endpoint.path);
          
          // If we have client-side data, merge it; otherwise just use server data
          if (existingMetric) {
            // Weighted average for response times
            const totalReqs = existingMetric.totalRequests + endpoint.totalRequests;
            const avgTime = totalReqs > 0 ? 
              ((existingMetric.avgResponseTime * existingMetric.totalRequests) + 
              (endpoint.avgResponseTime * endpoint.totalRequests)) / totalReqs : 0;
            
            this.metrics.set(endpoint.path, {
              ...existingMetric,
              avgResponseTime: avgTime,
              totalRequests: totalReqs,
              successRequests: existingMetric.successRequests + endpoint.successRequests,
              failedRequests: existingMetric.failedRequests + endpoint.failedRequests
            });
          } else {
            // Create new metric from server data
            this.metrics.set(endpoint.path, {
              endpoint: endpoint.path,
              avgResponseTime: endpoint.avgResponseTime,
              minResponseTime: endpoint.minResponseTime || endpoint.avgResponseTime,
              maxResponseTime: endpoint.maxResponseTime || endpoint.avgResponseTime,
              lastResponseTime: endpoint.lastResponseTime || endpoint.avgResponseTime,
              totalRequests: endpoint.totalRequests || 1,
              successRequests: endpoint.successRequests || (endpoint.errorRate ? Math.floor((1 - endpoint.errorRate) * endpoint.totalRequests) : 1),
              failedRequests: endpoint.failedRequests || (endpoint.errorRate ? Math.ceil(endpoint.errorRate * endpoint.totalRequests) : 0),
              lastRequest: new Date(endpoint.lastRequest || Date.now()),
              responseHistory: endpoint.responseHistory || [{
                timestamp: new Date(),
                duration: endpoint.avgResponseTime,
                success: true
              }]
            });
          }
        }
      });
      
      // Publish updated metrics
      this.publishMetrics();
    }
  }
  
  /**
   * Generates mock metrics for testing
   */
  private generateMockServerMetrics(): any {
    return {
      systemMetrics: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        activeUsers: Math.floor(Math.random() * 100)
      },
      endpoints: [
        {
          path: '/api/products',
          avgResponseTime: 120 + Math.random() * 100,
          minResponseTime: 80,
          maxResponseTime: 250,
          totalRequests: 120,
          errorRate: 0.01,
          lastRequest: new Date().toISOString()
        },
        {
          path: '/api/categories',
          avgResponseTime: 80 + Math.random() * 50,
          minResponseTime: 50,
          maxResponseTime: 150,
          totalRequests: 85,
          errorRate: 0.005,
          lastRequest: new Date().toISOString()
        },
        {
          path: '/api/brands',
          avgResponseTime: 95 + Math.random() * 70,
          minResponseTime: 60,
          maxResponseTime: 180,
          totalRequests: 65,
          errorRate: 0.01,
          lastRequest: new Date().toISOString()
        },
        {
          path: '/api/orders',
          avgResponseTime: 200 + Math.random() * 150,
          minResponseTime: 150,
          maxResponseTime: 450,
          totalRequests: 45,
          errorRate: 0.02,
          lastRequest: new Date().toISOString()
        },
        {
          path: '/api/users',
          avgResponseTime: 110 + Math.random() * 90,
          minResponseTime: 70,
          maxResponseTime: 220,
          totalRequests: 35,
          errorRate: 0.02,
          lastRequest: new Date().toISOString()
        }
      ]
    };
  }
  
  /**
   * Publishes metrics to subscribers
   */
  private publishMetrics(): void {
    const metricsList = Array.from(this.metrics.values()).sort((a, b) => {
      // Sort by response time descending
      return b.avgResponseTime - a.avgResponseTime;
    });
    
    this.metricsSubject.next(metricsList);
  }
}