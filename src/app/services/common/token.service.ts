import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClientService } from './http-client.service';
import { SecurityConfig, DEFAULT_SECURITY_CONFIG } from '../../config/security.config';
import { TokenResponse } from 'src/app/contracts/token/tokenResponse';
import { StoreService } from './store.service';

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
          controller: 'auth', // 'token' yerine 'auth' olarak güncellendi
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
          controller: 'auth', // 'token' yerine 'auth' olarak güncellendi
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
      const observable: Observable<any> = this.httpClientService.post(
        {
          controller: 'auth', // 'token' yerine 'auth' olarak güncellendi
          action: 'logout-all'
        },
        {}
      );

      await firstValueFrom(observable);
      return true;
    } catch (error) {
      console.error('All tokens revocation error:', error);
      return false;
    }
  }
  
  // Admin: Belirli bir kullanıcının tüm token'larını iptal et
  async revokeUserTokens(userId: string): Promise<boolean> {
    try {
      const observable: Observable<any> = this.httpClientService.post(
        {
          controller: 'auth', // 'token' yerine 'auth' olarak güncellendi
          action: `admin/users/${userId}/revoke-tokens`
        },
        {}
      );

      await firstValueFrom(observable);
      return true;
    } catch (error) {
      console.error(`Error revoking tokens for user ${userId}:`, error);
      return false;
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