import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DownbarComponent } from '../downbar/downbar.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { ButtonSpinnerComponent } from 'src/app/base/spinner/button-spinner/button-spinner.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DownbarComponent,
    ButtonSpinnerComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent extends BaseComponent {
  companyLogoUrl = 'assets/icons/TUMdex.png';
  isVisible = false;
  isDarkTheme = false;
  loading: boolean = false;
  rememberMe: boolean = false;

  // Form input değerleri
  usernameOrEmail: string = '';
  password: string = '';

  // Math nesnesini template'de kullanabilmek için
  Math = Math;

  // Error handling properties
  errorMessage: string = '';
  showError: boolean = false;
  loginAttempts: number = 0;
  lastAttemptTime: number = 0;
  lockoutDuration: number = 60000; // 60 seconds in milliseconds
  isLockedOut: boolean = false;
  lockoutTimeRemaining: number = 0;
  lockoutTimerId: any = null;
  showPassword: boolean = false;

  constructor(
    private userAuthService: UserAuthService,
    spinner: SpinnerService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private el: ElementRef,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
    // Check system theme preference
    this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.checkRememberMe();

    // Check if there's a previous lockout state in session storage
    this.checkLockoutState();
  }

  private checkLockoutState() {
    const lockoutData = sessionStorage.getItem('loginLockout');
    if (lockoutData) {
      const data = JSON.parse(lockoutData);
      const now = Date.now();
      if (now < data.expiresAt) {
        // Lockout is still active
        this.isLockedOut = true;
        this.lockoutTimeRemaining = Math.ceil((data.expiresAt - now) / 1000);
        this.startLockoutTimer();
      } else {
        // Lockout has expired, clear it
        sessionStorage.removeItem('loginLockout');
      }
    }

    // Retrieve login attempts count
    const attemptsData = sessionStorage.getItem('loginAttempts');
    if (attemptsData) {
      const data = JSON.parse(attemptsData);
      this.loginAttempts = data.count;
      this.lastAttemptTime = data.lastAttempt;
    }
  }

  private startLockoutTimer() {
    // Clear any existing timer
    if (this.lockoutTimerId) {
      clearInterval(this.lockoutTimerId);
    }

    // Start a new timer that updates every second
    this.lockoutTimerId = setInterval(() => {
      this.lockoutTimeRemaining--;
      if (this.lockoutTimeRemaining <= 0) {
        clearInterval(this.lockoutTimerId);
        this.isLockedOut = false;
        sessionStorage.removeItem('loginLockout');
      }
    }, 1000);
  }

  private applyLockout() {
    this.isLockedOut = true;
    const lockoutExpiration = Date.now() + this.lockoutDuration;
    this.lockoutTimeRemaining = Math.ceil(this.lockoutDuration / 1000);

    // Store lockout information
    sessionStorage.setItem('loginLockout', JSON.stringify({
      expiresAt: lockoutExpiration
    }));

    // Start the countdown timer
    this.startLockoutTimer();
  }

  show() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;

    // Reset error state when closing
    this.showError = false;
    this.errorMessage = '';
  }

  private checkRememberMe() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      const userData = JSON.parse(rememberedUser);
      this.usernameOrEmail = userData.username;
    }
  }

  async login(userNameOrEmail: string, password: string) {
    // Boş değer kontrolü
    if (!userNameOrEmail || !password) {
      this.showError = true;
      this.errorMessage = 'Username/email and password are required';
      return;
    }
    
    // Hesap kilitli ise işlemi engelle
    if (this.isLockedOut) {
      return;
    }
    
    this.loading = true;
    this.showError = false;
    
    // Hızlı ardışık girişimler kontrolü
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastAttemptTime;
    if (timeSinceLastAttempt < 1000 && this.loginAttempts > 0) { // 1 saniyeden kısa sürede ardışık denemeler
      this.showError = true;
      this.errorMessage = 'Please wait a moment before trying again.';
      this.loading = false; // Spinner'ı hemen durdur
      return;
    }
    
    // Son deneme zamanını ve sayacını güncelle
    this.lastAttemptTime = now;

    try {
      // AuthService login metodunu çağırma
      const result = await this.authService.login(userNameOrEmail, password, () => {
        // Başarılı giriş callback'i - deneme sayacını sıfırla
        this.loginAttempts = 0;
        sessionStorage.removeItem('loginAttempts');
        sessionStorage.removeItem('loginLockout');

        // Beni hatırla seçiliyse kullanıcı bilgilerini kaydet
        if (this.rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({
            username: userNameOrEmail
          }));
        } else {
          localStorage.removeItem('rememberedUser');
        }

        // Identity check ve yönlendirme
        this.authService.identityCheck();
        sessionStorage.clear();
        this.activatedRoute.queryParams.subscribe(params => {
          const returnUrl: string = params['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl).then(() => {
              window.location.reload();
            });
          } else {
            this.router.navigate([""]).then(() => {
              window.location.reload();
            });
          }
        });
      });

      // Giriş başarısız - backend'den dönen hata bilgilerini işle
      if (result !== true) {
        // Spinner'ı hemen durduralım
        this.loading = false;
        this.showError = true;
        
        // Backend'den gelen hata bilgilerini kullan
        if (typeof result === 'object') {
          // Hata mesajını göster
          this.errorMessage = result.message || 'Login failed';
          
          // Hesap kilitlenmişse
          if (result.isLockedOut) {
            this.isLockedOut = true;
            
            // Kilit süresini ayarla
            if (result.lockoutSeconds) {
              this.lockoutTimeRemaining = result.lockoutSeconds;
              
              // Kilit bilgilerini oturumda sakla
              sessionStorage.setItem('loginLockout', JSON.stringify({
                expiresAt: Date.now() + (result.lockoutSeconds * 1000)
              }));
              
              // Geri sayım sayacını başlat
              this.startLockoutTimer();
              
              // Özel kilit mesajı
              this.errorMessage = `Your account has been locked for ${Math.ceil(this.lockoutTimeRemaining / 60)} minutes. Please try again later or reset your password.`;
            }
          } 
          // Kilit yoksa ama başarısız girişler varsa
          else if (result.failedAttempts) {
            this.loginAttempts = result.failedAttempts;
            
            // Kalan deneme sayısını göster
            const maxAttempts = 5;
            const remainingAttempts = maxAttempts - this.loginAttempts;
            
            if (remainingAttempts > 0) {
              this.errorMessage += ` (${remainingAttempts} attempts remaining)`;
            }
            
            // Deneme bilgilerini oturumda sakla
            sessionStorage.setItem('loginAttempts', JSON.stringify({
              count: this.loginAttempts,
              lastAttempt: Date.now()
            }));
          }
        } else {
          this.errorMessage = 'Invalid username/email or password';
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError = true;
      this.errorMessage = 'An unexpected error occurred during login. Please try again later.';
      // Hata durumunda yükleniyor durumunu hemen kapat
      this.loading = false;
    } finally {
      // Bu noktada spinner zaten kapatılmış olmalı, ancak sigorta olarak ekleyelim
      if (this.loading) {
        this.loading = false;
      }
    }
  }
  togglePasswordVisibility(event: Event) {
    event.preventDefault(); // Form gönderimi olmaması için
    this.showPassword = !this.showPassword;
  }

  navigateToPasswordReset() {
    this.close();
    this.router.navigate(['/password-reset']);
  }
  
  ngOnDestroy() {
    // Timer'ı temizle
    if (this.lockoutTimerId) {
      clearInterval(this.lockoutTimerId);
    }
  }
}