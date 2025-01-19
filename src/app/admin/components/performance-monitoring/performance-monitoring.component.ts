import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceMonitorService } from 'src/app/services/common/performance-monitor.service';
import { interval, Subscription } from 'rxjs';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  registerables 
} from 'chart.js';

// Tüm gerekli modülleri kaydet
Chart.register(...registerables);

interface EndpointMetric {
  endpoint: string;
  avgResponseTime: number;
  lastRequest: Date;
}

@Component({
  selector: 'app-performance-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance-monitoring.component.html',
  styleUrls: ['./performance-monitoring.component.scss']
})
export class PerformanceMonitoringComponent implements OnInit, OnDestroy {
  private chart: Chart | null = null;
  private updateSubscription: Subscription | null = null;
  
  averageResponseTime: number = 0;
  highLatencyCount: number = 0;
  endpointCount: number = 0;
  endpointMetrics: EndpointMetric[] = [];

  constructor(private performanceMonitor: PerformanceMonitorService) {}

  ngOnInit() {
    this.initializeChart();
    this.updateMetrics();
    
    // Her 10 saniyede bir metrikleri güncelle
    this.updateSubscription = interval(10000).subscribe(() => {
      this.updateMetrics();
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  private initializeChart() {
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!ctx) return;

    const data: ChartData = {
      labels: [],
      datasets: [{
        label: 'Ortalama Yanıt Süresi (ms)',
        data: [],
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.1,
        fill: false
      }]
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: data,
      options: options
    };

    this.chart = new Chart(ctx, config);
  }

  private updateMetrics() {
    let totalResponseTime = 0;
    let endpointCount = 0;
    let highLatencyCount = 0;
    const endpoints: EndpointMetric[] = [];

    // Her endpoint için metrikleri topla
    this.performanceMonitor['metrics'].forEach((durations: number[], endpoint: string) => {
      const avgTime = this.performanceMonitor.getAverageResponseTime(endpoint);
      totalResponseTime += avgTime;
      endpointCount++;

      if (avgTime > this.performanceMonitor['config'].monitoring.performance.criticalLatencyThresholdMs) {
        highLatencyCount++;
      }

      endpoints.push({
        endpoint,
        avgResponseTime: avgTime,
        lastRequest: new Date(),
      });
    });

    // Metrikleri güncelle
    this.averageResponseTime = endpointCount ? totalResponseTime / endpointCount : 0;
    this.highLatencyCount = highLatencyCount;
    this.endpointCount = endpointCount;
    this.endpointMetrics = endpoints;

    // Grafik verilerini güncelle
    if (this.chart && this.chart.data.datasets[0]) {
      const currentTime = new Date().toLocaleTimeString();
      
      this.chart.data.labels?.push(currentTime);
      this.chart.data.datasets[0].data.push(this.averageResponseTime);

      // Son 20 veriyi göster
      if (this.chart.data.labels && this.chart.data.labels.length > 20) {
        this.chart.data.labels.shift();
        this.chart.data.datasets[0].data.shift();
      }

      this.chart.update();
    }
  }

  getStatusClass(responseTime: number): string {
    if (responseTime > this.performanceMonitor['config'].monitoring.performance.criticalLatencyThresholdMs) {
      return 'status-critical';
    } else if (responseTime > this.performanceMonitor['config'].monitoring.performance.highLatencyThresholdMs) {
      return 'status-warning';
    }
    return 'status-good';
  }

  getStatusText(responseTime: number): string {
    if (responseTime > this.performanceMonitor['config'].monitoring.performance.criticalLatencyThresholdMs) {
      return 'Kritik';
    } else if (responseTime > this.performanceMonitor['config'].monitoring.performance.highLatencyThresholdMs) {
      return 'Uyarı';
    }
    return 'İyi';
  }
}