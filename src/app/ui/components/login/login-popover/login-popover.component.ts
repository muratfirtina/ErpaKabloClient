import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
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
  isVisible = false;
  isDarkTheme = false;
  isMobile = false;
  loading: boolean = false;
  rememberMe: boolean = false;

  // Error handling properties
  errorMessage: string = '';
  showError: boolean = false;
  loginAttempts: number = 0;
  lastAttemptTime: number = 0;
  lockoutDuration: number = 60000; // 60 seconds in milliseconds
  isLockedOut: boolean = false;
  lockoutTimeRemaining: number = 0;
  lockoutTimerId: any = null;

  constructor(
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
    // Mobil kontrol
    this.checkScreenSize();
    // Ekran boyutu değişikliklerini dinle
    window.addEventListener('resize', () => this.checkScreenSize());

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

  show() {
    this.isVisible = true;
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
      setTimeout(() => {
        const usernameInput = document.getElementById('usernameOrEmail') as HTMLInputElement;
        if (usernameInput) {
          usernameInput.value = userData.username;
        }
      });
    }
  }

  async login(userNameOrEmail: string, password: string) {
    // Check if user is locked out
    if (this.isLockedOut) {
      return;
    }

    // Check for rapid consecutive attempts
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastAttemptTime;
    if (timeSinceLastAttempt < 1000 && this.loginAttempts > 0) { // Less than 1 second between attempts
      this.showError = true;
      this.errorMessage = 'Please wait a moment before trying again.';
      return;
    }

    // Update login attempt tracking
    this.lastAttemptTime = now;
    this.loginAttempts++;

    // Store attempt data
    sessionStorage.setItem('loginAttempts', JSON.stringify({
      count: this.loginAttempts,
      lastAttempt: this.lastAttemptTime
    }));

    this.loading = true;
    this.showError = false;

    try {
      // Using the UserAuthService.login method with callback
      const result = await this.authService.login(userNameOrEmail, password, () => {
        // Success callback - will be called by UserAuthService on success
        // Reset attempt counters on successful login
        this.loginAttempts = 0;
        sessionStorage.removeItem('loginAttempts');
        sessionStorage.removeItem('loginLockout');

        // Save user info if "Remember Me" is checked
        if (this.rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({
            username: userNameOrEmail
          }));
        } else {
          localStorage.removeItem('rememberedUser');
        }

        // Identity check and navigation
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

        // Close the login popover/modal if needed
        this.close();
      });

      // If login failed but no exception was thrown
      if (!result) { // Düzeltme burada
        this.handleLoginError("Invalid username/email or password");
      }
    } catch (error) {
      // Handle any exceptions that were thrown during login
      console.error('Login error:', error);

      let errorMessage = 'An unexpected error occurred. Please try again later.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }

      this.handleLoginError(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  private handleLoginError(errorMessage: string) {
    this.showError = true;
    this.errorMessage = errorMessage;

    // Apply lockout after 5 consecutive failed attempts
    if (this.loginAttempts >= 5) {
      this.applyLockout();
      this.errorMessage = `Too many failed login attempts. Please try again in ${this.lockoutTimeRemaining} seconds.`;
    }

    // Display an additional toast notification
    this.toastrService.message(
      this.errorMessage,
      'Login Error',
      {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      }
    );
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
  
  // Yıkım aşamasında event listener'ı temizleme
  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkScreenSize());
    // Varsa, mevcut diğer ngOnDestroy kodları
  }
}