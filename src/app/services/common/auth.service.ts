import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClientService } from './http-client.service';
import { TokenService } from './token.service';
import { UserService } from './models/user.service';
import { StoreService } from './store.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { AnalyticsService } from './analytics.services';

// API yanıt tipleri
interface VerifyResetTokenResponse {
  tokenValid: boolean;
  userId: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<boolean>(false);
  authState$ = this.authStateSubject.asObservable();

  constructor(
    private tokenService: TokenService,
    private userService: UserService,
    private httpClientService: HttpClientService,
    private router: Router,
    private store: StoreService,
    private toastrService: CustomToastrService,
    private analyticsService: AnalyticsService,
  ) {
    this.checkAuthState();
  }

  private async checkAuthState() {
    const isAuthenticated = await this.identityCheck();
    this.authStateSubject.next(isAuthenticated);
    
    if (isAuthenticated) {
      try {
        // Kullanıcı bilgilerini al ve store'a kaydet
        const user = await this.userService.getCurrentUser();
        this.store.update('user', {
          isAuthenticated: true,
          data: user
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        this.logout();
      }
    }
  }

  // Eski kodlarla uyumluluk için getToken metodu
  getToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  // Kimlik doğrulama durumunu kontrol et
  async identityCheck(): Promise<boolean> {
    // Token geçerliliğini TokenService üzerinden kontrol et
    return await this.tokenService.ensureValidToken();
  }

  // Giriş işlemi
  async login(userNameOrEmail: string, password: string, callBackFunction?: () => void): Promise<boolean> {
    try {
      const observable = this.httpClientService.post<any>(
        {
          controller: 'auth', // This route is correct for the new structure
          action: 'login'
        },
        {
          UsernameOrEmail: userNameOrEmail,
          Password: password
        }
      );

      const response = await firstValueFrom(observable);

      if (response && response.token) {
        // Token'ları ve kullanıcı bilgilerini kaydet
        this.tokenService.storeTokens(
          response.token.accessToken,
          response.token.refreshToken,
          response.token.userId
        );
        // Kimlik durumunu güncelle
        this.authStateSubject.next(true);

        // Kullanıcı bilgilerini al ve store'a kaydet
        try {
          const user = await this.userService.getCurrentUser();
          this.store.update('user', {
            isAuthenticated: true,
            data: user
          });
        } catch (error) {
          console.error('Error loading user data after login:', error);
        }

        this.toastrService.message('Login successful', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight,
        });

        if (callBackFunction) callBackFunction();
        this.analyticsService.trackLogin('email');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Çıkış işlemi
  async logout(callbackFunction?: () => void): Promise<boolean> {
    try {
      // TokenService üzerinden token'ı iptal et
      await this.tokenService.revokeToken();
    } catch (error) {
      console.error('Error during token revocation:', error);
    } finally {
      // Token'ları ve kullanıcı verilerini temizle
      this.tokenService.clearTokens();
      
      // Kimlik durumunu güncelle
      this.authStateSubject.next(false);
      
      // Store'daki kullanıcı bilgilerini temizle
      this.store.update('user', {
        isAuthenticated: false,
        data: null
      });
      
      // Callback fonksiyonu varsa çağır
      if (callbackFunction) callbackFunction();
      
      // Ana sayfaya yönlendir
      await this.router.navigate(['/']);
      
      // Ana sayfadaysak sayfayı yenile
      if (this.router.url === '/') {
        window.location.reload();
      }
    }
    
    return true; // Çıkış başarılı
  }
  // Add this method to the AuthService class
async logoutFromAllDevices(callBackFunction?: () => void): Promise<boolean> {
  try {
    this.toastrService.message('Output from all devices ... ','The process continues', {
      toastrMessageType: ToastrMessageType.Info,
      position: ToastrPosition.TopRight,
    });
    
    // Use TokenService to revoke all tokens
    const success = await this.tokenService.revokeAllTokens();
    
    if (success) {      
      // Clear tokens and user data
      this.tokenService.clearTokens();
      
      // Update authentication state
      this.authStateSubject.next(false);
      
      // Clear user data from store
      this.store.update('user', {
        isAuthenticated: false,
        data: null
      });
      
      this.toastrService.message('All devices were successfully exited ','Success',{
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight,
      });
      
      // Call callback function if provided
      if (callBackFunction) callBackFunction();
      
      // Navigate to login page
      await this.router.navigate(['/login']);
      
      return true;
    }
    
    console.error("AuthService: Exit from all devices failed");
    
    this.toastrService.message('An error occurred when exiting all devices', 'error', {
      toastrMessageType: ToastrMessageType.Error,
      position: ToastrPosition.TopRight,
    });
    
    return false;
  } catch (error) {
    console.error('AuthService: Output error from all devices:', error);
    
    this.toastrService.message('All devices could not be exit ',' error ', {
      toastrMessageType: ToastrMessageType.Error,
      position: ToastrPosition.TopRight,
    });
    
    return false;
  }
}

  // Kullanıcı isim-soyisim bilgisini al
  getUserNameSurname(): string | null {
    return this.tokenService.getUserNameFromToken();
  }

  // Kullanıcı rolünü kontrol et
  hasRole(role: string): boolean {
    return this.tokenService.hasRole(role);
  }

  // Yardımcı getter'lar
  get isAuthenticated(): boolean {
    return this.tokenService.isTokenValid();
  }

  get isAdmin(): boolean {
    return this.tokenService.hasRole('Admin');
  }

  // Şifre sıfırlama
  async passwordReset(email: string): Promise<boolean> {
    try {
      const observable = this.httpClientService.post(
        {
          controller: 'auth',
          action: 'password-reset'
        },
        { email }
      );

      await firstValueFrom(observable);
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  }

  // Şifre sıfırlama token doğrulama
  async verifyResetPasswordToken(userId: string, resetToken: string): Promise<boolean> {
    try {
      const observable = this.httpClientService.post<VerifyResetTokenResponse>(
        {
          controller: 'token', // Changed to tokens controller
          action: 'verify-reset-password'
        },
        { userId, resetToken }
      );

      const response = await firstValueFrom(observable);
      return response?.tokenValid === true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  // Şifre güncelleme
  async updatePassword(userId: string, resetToken: string, password: string, passwordConfirm: string): Promise<boolean> {
    try {
      const observable = this.httpClientService.post(
        {
          controller: 'users',
          action: 'update-forgot-password'
        },
        {
          userId,
          resetToken,
          password,
          passwordConfirm
        }
      );

      await firstValueFrom(observable);
      return true;
    } catch (error) {
      console.error('Password update error:', error);
      return false;
    }
  }
}