import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-activation-info',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activation-info.component.html',
  styleUrl: './activation-info.component.scss'
})
export class ActivationInfoComponent implements OnInit, OnDestroy {
  email: string = '';
  isResending: boolean = false;
  timeRemaining: number = 0;
  countdownInterval: any;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userAuthService: UserAuthService,
    private toastrService: CustomToastrService
  ) {}
  
  ngOnInit() {
    // Servisin rate limit verilerini başlat
    this.userAuthService.initializeRateLimits();
    
    // Get email from query params or session storage
    this.email = this.route.snapshot.queryParams['email'] || sessionStorage.getItem('activationEmail') || '';
    
    // If email exists in query params, store it in session storage and clean URL
    if (this.route.snapshot.queryParams['email']) {
      sessionStorage.setItem('activationEmail', this.email);
      // Clean up URL by removing email parameter
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { email: null },
        queryParamsHandling: 'merge'
      });
    }
    
    // Kalan süreyi kontrol et
    if (this.email) {
      this.updateTimeRemaining();
      this.startCountdown();
    }
  }
  
  ngOnDestroy() {
    // Component destroy edildiğinde interval'i temizle
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  
  // Geri sayımı başlat
  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.countdownInterval = setInterval(() => {
      this.updateTimeRemaining();
      if (this.timeRemaining <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }
  
  // Kalan süreyi güncelle
  updateTimeRemaining() {
    if (this.email) {
      this.timeRemaining = this.userAuthService.getResendTimeRemaining(this.email);
    }
  }
  
  async resendConfirmationEmail() {
    if (!this.email) {
      this.toastrService.message(
        "Email Missing",
        'Email address not found. Please contact support.',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
      return;
    }
    
    // Son kontrol - eğer hala süre varsa
    this.updateTimeRemaining();
    if (this.timeRemaining > 0) {
      this.toastrService.message(
        "Please wait",
        `You can resend in ${this.timeRemaining} seconds`,
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
      return;
    }
    
    this.isResending = true;
    
    try {
      await this.userAuthService.resendConfirmationEmail(this.email);
      this.startCountdown(); // Sayacı yeniden başlat
    } catch (error) {
      // Hata servisteki toastr tarafından gösterilecek
      console.error('Failed to resend email:', error);
    } finally {
      this.isResending = false;
    }
  }
}