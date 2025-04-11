import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, catchError, throwError, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClientService } from './http-client.service';
import { TokenService } from './token.service';
import { UserService } from './models/user.service';
import { StoreService } from './store.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { AnalyticsService } from './analytics.services';
import { HttpErrorResponse } from '@angular/common/http';
import { VerifyResetTokenResponse } from 'src/app/contracts/token/verifyResetTokenResponse';



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
        // Kullanıcı bilgileri alınamazsa logout yap
        await this.logout(); // await ekledik
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
  async login(userNameOrEmail: string, password: string, callBackFunction?: () => void): Promise<boolean | any> {
    try {
      const observable = this.httpClientService.post<any>(
        {
          controller: 'auth',
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
          console.error('Giriş sonrası kullanıcı verisi yüklenirken hata:', error);
        }
  
        this.toastrService.message('Giriş başarılı', 'Başarılı', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight,
        });
  
        if (callBackFunction) callBackFunction();
        this.analyticsService.trackLogin('email');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      
      // Backend'den gelen hata yanıtını işleme
      if (error?.error) {
        // LoginErrorResponse formatında yanıt - kullanıcıya gösterilecek
        return error.error;
      }
      
      return {
        message: 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        failedAttempts: 0,
        isLockedOut: false,
        errorType: -1
      };
    }
  }


  // Çıkış işlemi
  async logout(callbackFunction?: () => void): Promise<boolean> {
    try {
      // TokenService üzerinden token'ı iptal et
      await this.tokenService.revokeToken();
    } catch (error) {
      console.error('Error during token revocation (if implemented):', error);
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

      // Giriş sayfasına veya ana sayfaya yönlendir
      await this.router.navigate(['/login']); // Genellikle login sayfasına yönlendirmek daha mantıklı

      // Sayfa yenileme genellikle SPA'larda tercih edilmez ama isteniyorsa:
      // if (this.router.url === '/') {
      //   window.location.reload();
      // }
    }

    return true; // Çıkış işlemi her zaman başarılı kabul edilebilir (local temizlik yapıldığı için)
  }

  // Tüm Cihazlardan Çıkış Yap
  async logoutFromAllDevices(callBackFunction?: () => void): Promise<boolean> {
    try {
      this.toastrService.message('Logging out from all devices...', 'Processing', {
        toastrMessageType: ToastrMessageType.Info,
        position: ToastrPosition.TopRight,
      });

      // TokenService üzerinden tüm tokenları iptal etme isteği
      const success = await this.tokenService.revokeAllTokens(); // Backend'e istek atar

      if (success) {
        // Token'ları ve kullanıcı verilerini temizle (local)
        this.tokenService.clearTokens();

        // Kimlik durumunu güncelle
        this.authStateSubject.next(false);

        // Store'daki kullanıcı bilgilerini temizle
        this.store.update('user', {
          isAuthenticated: false,
          data: null
        });

        this.toastrService.message('Successfully logged out from all devices', 'Success',{
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight,
        });

        // Callback fonksiyonu varsa çağır
        if (callBackFunction) callBackFunction();

        // Giriş sayfasına yönlendir
        await this.router.navigate(['/login']);

        return true;
      }

      console.error("AuthService: Logout from all devices failed (backend response)");
      this.toastrService.message('Could not log out from all devices', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight,
      });
      return false;
    } catch (error) {
      console.error('AuthService: Error during logout from all devices:', error);
      this.toastrService.message('An error occurred while logging out from all devices', 'Error', {
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
          controller: 'token', // Token controller doğru
          action: 'verify-reset-password'
        },
        { userId, resetToken }
      );

      const response = await firstValueFrom(observable);
      // Backend'den dönen yanıta göre kontrol
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
          action: 'update-forgot-password' // Bu endpoint backend'de tanımlı olmalı
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