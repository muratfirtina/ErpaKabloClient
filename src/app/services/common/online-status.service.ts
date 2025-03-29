// online-status.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OnlineStatusService {
  private online$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    this.initOnlineStatusMonitoring();
  }

  /**
   * Online durumunu izlemek için event listener'ları başlatır
   */
  private initOnlineStatusMonitoring(): void {
    // Online/Offline event'lerini dinle
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      this.online$.next(isOnline);
    });
  }

  /**
   * Kullanıcının çevrimiçi durumunu gözlemlemek için Observable döndürür
   */
  public getOnlineStatus(): Observable<boolean> {
    return this.online$.asObservable();
  }

  /**
   * Kullanıcının şu an çevrimiçi olup olmadığını döndürür
   */
  public isOnline(): boolean {
    return this.online$.getValue();
  }

  /**
   * Bağlantıyı test etmek için basit bir ping atar (isteğe bağlı kullanım)
   */
  public checkConnectivity(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      // Basit bir fetch isteği ile bağlantıyı test et (küçük bir favicon gibi)
      fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' })
        .then(() => {
          this.online$.next(true);
          resolve(true);
        })
        .catch(() => {
          this.online$.next(false);
          resolve(false);
        });
    });
  }
}