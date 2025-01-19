import { Injectable } from '@angular/core';
import { SecurityConfig, DEFAULT_SECURITY_CONFIG } from '../../config/security.config';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private readonly config: SecurityConfig;
  private metrics: Map<string, number[]> = new Map();

  constructor(private toastrService: CustomToastrService) {
    this.config = DEFAULT_SECURITY_CONFIG;
  }

  startMeasurement(endpoint: string): number {
    return Date.now();
  }

  endMeasurement(endpoint: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.recordMetric(endpoint, duration);

    // Yüksek gecikme uyarıları
    if (duration > this.config.monitoring.performance.criticalLatencyThresholdMs) {
      this.toastrService.message(
        `Yüksek gecikme tespit edildi: ${duration}ms`,
        "Performans Uyarısı",
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
    }
  }

  private recordMetric(endpoint: string, duration: number): void {
    const metrics = this.metrics.get(endpoint) || [];
    metrics.push(duration);
    
    // Son 100 metriği tut
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    this.metrics.set(endpoint, metrics);
  }

  getAverageResponseTime(endpoint: string): number {
    const metrics = this.metrics.get(endpoint);
    if (!metrics || metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, val) => acc + val, 0);
    return sum / metrics.length;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}