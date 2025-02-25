import { Injectable } from '@angular/core';
import { SecurityConfig, DEFAULT_SECURITY_CONFIG } from '../../config/security.config';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface PerformanceAlert {
  endpoint: string;
  duration: number;
  timestamp: Date;
  type: 'warning' | 'critical';
}

export interface EndpointMetric {
  endpoint: string;
  avgResponseTime: number;
  lastRequest: Date;
  responseHistory: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private readonly config: SecurityConfig;
  private metrics: Map<string, number[]> = new Map();
  private alertsSubject = new BehaviorSubject<PerformanceAlert[]>([]);
  private metricsSubject = new BehaviorSubject<EndpointMetric[]>([]);
  private alerts: PerformanceAlert[] = [];

  constructor(
    private toastrService: CustomToastrService,
    private authService: AuthService
  ) {
    this.config = DEFAULT_SECURITY_CONFIG;
  }

  startMeasurement(endpoint: string): number {
    return Date.now();
  }

  endMeasurement(endpoint: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.recordMetric(endpoint, duration);

    if (duration > this.config.monitoring.performance.criticalLatencyThresholdMs) {
      this.createAlert(endpoint, duration, 'critical');
    } else if (duration > this.config.monitoring.performance.highLatencyThresholdMs) {
      this.createAlert(endpoint, duration, 'warning');
    }

    this.updateMetrics();
  }

  private createAlert(endpoint: string, duration: number, type: 'warning' | 'critical') {
    const alert: PerformanceAlert = {
      endpoint,
      duration,
      timestamp: new Date(),
      type
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 100) {
      this.alerts.pop();
    }
    this.alertsSubject.next(this.alerts);

    // Sadece admin rolüne sahip kullanıcılara toastr göster
    if (this.authService.hasRole('Admin')) {
      this.toastrService.message(
        `Yüksek gecikme tespit edildi: ${duration}ms - ${endpoint}`,
        "Performans Uyarısı",
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
    }
  }

  private updateMetrics() {
    const currentMetrics: EndpointMetric[] = [];
    
    this.metrics.forEach((durations, endpoint) => {
      currentMetrics.push({
        endpoint,
        avgResponseTime: this.calculateAverage(durations),
        lastRequest: new Date(),
        responseHistory: [...durations]
      });
    });

    this.metricsSubject.next(currentMetrics);
  }

  private calculateAverage(numbers: number[]): number {
    if (!numbers.length) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  getAlerts(): Observable<PerformanceAlert[]> {
    return this.alertsSubject.asObservable();
  }

  getMetrics(): Observable<EndpointMetric[]> {
    return this.metricsSubject.asObservable();
  }

  getHighLatencyCount(): number {
    let count = 0;
    this.metrics.forEach(durations => {
      const avg = this.calculateAverage(durations);
      if (avg > this.config.monitoring.performance.criticalLatencyThresholdMs) {
        count++;
      }
    });
    return count;
  }

  private recordMetric(endpoint: string, duration: number): void {
    const metrics = this.metrics.get(endpoint) || [];
    metrics.push(duration);
    
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    this.metrics.set(endpoint, metrics);
  }

  getConfig(): SecurityConfig {
    return this.config;
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.alerts = [];
    this.alertsSubject.next([]);
    this.metricsSubject.next([]);
  }
}