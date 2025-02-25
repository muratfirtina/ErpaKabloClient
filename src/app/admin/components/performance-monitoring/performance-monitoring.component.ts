import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { interval, Subscription } from 'rxjs';
import { Chart, ChartConfiguration, ChartData, ChartOptions, registerables } from 'chart.js';
import { AuthService } from 'src/app/services/common/auth.service';
import { EndpointMetric, PerformanceMonitorService } from 'src/app/services/common/performance-monitor.service';


Chart.register(...registerables);

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
  private metricsSubscription: Subscription | null = null;
  
  averageResponseTime: number = 0;
  highLatencyCount: number = 0;
  endpointCount: number = 0;
  endpointMetrics: EndpointMetric[] = [];
  searchTerm: string = '';

  constructor(
    private performanceMonitor: PerformanceMonitorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Admin kontrolü
    if (!this.authService.hasRole('Admin')) {
      return;
    }

    this.initializeChart();
    
    // Metrikleri takip et
    this.metricsSubscription = this.performanceMonitor.getMetrics()
      .subscribe(metrics => {
        this.endpointMetrics = metrics;
        this.updateDashboardMetrics();
        this.updateChart();
      });

    // Her 10 saniyede bir güncelle
    this.updateSubscription = interval(10000).subscribe(() => {
      this.updateDashboardMetrics();
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.updateSubscription?.unsubscribe();
    this.metricsSubscription?.unsubscribe();
  }

  private updateDashboardMetrics() {
    if (this.endpointMetrics.length === 0) return;

    this.endpointCount = this.endpointMetrics.length;
    this.highLatencyCount = this.performanceMonitor.getHighLatencyCount();
    this.averageResponseTime = this.endpointMetrics.reduce(
      (sum, metric) => sum + metric.avgResponseTime, 0
    ) / this.endpointMetrics.length;
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

  private updateChart() {
    if (!this.chart || !this.chart.data.datasets[0]) return;

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

  getStatusClass(responseTime: number): string {
    const config = this.performanceMonitor.getConfig().monitoring.performance;
    
    if (responseTime > config.criticalLatencyThresholdMs) {
      return 'status-critical';
    } else if (responseTime > config.highLatencyThresholdMs) {
      return 'status-warning';
    }
    return 'status-good';
  }

  getStatusText(responseTime: number): string {
    const config = this.performanceMonitor.getConfig().monitoring.performance;
    
    if (responseTime > config.criticalLatencyThresholdMs) {
      return 'Kritik';
    } else if (responseTime > config.highLatencyThresholdMs) {
      return 'Uyarı';
    }
    return 'İyi';
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    // Implementasyon eklenebilir
  }
}