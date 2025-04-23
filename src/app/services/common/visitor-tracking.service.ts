import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { HubPaths } from 'src/app/constants/hub-paths';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment.prod';

export interface VisitorSessionData {
    id: string;
    currentPage: string;
    ipAddress: string;
    isAuthenticated: boolean;
    username: string;
    connectedAt: string;
    lastActivityAt: string;
    userAgent?: string;
}

export interface VisitorStats {
    totalVisitors: number;
    authenticatedVisitors: number;
    anonymousVisitors: number;
    pageStats: Array<{ page: string, count: number }>;
    activeVisitors: Array<VisitorSessionData>;
}

@Injectable({
  providedIn: 'root'
})
export class VisitorTrackingService implements OnDestroy {
  private hubConnection: HubConnection | null = null;
  private connecting = false;
  private connectionEstablished = new BehaviorSubject<boolean>(false);
  private connectionErrorSubject = new BehaviorSubject<string | null>(null);
  private destroy$ = new Subject<void>();

  private visitorStatsSubject = new BehaviorSubject<VisitorStats | null>(null);
  public visitorStats$ = this.visitorStatsSubject.asObservable();
  public connectionEstablished$ = this.connectionEstablished.asObservable();
  public connectionError$ = this.connectionErrorSubject.asObservable();

  private currentPage = '/';

  constructor(
      private router: Router,
      private authService: AuthService
    ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.currentPage = event.urlAfterRedirects.split('?')[0].split('#')[0] || '/';
      this.notifyPageChange();
    });
  }

  public async initialize(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected || this.connecting) {
      return;
    }
    this.connecting = true;
    this.connectionErrorSubject.next(null);
    this.connectionEstablished.next(false);

    try {
        const hubUrl = `${environment.baseUrl}${HubPaths.VisitorTrackingHub}`;

        this.hubConnection = new HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => this.authService.getToken() || '',
            skipNegotiation: false
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000])
          .configureLogging(LogLevel.Debug) // Debug seviyesine yükseltildi
          .build();

        this.registerHandlers();
        this.setupConnectionEvents();

        await this.startConnectionInternal();

    } catch (error) {
        console.error("VisitorTrackingService: Başlatma sırasında kritik hata:", this.formatError(error));
        this.connecting = false;
        this.connectionEstablished.next(false);
        this.connectionErrorSubject.next(`Başlatma hatası: ${this.formatError(error)}`);
    }
  }

  private async startConnectionInternal(): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Disconnected) {
        console.warn(`VisitorTrackingService: Bağlantı başlatılamıyor. Durum: ${this.hubConnection?.state ?? 'Başlatılmadı'}`);
        if (this.hubConnection?.state === HubConnectionState.Connected) {
            this.connecting = false;
            this.connectionEstablished.next(true);
        }
        return;
    }

    console.log("VisitorTrackingService: Bağlantı başlatılmaya çalışılıyor...");
    try {
      await this.hubConnection.start();
      console.log('VisitorTrackingService: Bağlantı başarıyla kuruldu.');
      this.connecting = false;
      this.connectionEstablished.next(true);
      this.connectionErrorSubject.next(null);
      this.notifyPageChange();
    } catch (error) {
      console.error('VisitorTrackingService: İlk bağlantı kurulamadı:', this.formatError(error));
      this.connecting = false;
      this.connectionEstablished.next(false);
      this.connectionErrorSubject.next(`Bağlantı hatası: ${this.formatError(error)}`);
    }
  }

  private setupConnectionEvents(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting((error?: Error) => {
      console.warn('VisitorTrackingService: Bağlantı yeniden kuruluyor...', error ? this.formatError(error) : '');
      this.connecting = true;
      this.connectionEstablished.next(false);
      this.connectionErrorSubject.next('Bağlantı yeniden kuruluyor...');
    });

    this.hubConnection.onreconnected((connectionId?: string) => {
      console.log(`VisitorTrackingService: Bağlantı yeniden kuruldu. ID: ${connectionId ?? 'N/A'}`);
      this.connecting = false;
      this.connectionEstablished.next(true);
      this.connectionErrorSubject.next(null);
      this.notifyPageChange();
    });

    this.hubConnection.onclose((error?: Error) => {
        console.error('VisitorTrackingService: Bağlantı kapandı.', error ? this.formatError(error) : 'Normal kapatma.');
        this.connecting = false;
        this.connectionEstablished.next(false);
        this.visitorStatsSubject.next(null);

        if (error) {
            this.connectionErrorSubject.next(`Bağlantı hatası: ${this.formatError(error)}`);
        } else {
             this.connectionErrorSubject.next('Bağlantı kapandı.');
        }
      });
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    // Tekrarlanan kayıtlardan kaçınmak için mevcut handler'ları temizle
    this.hubConnection.off('ReceiveVisitorStats');
    this.hubConnection.off('ReceiveVisitorsList');

    // Ziyaretçi istatistiklerini işle - DÜZELTME: Backend ile veri format uyumluluğu kontrolü
    this.hubConnection.on('ReceiveVisitorStats', (stats: any) => {        
        // Gelen verileri doğru şekilde dönüştür
        const formattedStats: VisitorStats = {
          totalVisitors: stats.TotalVisitors ?? stats.totalVisitors ?? 0,
          authenticatedVisitors: stats.AuthenticatedVisitors ?? stats.authenticatedVisitors ?? 0,
          anonymousVisitors: stats.AnonymousVisitors ?? stats.anonymousVisitors ?? 0,
          pageStats: stats.PageStats?.map((p: any) => ({
            page: p.Page ?? p.page ?? '/',
            count: p.Count ?? p.count ?? 0
          })) ?? [],
          activeVisitors: stats.ActiveVisitors?.map((v: any) => ({
            id: v.Id ?? v.id ?? '',
            currentPage: v.CurrentPage ?? v.Page ?? v.currentPage ?? v.page ?? '/',
            ipAddress: v.IpAddress ?? v.ipAddress ?? '',
            isAuthenticated: v.IsAuthenticated ?? v.isAuthenticated ?? false,
            username: v.Username ?? v.username ?? 'Anonim',
            connectedAt: v.ConnectedAt ?? v.JoinedAt ?? v.connectedAt ?? v.joinedAt ?? new Date().toISOString(),
            lastActivityAt: v.LastActivityAt ?? v.lastActivityAt ?? new Date().toISOString(),
            userAgent: v.UserAgent ?? v.userAgent ?? ''
          })) ?? []
        };
        
        this.visitorStatsSubject.next(formattedStats);
      });

    // Başlangıç ziyaretçi listesini işle - DÜZELTME: Veri format dönüşümü eklendi
    this.hubConnection.on('ReceiveVisitorsList', (visitors: any[]) => {
        
        if (!visitors || !Array.isArray(visitors)) {
          console.warn('Geçersiz ziyaretçi listesi alındı', visitors);
          return;
        }
        
        // Property isimlerini düzgün eşleştir
        const formattedVisitors = visitors.map(v => ({
          id: v.Id ?? v.VisitorId ?? v.id ?? v.visitorId ?? '',
          currentPage: v.CurrentPage ?? v.Page ?? v.currentPage ?? v.page ?? '/',
          ipAddress: v.IpAddress ?? v.ipAddress ?? '',
          isAuthenticated: v.IsAuthenticated ?? v.isAuthenticated ?? false,
          username: v.Username ?? v.username ?? 'Anonim',
          connectedAt: v.ConnectedAt ?? v.JoinedAt ?? v.connectedAt ?? v.joinedAt ?? new Date().toISOString(),
          lastActivityAt: v.LastActivityAt ?? v.lastActivityAt ?? new Date().toISOString(),
          userAgent: v.UserAgent ?? v.userAgent ?? ''
        }));
                
        // İstatistik verisi oluştur
        const total = formattedVisitors.length;
        const authenticated = formattedVisitors.filter(v => v.isAuthenticated).length;
        const anonymous = total - authenticated;

        // Sayfa istatistiklerini yeniden hesapla
        const pageCounts = formattedVisitors.reduce((acc, visitor) => {
          const page = visitor.currentPage || '/';
          acc[page] = (acc[page] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const formattedPageStats = Object.entries(pageCounts)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count);

        const newStats: VisitorStats = {
            totalVisitors: total,
            authenticatedVisitors: authenticated,
            anonymousVisitors: anonymous,
            pageStats: formattedPageStats,
            activeVisitors: formattedVisitors
        };
        this.visitorStatsSubject.next(newStats);
    });
  }

  private notifyPageChange(): void {
    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      this.hubConnection.invoke('PageChanged', this.currentPage)
        .then(() => {})
        .catch(err => console.error(`VisitorTrackingService: Sayfa değişikliği bildirimi gönderme hatası (${this.currentPage}):`, this.formatError(err)));
    } else {
      console.debug(`VisitorTrackingService: Sayfa değişikliği bildirimi gönderilemiyor, bağlantı durumu: ${this.hubConnection?.state ?? 'Başlatılmadı'}`);
    }
  }

  public isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }

  public async reconnect(): Promise<void> {
    if (this.connecting || this.isConnected()) {
        return;
    }
    await this.initialize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.hubConnection?.stop()
        .then(() => {})
        .catch(err => console.error("VisitorTrackingService: SignalR bağlantısını durdurma hatası:", this.formatError(err)));
  }

  private formatError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error) || 'Bilinmeyen bir hata oluştu.';
  }
}