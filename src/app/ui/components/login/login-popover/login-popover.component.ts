import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { ButtonSpinnerComponent } from 'src/app/base/spinner/button-spinner/button-spinner.component';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-login-popover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonSpinnerComponent],
  templateUrl: './login-popover.component.html',
  styleUrl: './login-popover.component.scss'
})
export class LoginPopoverComponent extends BaseComponent {
  @Output() closePopover = new EventEmitter<void>();
  @Input() triggerElement: HTMLElement | null = null; // Sign in butonunu referansı
  isVisible = false;
  isDarkTheme = false;
  isMobile = false;
  loading: boolean = false;
  rememberMe: boolean = false;

   // Position properties
   popoverX: number = 0;
   popoverY: number = 0;

  // Form değerleri için property'ler
  usernameOrEmail: string = '';
  password: string = '';
  
  // Template'de Math nesnesini kullanabilmek için
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
    spinner: SpinnerService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    super(spinner);
    // Check system theme preference
    this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.checkRememberMe();
    // Mobil kontrol
    this.checkScreenSize();
    // Ekran boyutu değişikliklerini dinle
    window.addEventListener('resize', () => {
      this.checkScreenSize();
      if (this.isVisible && this.triggerElement) {
        this.updatePosition();
      }
    });
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  updatePosition() {
    if (!this.triggerElement) {
      // Trigger element bulunamazsa varsayılan konum
      return;
    }

    const rect = this.triggerElement.getBoundingClientRect();
    const popoverEl = this.el.nativeElement.querySelector('.login-popover');
    
    if (!popoverEl) return;

    if (this.isMobile) {
      // Mobilde ortada göster
      this.renderer.setStyle(popoverEl, 'left', '50%');
      this.renderer.setStyle(popoverEl, 'right', 'auto');
      this.renderer.setStyle(popoverEl, 'transform', 'translateX(-50%)');
    } else {
      // Sign in butonunun altında, sağa hizalı
      const buttonCenter = rect.left + rect.width / 2;
      
      // Popover'ın sağa hizalanması için
      this.renderer.setStyle(popoverEl, 'left', 'auto');
      this.renderer.setStyle(popoverEl, 'right', `${window.innerWidth - (rect.left + rect.width)}px`);
      this.renderer.setStyle(popoverEl, 'transform', 'none');
      
      // Üçgen işaretçi konumu
      const arrow = popoverEl.querySelector('::after');
      if (arrow) {
        this.renderer.setStyle(arrow, 'left', 'auto');
        this.renderer.setStyle(arrow, 'right', `${rect.width / 2}px`);
      }
    }
  }

  show(triggerElement?: HTMLElement) {
    if (triggerElement) {
      this.triggerElement = triggerElement;
    }
    
    this.isVisible = true;
    
    // DOM güncellemesi için bir tick bekle
    setTimeout(() => {
      this.updatePosition();
    }, 0);
  }

  close() {
    this.isVisible = false;
    this.closePopover.emit();

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
        
        // Popover'ı kapat
        this.close();
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

  navigateToRegister() {
    this.close();
    this.router.navigate(['/register']);
  }

  navigateToPasswordReset() {
    this.close();
    this.router.navigate(['/password-reset']);
  }
  
  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }
  
  // Yıkım aşamasında event listener'ı ve timer'ı temizleme
  ngOnDestroy() {
    window.removeEventListener('resize', () => {
      this.checkScreenSize();
      this.updatePosition();
    });
    if (this.lockoutTimerId) {
      clearInterval(this.lockoutTimerId);
    }
  }
}