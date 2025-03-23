import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { interval, Subscription } from 'rxjs';
import { Chart, ChartConfiguration, ChartData, ChartOptions, registerables } from 'chart.js';
import { EndpointMetric, PerformanceAlert, PerformanceMonitorService } from 'src/app/services/common/performance-monitor.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { SitemapMonitoringComponent } from '../sitemap-monitoring/sitemap-monitoring.component';

Chart.register(...registerables);

@Component({
  selector: 'app-performance-monitoring',
  standalone: true,
  imports: [CommonModule,SitemapMonitoringComponent],
  templateUrl: './performance-monitoring.component.html',
  styleUrls: ['./performance-monitoring.component.scss']
})
export class PerformanceMonitoringComponent implements OnInit, OnDestroy {
  private chart: Chart | null = null;
  private updateSubscription: Subscription | null = null;
  private metricsSubscription: Subscription | null = null;
  private alertsSubscription: Subscription | null = null;
  
  averageResponseTime: number = 0;
  highLatencyCount: number = 0;
  endpointCount: number = 0;
  endpointMetrics: EndpointMetric[] = [];
  filteredMetrics: EndpointMetric[] = [];
  recentAlerts: PerformanceAlert[] = [];
  searchTerm: string = '';
  selectedTimeRange: string = '5min'; // Default time range

  constructor(
    private performanceMonitor: PerformanceMonitorService,
    private jwtHelper: JwtHelperService
  ) {}

  ngOnInit() {
    // Admin kontrolü
    if (!this.isAdmin()) {
      return;
    }

    this.initializeChart();
    
    // Metrikleri takip et
    this.metricsSubscription = this.performanceMonitor.getMetrics()
      .subscribe(metrics => {
        this.endpointMetrics = metrics;
        this.filteredMetrics = [...metrics]; // Kopya oluştur
        this.updateDashboardMetrics();
        this.updateChart();
        
        // Arama terimi varsa filtrele
        if (this.searchTerm) {
          this.filterMetrics();
        }
      });

    // Alertleri takip et
    this.alertsSubscription = this.performanceMonitor.getAlerts()
      .subscribe(alerts => {
        this.recentAlerts = alerts.slice(0, 5); // Son 5 alert'i göster
      });

    // Her 10 saniyede bir güncelle
    this.updateSubscription = interval(10000).subscribe(() => {
      this.updateDashboardMetrics();
    });
  }

  // Admin kontrolü için JWT token'ı kullan
  private isAdmin(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const decodedToken = this.jwtHelper.decodeToken(token);
      const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      if (typeof roles === 'string') {
        return roles === 'Admin';
      } else if (Array.isArray(roles)) {
        return roles.includes('Admin');
      }
      
      return false;
    } catch {
      return false;
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.updateSubscription?.unsubscribe();
    this.metricsSubscription?.unsubscribe();
    this.alertsSubscription?.unsubscribe();
  }

  // Gösterge metriklerini güncelle
  private updateDashboardMetrics() {
    if (this.endpointMetrics.length === 0) return;

    this.endpointCount = this.endpointMetrics.length;
    this.highLatencyCount = this.performanceMonitor.getHighLatencyCount();
    this.averageResponseTime = this.endpointMetrics.reduce(
      (sum, metric) => sum + metric.avgResponseTime, 0
    ) / this.endpointMetrics.length;
  }

  // Grafik oluştur
  private initializeChart() {
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!ctx) return;

    const data: ChartData = {
      labels: [],
      datasets: [{
        label: 'Ortalama Yanıt Süresi (ms)',
        data: [],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#0d6efd'
      }]
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 12,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: 10,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          displayColors: false
        }
      },
      animation: {
        duration: 1000
      }
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: data,
      options: options
    };

    this.chart = new Chart(ctx, config);
  }

  // Grafiği güncelle
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

  // Durum sınıfını belirle
  getStatusClass(responseTime: number): string {
    const config = this.performanceMonitor.getConfig().monitoring.performance;
    
    if (responseTime > config.criticalLatencyThresholdMs) {
      return 'status-critical';
    } else if (responseTime > config.highLatencyThresholdMs) {
      return 'status-warning';
    }
    return 'status-good';
  }

  // Durum metnini belirle
  getStatusText(responseTime: number): string {
    const config = this.performanceMonitor.getConfig().monitoring.performance;
    
    if (responseTime > config.criticalLatencyThresholdMs) {
      return 'Kritik';
    } else if (responseTime > config.highLatencyThresholdMs) {
      return 'Uyarı';
    }
    return 'İyi';
  }

  // Metrik bilgisini temizle
  clearMetrics(): void {
    this.performanceMonitor.clearMetrics();
  }

  // Arama fonksiyonu
  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterMetrics();
  }

  // Metrikleri filtrele
  private filterMetrics(): void {
    if (!this.searchTerm.trim()) {
      this.filteredMetrics = [...this.endpointMetrics];
      return;
    }
    
    this.filteredMetrics = this.endpointMetrics.filter(metric => 
      metric.endpoint.toLowerCase().includes(this.searchTerm)
    );
  }

  // Zaman aralığını değiştir
  changeTimeRange(range: string): void {
    this.selectedTimeRange = range;
    // Burada zaman aralığına göre veri filtreleme işlemi yapılabilir
    // Şu an için sadece UI'da gösterilmektedir
  }

  // Alert tipine göre stil sınıfı döndür
  getAlertClass(type: string): string {
    return type === 'critical' ? 'alert-danger' : 'alert-warning';
  }
}