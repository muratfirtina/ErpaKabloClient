/* import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VisitorAnalyticsService } from '../../../services/common/visitor-analytics.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { Chart, registerables } from 'chart.js';

// Chart.js'i kaydet
Chart.register(...registerables);

// Veri sınıflarımızı tanımlayalım
interface DataSource {
  value: string;
  label: string;
}

// Bootstrap ile çalışacak veri kaynağı sınıfı
class BootstrapDataSource<T> {
  data: T[] = [];
  filteredData: T[] = [];
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  
  constructor(data: T[] = []) {
    this.data = data;
    this.filteredData = [...data];
  }
  
  filter(filterValue: string, searchableColumns: string[]): void {
    if (!filterValue) {
      this.filteredData = [...this.data];
    } else {
      const lowerCaseFilter = filterValue.toLowerCase();
      this.filteredData = this.data.filter(item => {
        return searchableColumns.some(column => {
          const value = (item as any)[column];
          return value && String(value).toLowerCase().includes(lowerCaseFilter);
        });
      });
    }
  }
  
  sort(column: string): void {
    if (this.sortColumn === column) {
      // Aynı sütun üzerinde tekrar tıklanınca sıralama yönünü değiştir
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Yeni sütun üzerinde tıklanınca, sıralama yönünü sıfırla
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Sıralama işlemi
    this.filteredData.sort((a, b) => {
      const valueA = (a as any)[column];
      const valueB = (b as any)[column];
      
      if (valueA === valueB) return 0;
      
      const comparison = valueA < valueB ? -1 : 1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
}

@Component({
  selector: 'app-visitor-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TimeAgoPipe,
  ],
  templateUrl: './visitor-analytics.component.html',
  styleUrls: ['./visitor-analytics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class VisitorAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Grafik için referanslar
  @ViewChild('timelineCanvas') timelineCanvas!: ElementRef<HTMLCanvasElement>;
  timelineChart: Chart | null = null;
  deviceChart: Chart | null = null;
  @ViewChild('deviceCanvas') deviceCanvas!: ElementRef<HTMLCanvasElement>;
  referrerChart: Chart | null = null;
  @ViewChild('referrerCanvas') referrerCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Veri kaynakları
  analyticsData: any = null;
  referrerData: any[] = [];
  referrerDataSource = new BootstrapDataSource<any>([]);
  pageViewsDataSource = new BootstrapDataSource<any>([]);
  deviceStats: any = null;
  visitorTimeline: any[] = [];
  
  // Sayfalama değişkenleri
  currentReferrerPage = 1;
  currentPageViewsPage = 1;
  itemsPerPage = 10;
  totalReferrerPages = 1;
  totalPageViewsPages = 1;
  
  // Tarih filtreleri
  dateRange: { start: any, end: any } = {
    start: this.getDateObject(new Date(new Date().setDate(new Date().getDate() - 30))), // Son 30 gün
    end: this.getDateObject(new Date())
  };
  
  // Yükleme durumları
  isLoading = {
    summary: true,
    referrers: true,
    pageViews: true,
    devices: true,
    timeline: true
  };
  
  // Tablo ayarları
  displayedReferrerColumns: string[] = ['domain', 'type', 'visitCount', 'uniqueVisitorCount'];
  displayedPageColumns: string[] = ['pageUrl', 'viewCount', 'uniqueViewerCount'];
  
  // Kaynak seçenekleri
  dataSources: DataSource[] = [
    { value: 'internal', label: 'TUMDEX Verileri' },
    { value: 'ga', label: 'Google Analytics' },
    { value: 'combined', label: 'Birleştirilmiş Veriler' }
  ];
  selectedDataSource = 'internal';
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private visitorAnalyticsService: VisitorAnalyticsService,
    private cdRef: ChangeDetectorRef,
    private datePipe: DatePipe
  ) {}
  
  ngOnInit(): void {
    this.loadAnalyticsData();
  }
  
  ngAfterViewInit(): void {
    // Bootstrap tablarını aktifleştirmek için
    this.initBootstrapTabs();
  }
  
  ngOnDestroy(): void {
    // Grafikleri temizle
    if (this.timelineChart) {
      this.timelineChart.destroy();
    }
    if (this.deviceChart) {
      this.deviceChart.destroy();
    }
    if (this.referrerChart) {
      this.referrerChart.destroy();
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  initBootstrapTabs(): void {
    // Aktif sekme değiştiğinde grafikleri yeniden boyutlandır
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', () => {
        if (this.timelineChart) this.timelineChart.resize();
        if (this.deviceChart) this.deviceChart.resize();
        if (this.referrerChart) this.referrerChart.resize();
      });
    });
  }
  
  loadAnalyticsData(): void {
    this.resetLoadingState();
    
    // Tarih formatını ayarla
    const startDate = this.formatDate(this.dateRange.start);
    const endDate = this.formatDate(this.dateRange.end);
    
    // Özet verileri yükle
    this.visitorAnalyticsService.getAnalyticsSummary(startDate, endDate, this.selectedDataSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analyticsData = data;
          this.isLoading.summary = false;
          this.cdRef.detectChanges();
          
          // Referrer grafiğini oluştur (özet verisi gelince)
          if (data?.referrerTypeBreakdown) {
            setTimeout(() => this.renderReferrerChart(data.referrerTypeBreakdown), 100);
          }
        },
        error: (err) => {
          console.error('Analiz verisi yüklenirken hata:', err);
          this.isLoading.summary = false;
          this.cdRef.detectChanges();
        }
      });
    
    // Referrer verilerini yükle
    this.visitorAnalyticsService.getTopReferrers(startDate, endDate, this.selectedDataSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.referrerData = data;
          this.referrerDataSource = new BootstrapDataSource<any>(data);
          this.totalReferrerPages = Math.ceil(data.length / this.itemsPerPage);
          this.isLoading.referrers = false;
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('Referrer verisi yüklenirken hata:', err);
          this.isLoading.referrers = false;
          this.cdRef.detectChanges();
        }
      });
    
    // Sayfa görüntüleme verilerini yükle
    this.visitorAnalyticsService.getTopPages(startDate, endDate, this.selectedDataSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pageViewsDataSource = new BootstrapDataSource<any>(data);
          this.totalPageViewsPages = Math.ceil(data.length / this.itemsPerPage);
          this.isLoading.pageViews = false;
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('Sayfa görüntüleme verisi yüklenirken hata:', err);
          this.isLoading.pageViews = false;
          this.cdRef.detectChanges();
        }
      });
    
    // Cihaz istatistiklerini yükle
    this.visitorAnalyticsService.getDeviceStats(startDate, endDate, this.selectedDataSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.deviceStats = data;
          this.isLoading.devices = false;
          this.cdRef.detectChanges();
          
          // Cihaz dağılımı grafiğini oluştur
          setTimeout(() => this.renderDeviceChart(data), 100);
        },
        error: (err) => {
          console.error('Cihaz istatistikleri yüklenirken hata:', err);
          this.isLoading.devices = false;
          this.cdRef.detectChanges();
        }
      });
    
    // Ziyaretçi zaman çizelgesi verilerini yükle
    this.visitorAnalyticsService.getVisitorTimeline(startDate, endDate, this.selectedDataSource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.visitorTimeline = data;
          this.isLoading.timeline = false;
          
          // Zaman çizelgesi grafiğini oluştur
          setTimeout(() => this.renderTimelineChart(), 100);
          
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('Ziyaretçi zaman çizelgesi yüklenirken hata:', err);
          this.isLoading.timeline = false;
          this.cdRef.detectChanges();
        }
      });
  }
  
  // Yardımcı metodlar
  private getDateObject(date: Date): any {
    // Tarayıcı input[type="date"] için string formatı (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  private formatDate(date: any): string {
    if (!date) return '';
    
    try {
      // ISO string formatına çevir (YYYY-MM-DD)
      if (typeof date === 'string') {
        // Tarih zaten string formatındaysa (input[type="date"] için)
        return date;
      } else if (date instanceof Date) {
        // Date nesnesi ise ISO formatına çevir
        return date.toISOString().split('T')[0];
      }
      
      // Diğer format türleri için
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Tarih formatı hatası:', e);
    }
    
    return '';
  }
  
  applyReferrerFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.referrerDataSource.filter(filterValue.trim().toLowerCase(), ['domain', 'type']);
    this.currentReferrerPage = 1;
    this.totalReferrerPages = Math.ceil(this.referrerDataSource.filteredData.length / this.itemsPerPage);
    this.cdRef.detectChanges();
  }
  
  applyPageFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.pageViewsDataSource.filter(filterValue.trim().toLowerCase(), ['pageUrl']);
    this.currentPageViewsPage = 1;
    this.totalPageViewsPages = Math.ceil(this.pageViewsDataSource.filteredData.length / this.itemsPerPage);
    this.cdRef.detectChanges();
  }
  
  sortTable(dataSourceName: string, column: string): void {
    if (dataSourceName === 'referrerDataSource') {
      this.referrerDataSource.sort(column);
    } else if (dataSourceName === 'pageViewsDataSource') {
      this.pageViewsDataSource.sort(column);
    }
    this.cdRef.detectChanges();
  }
  
  changePage(tableType: string, page: number): void {
    if (tableType === 'referrer') {
      this.currentReferrerPage = page;
    } else if (tableType === 'pageViews') {
      this.currentPageViewsPage = page;
    }
    this.cdRef.detectChanges();
  }
  
  getReferrerPageNumbers(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentReferrerPage - 2);
    const endPage = Math.min(this.totalReferrerPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  getPageViewsPageNumbers(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentPageViewsPage - 2);
    const endPage = Math.min(this.totalPageViewsPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  onDateRangeChange(): void {
    this.loadAnalyticsData();
  }
  
  onDataSourceChange(): void {
    this.loadAnalyticsData();
  }
  
  private resetLoadingState(): void {
    this.isLoading = {
      summary: true,
      referrers: true,
      pageViews: true,
      devices: true,
      timeline: true
    };
  }
  
  private renderTimelineChart(): void {
    // Eski grafiği temizle
    if (this.timelineChart) {
      this.timelineChart.destroy();
    }
    
    // Canvas elementi kontrol et
    if (!this.timelineCanvas || !this.visitorTimeline || this.visitorTimeline.length === 0) {
      return;
    }
    
    const ctx = this.timelineCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Veriyi formatlama
    const labels = this.visitorTimeline.map(item => {
      const date = new Date(item.date);
      return this.datePipe.transform(date, 'dd MMM') || item.date;
    });
    
    const visitData = this.visitorTimeline.map(item => item.visits || item.totalVisitors || 0);
    const newVisitorData = this.visitorTimeline.map(item => item.newVisitors || 0);
    
    // Grafik oluşturma
    this.timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Toplam Ziyaretçi',
            data: visitData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          },
          {
            label: 'Yeni Ziyaretçi',
            data: newVisitorData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            hidden: newVisitorData.every(val => val === 0) // Veri yoksa gizle
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
      }
    });
  }
  
  private renderDeviceChart(deviceData: any): void {
    // Eski grafiği temizle
    if (this.deviceChart) {
      this.deviceChart.destroy();
    }
    
    // Canvas elementi kontrol et
    if (!this.deviceCanvas || !deviceData) {
      return;
    }
    
    const ctx = this.deviceCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Veriyi formatlama
    const labels = ['Masaüstü', 'Mobil', 'Tablet'];
    const data = [
      deviceData.desktop || 0,
      deviceData.mobile || 0,
      deviceData.tablet || 0
    ];
    
    // Grafik oluşturma
    this.deviceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cihaz Dağılımı',
          data: data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(234, 88, 12, 0.8)',
            'rgba(168, 85, 247, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(234, 88, 12, 1)',
            'rgba(168, 85, 247, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  private renderReferrerChart(referrerData: any): void {
    // Eski grafiği temizle
    if (this.referrerChart) {
      this.referrerChart.destroy();
    }
    
    // Canvas elementi kontrol et
    if (!this.referrerCanvas || !referrerData) {
      return;
    }
    
    const ctx = this.referrerCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Veriyi formatlama (object to array)
    const labels = Object.keys(referrerData);
    const data = labels.map(key => referrerData[key]);
    
    // Grafik oluşturma
    this.referrerChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ziyaret Sayısı',
          data: data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(124, 58, 237, 0.8)',
            'rgba(220, 38, 38, 0.8)',
            'rgba(156, 163, 175, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `Ziyaret: ${value} (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }
  
  // Yardımcı metodlar
  getReferrerIcon(type: string): string {
    switch (type?.toLowerCase() || '') {
      case 'sosyal medya': return 'share';
      case 'arama motoru': return 'search';
      case 'doğrudan': return 'box-arrow-in-right';
      case 'e-posta': return 'envelope';
      default: return 'link';
    }
  }
  
  calculatePercentage(count: number, total: number): number {
    if (isNaN(count) || isNaN(total)) return 0;
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }

  // Tip dönüşümü için yardımcı metodlar
  getStringValue(value: any): string {
    return String(value || '');
  }

  getNumberValue(value: any): number {
    return Number(value || 0);
  }

  getReferrerClass(key: any): string {
    const str = this.getStringValue(key);
    return str.toLowerCase().replace(' ', '-');
  }
} */