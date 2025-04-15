import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VisitorStats, VisitorTrackingService, VisitorSessionData } from 'src/app/services/common/visitor-tracking.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { TimeAgoPipe } from 'src/app/pipes/time-ago.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-visitor-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatProgressBarModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    TimeAgoPipe,
  ],
  templateUrl: './visitor-tracking.component.html',
  styleUrls: ['./visitor-tracking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class VisitorTrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  visitorStats: VisitorStats | null = null;
  dataSource = new MatTableDataSource<VisitorSessionData>([]);
  displayedColumns: string[] = ['user', 'currentPage', 'ipAddress', 'connectedAt', 'lastActivityAt'];
  isLoading = true;
  connectionStatus = false;
  filterValue = '';
  
  // Debugging fields
  lastUpdated: Date = new Date();
  debugInfo: string = '';

  private destroy$ = new Subject<void>();

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
      private visitorTrackingService: VisitorTrackingService,
      private cdRef: ChangeDetectorRef
    ) {}

  ngOnInit(): void {
    console.log("VisitorTrackingComponent: Bileşen başlatılıyor");
    this.isLoading = true;
    
    // Ziyaretçi istatistiklerine abone ol - DÜZELTME: değişiklik algılama iyileştirildi
    this.visitorTrackingService.visitorStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        console.log("VisitorTrackingComponent: İstatistikler alındı:", stats);
        this.lastUpdated = new Date();
        
        // Debug veriyi ekle
        if (stats) {
          this.debugInfo = `Toplam: ${stats.totalVisitors}, Aktif: ${stats.activeVisitors?.length || 0}, Sayfa İstatistikleri: ${stats.pageStats?.length || 0}`;
          console.log("activeVisitors mevcut mu:", !!stats.activeVisitors);
          console.log("activeVisitors uzunluğu:", stats.activeVisitors?.length || 0);
        } else {
          this.debugInfo = 'Stats null';
        }
        
        // Veri yapısını güvence altına al
        if (stats && !stats.activeVisitors) {
          console.warn("VisitorStats alındı ama activeVisitors eksik, düzeltiliyor");
          const fixedStats = {
            ...stats,
            activeVisitors: [],
            pageStats: stats.pageStats || []
          };
          this.visitorStats = fixedStats;
          this.dataSource.data = [];
        } else {
          this.visitorStats = stats;
          this.dataSource.data = stats?.activeVisitors || [];
        }
        
        // Yükleme durumunu güncelle
        this.isLoading = !this.connectionStatus && !stats;
        
        // OnPush değişiklik algılama için detectChanges (daha güçlü zorlama)
        this.cdRef.detectChanges();
      });

    // Bağlantı durumuna abone ol - DÜZELTME: daha iyi durum yönetimi
    this.visitorTrackingService.connectionEstablished$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        console.log("VisitorTrackingComponent: Bağlantı durumu değişti:", status);
        
        if (this.connectionStatus !== status) {
          this.connectionStatus = status;
          
          // Bağlantı değişikliğinde yükleme durumunu güncelle
          if (status) {
            // Bağlantı kurulduğunda, veri henüz gelmemişse (5 saniye sonra) yükleniyor göster
            setTimeout(() => {
              if (!this.visitorStats) {
                this.isLoading = true;
                this.cdRef.detectChanges();
              }
            }, 5000);
          } else {
            // Bağlantı koptuğunda, yükleme durumunu güncelle
            this.isLoading = !this.visitorStats;
          }
          
          this.cdRef.detectChanges();
        }
      });

    // Bağlantıyı başlat
    console.log("VisitorTrackingComponent: SignalR bağlantısı başlatılıyor");
    this.visitorTrackingService.initialize().catch(err => {
      console.error("VisitorTrackingComponent: Bağlantı hatası:", err);
      this.isLoading = false;
      this.connectionStatus = false;
      this.cdRef.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.filterPredicate;
    // Tabloyu güncelle
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Manuel yeniden bağlanma metodu ekleyerek kullanıcıya kontrol sağlar
  manualReconnect(): void {
    console.log("Manuel yeniden bağlanma istendi");
    this.isLoading = true;
    this.cdRef.detectChanges();
    
    this.visitorTrackingService.reconnect().catch(err => {
      console.error("Manuel yeniden bağlanma hatası:", err);
      this.isLoading = false;
      this.cdRef.detectChanges();
    });
  }

  filterPredicate(data: VisitorSessionData, filter: string): boolean {
    const searchString = filter.toLowerCase().trim();
    if (!searchString) return true;

    const username = (data.username || 'Anonim').toLowerCase();
    const ipAddress = data.ipAddress.toLowerCase();
    const currentPage = data.currentPage.toLowerCase();

    return username.includes(searchString) ||
           ipAddress.includes(searchString) ||
           currentPage.includes(searchString);
  }

  applyFilter(event: Event | string): void {
    let value = '';
    if (typeof event === 'string') {
      value = event;
    } else {
      value = (event.target as HTMLInputElement).value;
    }
    this.filterValue = value.trim().toLowerCase();
    this.dataSource.filter = this.filterValue;
    this.cdRef.detectChanges();
  }

  clearFilter(input: HTMLInputElement): void {
    input.value = '';
    this.applyFilter('');
  }

  getPageStatPercentage(count: number): number {
    const total = this.visitorStats?.totalVisitors;
    if (!total || total === 0) {
      return 0;
    }
    return Math.min((count / total) * 100, 100);
  }

  trackByVisitorId(index: number, visitor: VisitorSessionData): string {
    return visitor.id;
  }
  
  trackByPageStat(index: number, pageStat: { page: string, count: number }): string {
    return pageStat.page;
  }

  // Debug için - son güncelleme zamanını göster
  getLastUpdatedTimeString(): string {
    return this.lastUpdated.toLocaleTimeString();
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      console.error('Tarih formatlanırken hata:', e);
      return dateStr?.toString() || '-';
    }
  }
  
  // Tabloyu güncellemek için ek yöntem
  refreshTable() {
    if (this.visitorStats?.activeVisitors) {
      console.log('Tablodaki veri sayısı:', this.visitorStats.activeVisitors.length);
      console.log('Örnek veri:', this.visitorStats.activeVisitors[0]);
    }
    this.dataSource.data = this.visitorStats?.activeVisitors || [];
    this.cdRef.detectChanges();
  }
}