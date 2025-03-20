import { Injectable } from '@angular/core';
import { Observable, catchError, defaultIfEmpty, firstValueFrom } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClientService } from './http-client.service';
import { SecurityConfig, DEFAULT_SECURITY_CONFIG } from '../../config/security.config';
import { StoreService } from './store.service';
import { VerifyActivationCodeResponse } from 'src/app/contracts/auth/verifyActivationCodeResponse';
import { ResendActivationCodeResponse } from 'src/app/contracts/auth/resendActivationCodeResponse';
import { VerifyActivationTokenResponse } from 'src/app/contracts/token/verifyActivationTokenResponse';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly securityConfig: SecurityConfig = DEFAULT_SECURITY_CONFIG;
  
  constructor(
    private httpClientService: HttpClientService,
    private jwtHelper: JwtHelperService,
    private storeService: StoreService
  ) {}

  // Token depolama işlemleri
  storeTokens(accessToken: string, refreshToken: string, userId?: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (userId) {
      localStorage.setItem('userId', userId);
    }
    
    // Token bilgilerini store'a da kaydet
    this.updateTokenState(true);
  }

  // Token alma işlemleri
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Token temizleme
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    
    // Token durumunu güncelle
    this.updateTokenState(false);
  }

  private updateTokenState(isAuthenticated: boolean): void {
    this.storeService.update('auth', { 
      isAuthenticated: isAuthenticated
    });
  }

  // Token yakında sona erecek mi kontrolü
  isTokenExpiringSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
      if (!expirationDate) return true;

      // Token için yenileme eşiği (varsayılan 5 dakika)
      const thresholdMilliseconds = this.securityConfig.auth.tokenRefreshThresholdMinutes * 60 * 1000;
      return (expirationDate.getTime() - Date.now()) < thresholdMilliseconds;
    } catch (error) {
      console.error('Token expiration check error:', error);
      return true;
    }
  }

  // Token geçerli mi kontrolü
  isTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      return !this.jwtHelper.isTokenExpired(token);
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Token yenileme
  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const observable: Observable<any> = this.httpClientService.post(
        {
          controller: 'token', // Changed to token controller
          action: 'refresh'
        },
        { refreshToken }
      );

      const response = await firstValueFrom(observable);

      if (response && response.accessToken) {
        this.storeTokens(response.accessToken, response.refreshToken || refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens(); // Hata durumunda token'ları temizle
      return false;
    }
  }

  // Tek bir token'ı iptal et
  async revokeToken(refreshToken?: string): Promise<boolean> {
    if (!refreshToken) {
      refreshToken = this.getRefreshToken();
    }
    
    if (!refreshToken) return false;
    
    try {
      const observable: Observable<any> = this.httpClientService.post(
        {
          controller: 'auth', // Keep this with auth controller since it's a logout operation
          action: 'logout'
        },
        { refreshToken }
      );

      await firstValueFrom(observable);
      return true;
    } catch (error) {
      console.error('Token revocation error:', error);
      return false;
    }
  }
  
  // Kullanıcının tüm cihazlardaki token'larını iptal et
  async revokeAllTokens(): Promise<boolean> {
    try {
      console.log("Tüm cihazlardan çıkış yapılıyor...");
      
      // API isteği gönderirken authentication token'ı otomatik olarak eklenecek
      const observable: Observable<any> = this.httpClientService.post(
        {
          controller: 'token', // Changed to token controller
          action: 'logout-all'
        },
        {} // Boş body gönder
      );
  
      const response = await firstValueFrom(observable);
      console.log("Tüm cihazlardan çıkış yapıldı:", response);
      
      // İşlem başarılı
      return true;
    } catch (error) {
      // Hata detaylarını logla - bu önemli bir hata ayıklama adımı
      console.error('Tüm cihazlardan çıkış hatası:', error);
      
      // Hata tipini kontrol et
      if (error.status === 401) {
        console.error('Yetkilendirme hatası - token geçersiz olabilir');
        return false;
      } 
      else if (error.status === 404) {
        console.error('Endpoint bulunamadı - "logout-all" endpoint\'i mevcut değil');
        return false;
      }
      
      return false; // Diğer hata durumlarında başarısız kabul et
    }
  }
  
  // Admin: Belirli bir kullanıcının tüm token'larını iptal et
  async revokeUserTokens(userId: string): Promise<boolean> {
    try {
      const observable: Observable<any> = this.httpClientService.post(
        {
          controller: 'token', // Changed to token controller
          action: `admin/users/${userId}/revoke`
        },
        {}
      );

      await firstValueFrom(observable);
      return true;
    } catch (error) {
      console.error(`Error revoking token for user ${userId}:`, error);
      return false;
    }
  }
  
  // Token doğrulama
  async validateToken(): Promise<boolean> {
    try {
      const observable: Observable<any> = this.httpClientService.get(
        {
          controller: 'token', // Changed to token controller
          action: 'validate'
        }
      );

      const response = await firstValueFrom(observable);
      return response?.isValid === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
  
  // Aktivasyon kodu doğrulama
  // token.service.ts
// token.service.ts
async verifyActivationCode(userId: string, code: string): Promise<VerifyActivationCodeResponse> {
  try {
    console.log('Sending verification request to server:', { userId, code });
    
    const observable = this.httpClientService.post<VerifyActivationCodeResponse>(
      {
        controller: 'token',
        action: 'activation-code/verify'
      },
      { userId, code }
    );

    // EMPTY hatası almamak için defaultIfEmpty operatörü ekleyelim
    const response = await firstValueFrom(
      observable.pipe(
        catchError(error => {
          console.error('HTTP Error in verification:', error);
          // HTTP hatası olduğunda, hatayı dışarı fırlat
          throw error;
        }),
        defaultIfEmpty({ verified: false, message: 'No response from server' })
      )
    );
    
    console.log('Server response:', response);
    return response;
  } catch (error) {
    console.error('Activation code verification error:', error);
    
    // HTTP hatası mı kontrol et
    if (error.status) {
      if (error.status === 429) {
        // 429 Too Many Requests hatası
        return {
          verified: false,
          message: error.error?.message || 'Too many attempts',
          remainingAttempts: 0,
          exceeded: true,
          requiresNewCode: error.error?.requiresNewCode || true
        };
      }
      
      // Diğer HTTP hataları
      return { 
        verified: false,
        message: error.error?.message || 'An error occurred during verification',
        remainingAttempts: error.error?.remainingAttempts
      };
    }
    
    // Ağ veya diğer hatalar
    return { 
      verified: false,
      message: 'An error occurred during verification'
    };
  }
}

  // Aktivasyon kodu yeniden gönderme
  async resendActivationCode(email: string): Promise<ResendActivationCodeResponse> {
    try {
      const observable = this.httpClientService.post<ResendActivationCodeResponse>(
        {
          controller: 'token', // Changed to token controller
          action: 'activation-code/resend'
        },
        { email }
      );

      const response = await firstValueFrom(observable);
      return response || { success: true, message: 'Activation code sent' };
    } catch (error) {
      console.error('Resend activation code error:', error);
      
      if (error.status === 429) {
        return { 
          success: false, 
          message: error.error?.message || 'Too many requests. Please try again later.' 
        };
      }
      
      return { 
        success: false, 
        message: 'Failed to send activation code'
      };
    }
  }

  // Aktivasyon tokeni doğrulama
  async verifyActivationToken(token: string): Promise<VerifyActivationTokenResponse> {
    try {
      const observable = this.httpClientService.get<VerifyActivationTokenResponse>(
        {
          controller: 'token', // Changed to token controller
          action: 'activation/verify',
          queryString: `token=${encodeURIComponent(token)}`
        }
      );

      const response = await firstValueFrom(observable);
      
      return {
        success: response?.success || false,
        userId: response?.userId,
        email: response?.email,
        message: response?.message
      };
    } catch (error) {
      console.error('Activation token verification error:', error);
      
      return {
        success: false,
        message: error.error?.message || 'Token doğrulama işlemi başarısız oldu.'
      };
    }
  }
  
  // Token'dan kullanıcı kimlik bilgilerini al
  getUserInfoFromToken(): any {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      return this.jwtHelper.decodeToken(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  
  // Token'dan kullanıcı ID'sini al
  getUserIdFromToken(): string | null {
    const decodedToken = this.getUserInfoFromToken();
    if (!decodedToken) return null;
    
    return decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 
           decodedToken["sub"] || null;
  }
  
  // Token'dan kullanıcı adını ve soyadını al
  getUserNameFromToken(): string | null {
    const decodedToken = this.getUserInfoFromToken();
    if (!decodedToken) return null;
    
    return decodedToken["NameSurname"] || null;
  }
  
  // Token'dan kullanıcı rollerini al
  getUserRolesFromToken(): string[] {
    const decodedToken = this.getUserInfoFromToken();
    if (!decodedToken) return [];
    
    const roles = decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    
    if (typeof roles === 'string') {
      return [roles];
    } else if (Array.isArray(roles)) {
      return roles;
    }
    
    return [];
  }
  
  // Kullanıcı rolünü kontrol et
  hasRole(role: string): boolean {
    const roles = this.getUserRolesFromToken();
    return roles.includes(role);
  }
  
  // Geçerli token'ı sağla (gerekirse yenile)
  async ensureValidToken(): Promise<boolean> {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    // Hiç token yoksa false dön
    if (!token || !refreshToken) return false;
    
    // Token varsa ve geçerliyse
    if (this.isTokenValid() && !this.isTokenExpiringSoon()) return true;
    
    // Token varsa ama süresi dolmuşsa yenilemeyi dene
    return await this.refreshToken();
  }
}