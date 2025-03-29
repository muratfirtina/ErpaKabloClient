import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClientService } from '../http-client.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../ui/custom-toastr.service';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { VerifyActivationCodeResponse } from 'src/app/contracts/auth/verifyActivationCodeResponse';
import { ResendActivationCodeResponse } from 'src/app/contracts/auth/resendActivationCodeResponse';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  
  private lastEmailSentTime: { [email: string]: number } = {};
  private readonly EMAIL_COOLDOWN_MS = 20000; // 20 saniye

  constructor(
    private httpClientService: HttpClientService,
    private toastrService: CustomToastrService,
    private authService: AuthService,
    private tokenService: TokenService
  ) {
    this.loadRateLimitData();
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
          controller: 'token', // Changed to token controller
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
  /* async confirmEmail(userId: string, token: string): Promise<{ isSuccess: boolean; message?: string }> {
    const observable: Observable<any> = this.httpClientService.get({
      controller: "token", // Changed to token controller
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
        controller: "token", // Changed to token controller
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
  } */
  
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
  
  // Aktivasyon kodu doğrulama - Now using TokenService directly
  // user-auth.service.ts
async verifyActivationCode(userId: string, code: string): Promise<VerifyActivationCodeResponse> {
  try {
    const response = await this.tokenService.verifyActivationCode(userId, code);
    
    // Kalan deneme sayısını doğru şekilde işleme
    if (response && response.remainingAttempts !== undefined) {
    }
    
    return response;
  } catch (error) {
    console.error('UserAuthService: verification error:', error);
    
    // Hata objesi HTTP response mi?
    if (error && error.status) {
      // 429 - Too Many Requests
      if (error.status === 429) {
        console.log('Rate limit exceeded - 429 error');
        return {
          verified: false,
          message: error.error?.message || 'Too many failed attempts',
          remainingAttempts: 0,
          exceeded: true,
          requiresNewCode: error.error?.requiresNewCode || true
        };
      }
      
      // Diğer HTTP hataları
      return {
        verified: false,
        message: error.error?.message || 'Verification failed',
        remainingAttempts: error.error?.remainingAttempts || 0
      };
    }
    
    // Diğer hata tipleri
    return {
      verified: false,
      message: error.message || 'Verification failed'
    };
  }
}

  async resendActivationCode(email: string): Promise<ResendActivationCodeResponse> {
    try {
      // E-posta için hız sınırlaması kontrol ediliyor
      const now = Date.now();
      const lastSentTime = this.lastEmailSentTime[email] || 0;
      const timeElapsed = now - lastSentTime;
      
      if (timeElapsed < this.EMAIL_COOLDOWN_MS) {
        const secondsRemaining = Math.ceil((this.EMAIL_COOLDOWN_MS - timeElapsed) / 1000);
        this.toastrService.message(
          `Please wait ${secondsRemaining} seconds before requesting a new code`,
          'Warning',
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight,
          }
        );
      }
      
      const response = await this.tokenService.resendActivationCode(email);
      
      if (response.success) {
        // Başarılı olursa e-posta gönderim zamanını güncelle
        this.lastEmailSentTime[email] = Date.now();
        this.saveRateLimitData();
      }
      
      return response;
    } catch (error) {
      console.error('Email resend error:', error);
      
      // Eğer API'den rate limit hatası gelirse, yine de zamanı kaydet
      if (error.status === 429) {
        this.lastEmailSentTime[email] = Date.now();
        this.saveRateLimitData();
      }
      
      return { 
        success: false, 
        message: error.message || 'Failed to resend activation code' 
      };
    }
  }

  // Aktivasyon tokeni doğrulama - Now using TokenService directly
  async verifyActivationToken(token: string): Promise<{ success: boolean; userId?: string; email?: string; message?: string }> {
    try {
      return await this.tokenService.verifyActivationToken(token);
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Token doğrulama işlemi başarısız oldu.'
      };
    }
  }
}

