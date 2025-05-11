import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { HubPaths } from 'src/app/constants/hub-paths';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

export interface VisitorSessionData {
  id: string;
  ipAddress: string;
  username: string;
  isAuthenticated: boolean;
  connectionId: string;
  connectedAt: string;
  lastActivityAt: string;
  currentPage: string;
  deviceType: string;
  browserName: string;
  referrer?: string;
  userAgent?: string;
}

export interface VisitorStats {
  totalVisitors: number;
  authenticatedVisitors: number;
  anonymousVisitors: number;
  pageStats: { page: string; count: number }[];
  referrerStats: { referrer: string; count: number }[];
  deviceStats: { device: string; count: number }[];
  browserStats: { browser: string; count: number }[];
  activeVisitors: VisitorSessionData[];
}

@Injectable({
  providedIn: 'root',
})
export class VisitorTrackingService implements OnDestroy {
  private hubConnection: HubConnection | null = null;
  private visitorStatsSubject = new BehaviorSubject<VisitorStats | null>(null);
  private connectionEstablishedSubject = new BehaviorSubject<boolean>(false);
  private connectionErrorSubject = new BehaviorSubject<string | null>(null);
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pageChangeTimeout: any = null;
  private isConnecting = false;
  private currentPage: string = '/';

  // Observable'lar
  public readonly visitorStats$ = this.visitorStatsSubject.asObservable();
  public readonly connectionEstablished$ =
    this.connectionEstablishedSubject.asObservable();
  public readonly connectionError$ = this.connectionErrorSubject.asObservable();

  constructor(private router: Router, private authService: AuthService) {
    // Sayfa değişikliklerini izle
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentPage =
          event.urlAfterRedirects.split('?')[0].split('#')[0] || '/';
        this.throttlePageChange();
      });
  }

  public async initialize(): Promise<void> {
    // Eğer zaten bağlıysa veya bağlanmaya çalışıyorsa, yeni bağlantı kurma
    if (
      this.isConnecting ||
      (this.hubConnection &&
        this.hubConnection.state === HubConnectionState.Connected)
    ) {
      return;
    }

    try {
      this.isConnecting = true;
      this.connectionErrorSubject.next(null);
      await this.createConnection();
      await this.startConnection();
      this.registerHandlers();
    } catch (err) {
      console.error(
        'SignalR bağlantısı başlatılırken hata oluştu:',
        this.formatError(err)
      );
      this.connectionErrorSubject.next(
        `Bağlantı hatası: ${this.formatError(err)}`
      );
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  public async reconnect(): Promise<void> {
    if (this.isConnecting) return;

    try {
      this.isConnecting = true;
      this.connectionErrorSubject.next(null);

      // Mevcut bağlantıyı kapat
      if (this.hubConnection) {
        await this.hubConnection.stop();
        this.hubConnection = null;
      }

      // Yeni bağlantı kur
      await this.createConnection();
      await this.startConnection();
      this.registerHandlers();

      // Bağlantı kurulduğunda sayfa bilgisini gönder
      if (this.hubConnection?.state === HubConnectionState.Connected) {
        this.notifyPageChange();
      }

      this.reconnectAttempts = 0;
    } catch (err) {
      console.error('SignalR yeniden bağlanma hatası:', this.formatError(err));
      this.connectionErrorSubject.next(
        `Yeniden bağlanma hatası: ${this.formatError(err)}`
      );
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  private createConnection(): void {
    const hubUrl = `${environment.baseUrl}${HubPaths.VisitorTrackingHub}`;
    
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.authService.getToken() || '',
        skipNegotiation: false,
        // Bağlantı zaman aşımını artır - bu sunucunun yanıt vermesi için daha fazla süre tanır
        timeout: 30000 // 30 saniye timeout (varsayılan 30 saniye)
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // İlk yeniden bağlanma çabaları arasında artan bir bekleme süresi kullan
          if (retryContext.previousRetryCount < 3) {
            return 1000 * Math.pow(2, retryContext.previousRetryCount); // 1s, 2s, 4s
          }
          // Sonraki yeniden deneme girişimleri için sabit 1 dakika bekle
          return 60000; // 60 saniye
        }
      })
      .configureLogging(LogLevel.Warning)
      .build();
      
    this.setupConnectionEvents();
  }

  private setupConnectionEvents(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting((error?: Error) => {
      console.warn(
        'SignalR yeniden bağlanıyor...',
        error ? this.formatError(error) : ''
      );
      this.connectionEstablishedSubject.next(false);
      this.connectionErrorSubject.next('Bağlantı yeniden kuruluyor...');
    });

    this.hubConnection.onreconnected(() => {
      console.log('SignalR yeniden bağlandı.');
      this.connectionEstablishedSubject.next(true);
      this.connectionErrorSubject.next(null);
      this.notifyPageChange();
    });

    this.hubConnection.onclose((error?: Error) => {
      console.log(
        'SignalR bağlantısı kapandı.',
        error ? this.formatError(error) : ''
      );
      this.connectionEstablishedSubject.next(false);
      if (error) {
        this.connectionErrorSubject.next(
          `Bağlantı hatası: ${this.formatError(error)}`
        );
      } else {
        this.connectionErrorSubject.next('Bağlantı kapandı.');
      }
    });
  }

  private async startConnection(): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('Hub bağlantısı oluşturulmadı.');
    }

    try {
      await this.hubConnection.start();
      this.connectionEstablishedSubject.next(true);
      this.reconnectAttempts = 0;
    } catch (err) {
      this.connectionEstablishedSubject.next(false);
      this.reconnectAttempts++;

      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.warn(
          `SignalR bağlantısı başlatılamadı. ${this.reconnectAttempts}. deneme...`
        );
        const retryDelay = Math.min(
          1000 * Math.pow(2, this.reconnectAttempts),
          30000
        ); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        await this.startConnection();
      } else {
        console.error('Maksimum yeniden bağlanma denemesi aşıldı.');
        throw err;
      }
    }
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    // Tekrarlanan kayıtlardan kaçınmak için mevcut handler'ları temizle
    this.hubConnection.off('ReceiveVisitorStats');
    this.hubConnection.off('ReceiveVisitorsList');

    // Ziyaretçi istatistiklerini işle - Veri uyumluluğu için format dönüşümü
    this.hubConnection.on('ReceiveVisitorStats', (stats: any) => {
      // Gelen verileri doğru şekilde dönüştür
      const formattedStats: VisitorStats = {
        totalVisitors: stats.TotalVisitors ?? stats.totalVisitors ?? 0,
        authenticatedVisitors:
          stats.AuthenticatedVisitors ?? stats.authenticatedVisitors ?? 0,
        anonymousVisitors:
          stats.AnonymousVisitors ?? stats.anonymousVisitors ?? 0,
        pageStats:
          stats.PageStats?.map((p: any) => ({
            page: p.Page ?? p.page ?? '/',
            count: p.Count ?? p.count ?? 0,
          })) ?? [],
        referrerStats:
          stats.ReferrerStats?.map((r: any) => ({
            referrer: r.Referrer ?? r.referrer ?? '',
            count: r.Count ?? r.count ?? 0,
          })) ?? [],
        deviceStats:
          stats.DeviceStats?.map((d: any) => ({
            device: d.Device ?? d.device ?? '',
            count: d.Count ?? d.count ?? 0,
          })) ?? [],
        browserStats:
          stats.BrowserStats?.map((b: any) => ({
            browser: b.Browser ?? b.browser ?? '',
            count: b.Count ?? b.count ?? 0,
          })) ?? [],
        activeVisitors:
          stats.ActiveVisitors?.map((v: any) => this.formatVisitorData(v)) ??
          [],
      };

      this.visitorStatsSubject.next(formattedStats);
    });

    // Başlangıç ziyaretçi listesini işle
    this.hubConnection.on('ReceiveVisitorsList', (visitors: any[]) => {
      if (!visitors || !Array.isArray(visitors)) {
        console.warn('Geçersiz ziyaretçi listesi alındı', visitors);
        return;
      }

      // Property isimlerini düzgün eşleştir
      const formattedVisitors = visitors.map((v) => this.formatVisitorData(v));

      // İstatistik verisi oluştur
      const total = formattedVisitors.length;
      const authenticated = formattedVisitors.filter(
        (v) => v.isAuthenticated
      ).length;
      const anonymous = total - authenticated;

      // Sayfa istatistiklerini hesapla
      const pageCounts = formattedVisitors.reduce((acc, visitor) => {
        const page = visitor.currentPage || '/';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pageStats = Object.entries(pageCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count);

      // Diğer istatistikleri oluştur
      const deviceCounts = this.calculateStats(formattedVisitors, 'deviceType');
      const browserCounts = this.calculateStats(
        formattedVisitors,
        'browserName'
      );
      const referrerCounts = this.calculateStats(formattedVisitors, 'referrer');

      const newStats: VisitorStats = {
        totalVisitors: total,
        authenticatedVisitors: authenticated,
        anonymousVisitors: anonymous,
        pageStats: pageStats,
        deviceStats: deviceCounts.map(([device, count]) => ({ device, count })),
        browserStats: browserCounts.map(([browser, count]) => ({
          browser,
          count,
        })),
        referrerStats: referrerCounts.map(([referrer, count]) => ({
          referrer,
          count,
        })),
        activeVisitors: formattedVisitors,
      };
      this.visitorStatsSubject.next(newStats);
    });
  }

  private formatVisitorData(v: any): VisitorSessionData {
    return {
      id: v.Id ?? v.VisitorId ?? v.id ?? v.visitorId ?? '',
      currentPage: v.CurrentPage ?? v.Page ?? v.currentPage ?? v.page ?? '/',
      ipAddress: v.IpAddress ?? v.ipAddress ?? '',
      isAuthenticated: v.IsAuthenticated ?? v.isAuthenticated ?? false,
      username: v.Username ?? v.username ?? 'Anonim',
      connectionId: v.ConnectionId ?? v.connectionId ?? '',
      connectedAt:
        v.ConnectedAt ??
        v.JoinedAt ??
        v.connectedAt ??
        v.joinedAt ??
        new Date().toISOString(),
      lastActivityAt:
        v.LastActivityAt ?? v.lastActivityAt ?? new Date().toISOString(),
      deviceType: v.DeviceType ?? v.deviceType ?? 'Bilinmiyor',
      browserName: v.BrowserName ?? v.browserName ?? 'Bilinmiyor',
      userAgent: v.UserAgent ?? v.userAgent ?? '',
      referrer: v.Referrer ?? v.referrer ?? '',
    };
  }

  private calculateStats(
    visitors: VisitorSessionData[],
    property: keyof VisitorSessionData
  ): [string, number][] {
    const counts = visitors.reduce((acc, visitor) => {
      const value = (visitor[property] as string) || 'Bilinmiyor';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  // Sayfa değişikliğini throttle et (performans için)
  private throttlePageChange(): void {
    if (this.pageChangeTimeout) {
      clearTimeout(this.pageChangeTimeout);
    }

    this.pageChangeTimeout = setTimeout(() => {
      this.notifyPageChange();
    }, 300); // 300ms gecikme ile gereksiz bildirimleri önle
  }

  private notifyPageChange(): void {
    if (
      this.hubConnection &&
      this.hubConnection.state === HubConnectionState.Connected
    ) {
      this.hubConnection
        .invoke('PageChanged', this.currentPage)
        .catch((err) =>
          console.error(
            `Sayfa değişikliği bildirimi hatası (${this.currentPage}):`,
            this.formatError(err)
          )
        );
    }
  }

  public isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  public dispose(): void {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .catch((err) =>
          console.error(
            'Hub bağlantısı kapatılırken hata:',
            this.formatError(err)
          )
        );
      this.hubConnection = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.connectionEstablishedSubject.next(false);
  }

  private formatError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error) || 'Bilinmeyen hata';
  }
}
