import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClientService } from './http-client.service';
import { TokenService } from './token.service';
import { UserService } from './models/user.service';
import { StoreService } from './store.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { AnalyticsService } from './analytics.services';
import { VerifyActivationCodeResponse } from 'src/app/contracts/auth/verifyActivationCodeResponse';
import { ResendActivationCodeResponse } from 'src/app/contracts/auth/resendActivationCodeResponse';
import { VerifyActivationTokenResponse } from 'src/app/contracts/token/verifyActivationTokenResponse';

// API yanıt tipleri
interface VerifyResetTokenResponse {
  state: boolean;
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
          controller: 'auth', // 'token' yerine 'auth' olarak güncellendi
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

  // Tüm cihazlardan çıkış
  async logoutFromAllDevices(callBackFunction?: () => void): Promise<boolean> {
    try {
      console.log("AuthService: Tüm cihazlardan çıkış yapılıyor...");
      
      this.toastrService.message('Tüm cihazlardan çıkış yapılıyor...', 'İşlem Sürüyor', {
        toastrMessageType: ToastrMessageType.Info,
        position: ToastrPosition.TopRight,
      });
      
      // TokenService üzerinden tüm token'ları iptal et
      const success = await this.tokenService.revokeAllTokens();
      
      if (success) {
        console.log("AuthService: Tüm cihazlardan çıkış başarılı");
        
        // Token'ları ve kullanıcı verilerini temizle
        this.tokenService.clearTokens();
        
        // Kimlik durumunu güncelle
        this.authStateSubject.next(false);
        
        // Store'daki kullanıcı bilgilerini temizle
        this.store.update('user', {
          isAuthenticated: false,
          data: null
        });
        
        this.toastrService.message('Tüm cihazlardan başarıyla çıkış yapıldı', 'Başarılı', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight,
        });
        
        // Callback fonksiyonu varsa çağır
        if (callBackFunction) callBackFunction();
        
        // Login sayfasına yönlendir
        await this.router.navigate(['/login']);
        
        return true;
      }
      
      console.error("AuthService: Tüm cihazlardan çıkış başarısız oldu");
      
      this.toastrService.message('Tüm cihazlardan çıkış yapılırken bir hata oluştu', 'Hata', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight,
      });
      
      return false;
    } catch (error) {
      console.error('AuthService: Tüm cihazlardan çıkış hatası:', error);
      
      this.toastrService.message('Tüm cihazlardan çıkış yapılamadı', 'Hata', {
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
          controller: 'auth',
          action: 'verify-reset-password-token'
        },
        { userId, resetToken }
      );

      const response = await firstValueFrom(observable);
      return response?.state === true;
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

  // Aktivasyon kodu doğrulama
async verifyActivationCode(userId: string, code: string): Promise<VerifyActivationCodeResponse> {
  try {
    const observable = this.httpClientService.post<VerifyActivationCodeResponse>(
      {
        controller: 'auth',
        action: 'verify-activation-code'
      },
      { userId, code }
    );

    const response = await firstValueFrom(observable);
    return response || { verified: false };
  } catch (error) {
    console.error('Activation code verification error:', error);
    
    // API hata yanıtlarını ele al
    if (error.status === 400 || error.status === 429) {
      return {
        verified: false,
        message: error.error?.message || 'Verification failed',
        remainingAttempts: error.error?.remainingAttempts || 0,
        exceeded: error.error?.exceeded || false
      };
    }
    
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
        controller: 'auth',
        action: 'resend-activation-code'
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

async verifyActivationToken(token: string): Promise<VerifyActivationTokenResponse> {
  try {
    const observable = this.httpClientService.get<VerifyActivationTokenResponse>(
      {
        controller: 'auth',
        action: 'verify-activation-token',
        queryString: `token=${encodeURIComponent(token)}`
      }
    );

    const response = await firstValueFrom(observable);
    
    // API'den gelen yanıtı döndür
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
}