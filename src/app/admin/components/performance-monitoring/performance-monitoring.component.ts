import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { Chart, ChartConfiguration, ChartData, ChartOptions, registerables } from 'chart.js';
import { EndpointMetric, PerformanceAlert, PerformanceMonitorService, WebVitalMetric, SystemMetrics } from 'src/app/services/common/performance-monitor.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { SitemapMonitoringComponent } from '../sitemap-monitoring/sitemap-monitoring.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

Chart.register(...registerables);

@Component({
  selector: 'app-performance-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SitemapMonitoringComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule
  ],
  templateUrl: './performance-monitoring.component.html',
  styleUrls: ['./performance-monitoring.component.scss']
})
export class PerformanceMonitoringComponent implements OnInit, OnDestroy {
  private chart: Chart | null = null;
  private webVitalsChart: Chart | null = null;
  private updateSubscription: Subscription | null = null;
  private metricsSubscription: Subscription | null = null;
  private alertsSubscription: Subscription | null = null;
  private systemMetricsSubscription: Subscription | null = null;
  private webVitalsSubscription: Subscription | null = null;
  
  averageResponseTime: number = 0;
  highLatencyCount: number = 0;
  endpointCount: number = 0;
  errorRate: number = 0;
  cpuUsage: number = 0;
  memoryUsage: number = 0;
  activeUsers: number = 0;
  
  endpointMetrics: EndpointMetric[] = [];
  filteredMetrics: EndpointMetric[] = [];
  recentAlerts: PerformanceAlert[] = [];
  webVitals: WebVitalMetric[] = [];
  
  searchTerm: string = '';
  selectedTimeRange: string = '5min'; // Default time range
  showOnlyProblematic: boolean = false;
  sortBy: string = 'responseTime'; // Default sorting
  sortDirection: 'asc' | 'desc' = 'desc'; // Default sort direction

  constructor(
    private performanceMonitor: PerformanceMonitorService,
    private jwtHelper: JwtHelperService
  ) {}

  ngOnInit() {
    // Admin kontrolü
    if (!this.isAdmin()) {
      console.warn('User does not have admin privileges');
      return;
    }

    this.initializeCharts();
    
    // Endpoint metrikleri takibi
    this.metricsSubscription = this.performanceMonitor.getMetrics()
      .subscribe(metrics => {
        if (metrics && metrics.length > 0) {
          this.endpointMetrics = metrics;
          this.applyFilters(); // Filtreleri uygula
          this.updateDashboardMetrics();
          this.updateResponseTimeChart();
        }
      });

    // Performans uyarıları takibi
    this.alertsSubscription = this.performanceMonitor.getAlerts()
      .subscribe(alerts => {
        this.recentAlerts = alerts.slice(0, 8); // Son 8 uyarıyı göster
      });
      
    // Sistem metrikleri takibi
    this.systemMetricsSubscription = this.performanceMonitor.getSystemMetrics()
      .subscribe((metrics: SystemMetrics) => {
        this.errorRate = metrics.errorRate;
        this.cpuUsage = metrics.cpuUsage || 0;
        this.memoryUsage = metrics.memoryUsage || 0;
        this.activeUsers = metrics.activeUsers || 0;
      });
      
    // Web Vitals takibi
    this.webVitalsSubscription = this.performanceMonitor.getWebVitals()
      .subscribe(vitals => {
        this.webVitals = vitals;
        this.updateWebVitalsChart();
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
    if (this.webVitalsChart) {
      this.webVitalsChart.destroy();
    }
    
    this.updateSubscription?.unsubscribe();
    this.metricsSubscription?.unsubscribe();
    this.alertsSubscription?.unsubscribe();
    this.systemMetricsSubscription?.unsubscribe();
    this.webVitalsSubscription?.unsubscribe();
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

  // Grafikleri başlat
  private initializeCharts() {
    this.initializeResponseTimeChart();
    this.initializeWebVitalsChart();
  }

  // Yanıt süresi grafiği
  private initializeResponseTimeChart() {
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Cannot find performanceChart canvas element');
      return;
    }

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

  // Web Vitals grafiği
  private initializeWebVitalsChart() {
    const ctx = document.getElementById('webVitalsChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Cannot find webVitalsChart canvas element');
      return;
    }

    const data: ChartData = {
      labels: ['LCP', 'FID', 'CLS'],
      datasets: [{
        label: 'Current Values',
        data: [0, 0, 0], // Will be updated with real data
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }]
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const metricName = context.label;
              const value = context.raw as number;
              
              if (metricName === 'CLS') {
                return `Value: ${value.toFixed(3)}`;
              } else {
                return `Value: ${value.toFixed(0)} ms`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    };

    const config: ChartConfiguration = {
      type: 'bar',
      data: data,
      options: options
    };

    this.webVitalsChart = new Chart(ctx, config);
  }

  // Yanıt süresi grafiğini güncelle
  private updateResponseTimeChart() {
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
  
  // Web Vitals grafiğini güncelle
  private updateWebVitalsChart() {
    if (!this.webVitalsChart || this.webVitals.length === 0) return;
    
    // Web Vitals için son değerleri bul
    const lcpMetric = this.webVitals.find(v => v.name === 'LCP');
    const fidMetric = this.webVitals.find(v => v.name === 'FID');
    const clsMetric = this.webVitals.find(v => v.name === 'CLS');
    
    // Değerleri güncelle
    if (lcpMetric) {
      this.webVitalsChart.data.datasets[0].data[0] = lcpMetric.value;
      // LCP için renk: iyi (yeşil), geliştirilmeli (sarı), kötü (kırmızı)
      this.webVitalsChart.data.datasets[0].backgroundColor[0] = 
        lcpMetric.rating === 'good' ? 'rgba(75, 192, 192, 0.7)' :
        lcpMetric.rating === 'needs-improvement' ? 'rgba(255, 206, 86, 0.7)' : 
        'rgba(255, 99, 132, 0.7)';
      this.webVitalsChart.data.datasets[0].borderColor[0] = 
        lcpMetric.rating === 'good' ? 'rgba(75, 192, 192, 1)' :
        lcpMetric.rating === 'needs-improvement' ? 'rgba(255, 206, 86, 1)' : 
        'rgba(255, 99, 132, 1)';
    }
    
    if (fidMetric) {
      this.webVitalsChart.data.datasets[0].data[1] = fidMetric.value;
      // FID için renk
      this.webVitalsChart.data.datasets[0].backgroundColor[1] = 
        fidMetric.rating === 'good' ? 'rgba(75, 192, 192, 0.7)' :
        fidMetric.rating === 'needs-improvement' ? 'rgba(255, 206, 86, 0.7)' : 
        'rgba(255, 99, 132, 0.7)';
      this.webVitalsChart.data.datasets[0].borderColor[1] = 
        fidMetric.rating === 'good' ? 'rgba(75, 192, 192, 1)' :
        fidMetric.rating === 'needs-improvement' ? 'rgba(255, 206, 86, 1)' : 
        'rgba(255, 99, 132, 1)';
    }
    
    if (clsMetric) {
      this.webVitalsChart.data.datasets[0].data[2] = clsMetric.value;
      // CLS için renk
      this.webVitalsChart.data.datasets[0].backgroundColor[2] = 
        clsMetric.rating === 'good' ? 'rgba(75, 192, 192, 0.7)' :
        clsMetric.rating === 'needs-improvement' ? 'rgba(255, 206, 86, 0.7)' : 
        'rgba(255, 99, 132, 0.7)';
      this.webVitalsChart.data.datasets[0].borderColor[2] = 
        clsMetric.rating === 'good' ? 'rgba(75, 192, 192, 1)' :
        clsMetric.rating === 'needs-improvement' ? 'rgba(255, 206, 86, 1)' : 
        'rgba(255, 99, 132, 1)';
    }
    
    this.webVitalsChart.update();
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
  
  // Web Vital durumunu belirle
  getWebVitalStatus(name: string, value: number): string {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 }
    };
    
    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'status-warning';
    
    if (value <= threshold.good) return 'status-good';
    if (value <= threshold.poor) return 'status-warning';
    return 'status-critical';
  }

  // Metrik bilgisini temizle
  clearMetrics(): void {
    this.performanceMonitor.clearMetrics();
  }

  // Arama fonksiyonu
  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilters();
  }

  // Sıralama fonksiyonu
  sortMetrics(field: string): void {
    if (this.sortBy === field) {
      // Aynı alana göre sıralama yapılıyorsa yönü değiştir
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Yeni alan seçildiğinde varsayılan sıralama yönü
      this.sortBy = field;
      this.sortDirection = 'desc';
    }
    
    this.applyFilters();
  }
  
  // Sadece sorunlu endpointleri gösterme
  toggleProblematicOnly(event: Event): void {
    this.showOnlyProblematic = (event.target as HTMLInputElement).checked;
    this.applyFilters();
  }

  // Filtreleri uygula (arama, sıralama, sorunlu gösterme)
  private applyFilters(): void {
    let filtered = [...this.endpointMetrics];
    
    // Arama filtresi
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(metric => 
        metric.endpoint.toLowerCase().includes(this.searchTerm)
      );
    }
    
    // Sadece sorunlu endpointler
    if (this.showOnlyProblematic) {
      const config = this.performanceMonitor.getConfig().monitoring.performance;
      filtered = filtered.filter(metric => 
        metric.avgResponseTime > config.highLatencyThresholdMs
      );
    }
    
    // Sıralama
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'endpoint':
          comparison = a.endpoint.localeCompare(b.endpoint);
          break;
        case 'responseTime':
          comparison = a.avgResponseTime - b.avgResponseTime;
          break;
        case 'requests':
          comparison = a.totalRequests - b.totalRequests;
          break;
        case 'lastRequest':
          comparison = a.lastRequest.getTime() - b.lastRequest.getTime();
          break;
        default:
          comparison = a.avgResponseTime - b.avgResponseTime;
      }
      
      // Sıralama yönünü uygula
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    this.filteredMetrics = filtered;
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
  
  // Sıralama yönü gösterge ikonu
  getSortIcon(field: string): string {
    if (this.sortBy !== field) {
      return 'bi-arrow-down-up'; // Sıralama yok
    }
    
    return this.sortDirection === 'asc' 
      ? 'bi-arrow-up' // Artan sıralama
      : 'bi-arrow-down'; // Azalan sıralama
  }
  
  // Web Vital'ın insan tarafından okunabilir adını döndür
  getWebVitalName(name: string): string {
    const names = {
      'LCP': 'Largest Contentful Paint',
      'FID': 'First Input Delay',
      'CLS': 'Cumulative Layout Shift'
    };
    
    return names[name as keyof typeof names] || name;
  }
  
  // İlgili endpoint detaylarını göster/gizle
  toggleEndpointDetails(endpoint: string): void {
    // Bu özellik geliştirilebilir - tıklanan endpoint'in detaylarını göstermek için
    console.log(`Toggling details for: ${endpoint}`);
    // Burada modal açılabilir veya açılıp/kapanabilen bir panel gösterilebilir
  }
  
  // Metrik bilgilerini dışa aktar
  exportMetricsData(): void {
    try {
      const dataStr = JSON.stringify(this.endpointMetrics, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `performance-metrics-${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting metrics data:', error);
    }
  }
  
  // Metrikleri manuel olarak yenile
  refreshMetrics(): void {
    // Bu metod, performans monitor servisindeki metrikleri manuel olarak yenilemek için kullanılabilir
    console.log('Manually refreshing metrics');
    this.updateDashboardMetrics();
    this.updateResponseTimeChart();
    this.updateWebVitalsChart();
  }
}