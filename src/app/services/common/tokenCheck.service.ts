// src/app/services/common/token-check.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';

@Injectable({
  providedIn: 'root'
})
export class TokenCheckService implements OnDestroy {
  private intervalId: any;
  
  constructor(
    private httpClientService: HttpClientService,
    private authService: AuthService,
    private router: Router,
    private toastrService: CustomToastrService
  ) {}

  // Periyodik token kontrolünü başlat
  startPeriodicCheck(intervalSeconds: number = 30): void {
    // Önceki interval'ı temizle
    this.stopPeriodicCheck();
    
    console.log(`Periyodik token kontrolü başlatıldı (${intervalSeconds} saniyede bir)`);
    
    // Her X saniyede bir token geçerliliğini kontrol et
    this.intervalId = setInterval(async () => {
      if (this.authService.isAuthenticated) {
        await this.validateToken();
      }
    }, intervalSeconds * 1000);
  }

  // Token geçerliliğini kontrol et
  async validateToken(): Promise<boolean> {
    try {
      // Özel validate-token endpoint'ine istek yaparak token'ın hala geçerli olup olmadığını kontrol et
      const observable = this.httpClientService.get<{isValid: boolean}>(
        {
          controller: 'auth',
          action: 'validate-token'
        }
      );
      
      const response = await firstValueFrom(observable);
      return response?.isValid ?? false;
    } catch (error) {
      console.log('Token validasyon hatası:', error);
      
      if (error.status === 401 || error.status === 403) {
        this.handleInvalidToken(error);
      }
      
      return false;
    }
  }
  
  // Geçersiz token durumunda yapılacak işlemler
  private handleInvalidToken(error: any): void {
    console.log('Token geçersiz, oturum kapatılıyor');
    
    // Özel token revoked mesajı kontrolü
    if (error.error?.error === "Token has been revoked") {
      // Kullanıcıya bildir
      this.toastrService.message(
        'Oturumunuz başka bir cihazdan sonlandırıldı',
        'Oturum Sonlandırıldı', 
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
    } else {
      // Genel yetkilendirme hatası
      this.toastrService.message(
        'Oturumunuz sona erdi, yeniden giriş yapın',
        'Oturum Süresi Doldu', 
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
    }
    
    // Oturumu kapat
    this.authService.logout(() => {
      this.router.navigate(['/login']);
    });
  }

  stopPeriodicCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Periyodik token kontrolü durduruldu');
    }
  }

  ngOnDestroy(): void {
    this.stopPeriodicCheck();
  }
}