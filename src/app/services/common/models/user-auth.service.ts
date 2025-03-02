import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClientService } from '../http-client.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../ui/custom-toastr.service';
import { AuthService } from '../auth.service';
import { TokenResponse } from 'src/app/contracts/token/tokenResponse';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  
  private lastEmailSentTime: { [email: string]: number } = {};
  private readonly EMAIL_COOLDOWN_MS = 20000; // 20 saniye

  constructor(
    private httpClientService: HttpClientService,
    private toastrService: CustomToastrService,
    private authService: AuthService
  ) {
    this.loadRateLimitData();
  }

  // Geri uyumluluk için eski metotları koruyoruz
  // Bu metotlar AuthService'deki yeni metotları çağıracak
  async login(userNameOrEmail: string, password: string, callBackFunction?: () => void): Promise<any> {
    try {
      const success = await this.authService.login(userNameOrEmail, password, callBackFunction);
      return success ? { succeeded: true } : { succeeded: false };
    } catch (error) {
      return { succeeded: false, error };
    }
  }

  async refreshTokenLogin(refreshToken: string, callBackFunction?: (state) => void): Promise<any> {
    try {
      const token = refreshToken || localStorage.getItem('refreshToken');
      if (!token) {
        if (callBackFunction) callBackFunction(false);
        return { succeeded: false };
      }
      
      const observable: Observable<any> = this.httpClientService.post(
        {
          controller: 'auth', // 'token' yerine 'auth' olarak güncellendi
          action: 'refresh'
        },
        { refreshToken: token,
          IpAddress: "", 
          UserAgent: "" }
      );

      const response = await firstValueFrom(observable);
      
      if (response && response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken || token);
        
        if (callBackFunction) callBackFunction(true);
        return { succeeded: true, token: response };
      }
      
      if (callBackFunction) callBackFunction(false);
      return { succeeded: false };
    } catch (error) {
      if (callBackFunction) callBackFunction(false);
      return { succeeded: false, error };
    }
  }

  async logout(callBackFunction?: () => void): Promise<boolean> {
    return await this.authService.logout(callBackFunction);
  }

  async passwordReset(email: string): Promise<boolean> {
    return await this.authService.passwordReset(email);
  }

  async verifyResetPasswordToken(resetToken: string, userId: string): Promise<boolean> {
    return await this.authService.verifyResetPasswordToken(userId, resetToken);
  }

  async updateForgotPassword(password: string, passwordConfirm: string, userId: string, resetToken: string): Promise<boolean> {
    return await this.authService.updatePassword(userId, resetToken, password, passwordConfirm);
  }

  // E-posta doğrulama
  async confirmEmail(userId: string, token: string): Promise<{ isSuccess: boolean; message?: string }> {
    const observable: Observable<any> = this.httpClientService.get({
      controller: "auth",
      action: "confirm-email",
      queryString: `userId=${userId}&token=${token}`
    });
  
    try {
      const response = await firstValueFrom(observable);
      return { isSuccess: true, message: response.message };
    } catch (error) {
      return { isSuccess: false, message: error.error?.message || "Activation failed." };
    }
  }
  
  // E-posta doğrulama bağlantısını yeniden gönderme
  async resendConfirmationEmail(email: string): Promise<boolean> {
    // E-posta için hız sınırlaması kontrol ediliyor
    const now = Date.now();
    const lastSentTime = this.lastEmailSentTime[email] || 0;
    const timeElapsed = now - lastSentTime;
    
    if (timeElapsed < this.EMAIL_COOLDOWN_MS) {
      const secondsRemaining = Math.ceil((this.EMAIL_COOLDOWN_MS - timeElapsed) / 1000);
      this.toastrService.message(
        `Please wait ${secondsRemaining} seconds before requesting another email`,
        'Rate Limited',
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight,
        }
      );
      throw new Error(`Rate limited. Please wait ${secondsRemaining} seconds.`);
    }
    
    const observable: Observable<any> = this.httpClientService.post(
      {
        controller: "auth",
        action: "resend-confirmation-email"
      }, 
      { email }
    );
  
    try {
      const response = await firstValueFrom(observable);
      
      // Başarılı olursa e-posta gönderim zamanını güncelle
      this.lastEmailSentTime[email] = Date.now();
      this.saveRateLimitData();
      
      this.toastrService.message(
        'Confirmation email sent',
        'Success',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight,
        }
      );
      return true;
    } catch (error) {
      console.error('Email resend error:', error);
      
      // Eğer API'den rate limit hatası gelirse, yine de zamanı kaydet
      if (error.status === 429) {
        this.lastEmailSentTime[email] = Date.now();
        this.saveRateLimitData();
      }
      
      this.toastrService.message(
        error.error?.message || 'Failed to resend confirmation email',
        'Error',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight,
        }
      );
      throw error;
    }
  }
  
  // Local Storage'dan hız sınırlama verilerini yükle
  private loadRateLimitData(): void {
    const savedData = localStorage.getItem('email_rate_limits');
    if (savedData) {
      try {
        this.lastEmailSentTime = JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse rate limit data', e);
        this.lastEmailSentTime = {};
      }
    }
  }
  
  // Local Storage'a hız sınırlama verilerini kaydet
  private saveRateLimitData(): void {
    localStorage.setItem('email_rate_limits', JSON.stringify(this.lastEmailSentTime));
  }
  
  // E-posta göndermeye ne kadar süre kaldığını kontrol et
  getResendTimeRemaining(email: string): number {
    const now = Date.now();
    const lastSentTime = this.lastEmailSentTime[email] || 0;
    const timeElapsed = now - lastSentTime;
    
    if (timeElapsed < this.EMAIL_COOLDOWN_MS) {
      return Math.ceil((this.EMAIL_COOLDOWN_MS - timeElapsed) / 1000);
    }
    
    return 0;
  }
  
  // Eski kayıtları temizle
  initializeRateLimits(): void {
    this.loadRateLimitData();
    
    // 24 saatten eski kayıtları temizle
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    let hasChanges = false;
    Object.keys(this.lastEmailSentTime).forEach(email => {
      if (now - this.lastEmailSentTime[email] > oneDayMs) {
        delete this.lastEmailSentTime[email];
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.saveRateLimitData();
    }
  }
}