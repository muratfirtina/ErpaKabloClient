import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-confirmed-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirmed-email.component.html',
  styleUrl: './confirmed-email.component.scss'
})
export class ConfirmedEmailComponent implements OnInit, OnDestroy {
  loading = true;
  isSuccess = false;
  userId: string = '';
  token: string = '';
  errorMessage = 'We could not verify your email. The link may have expired or is invalid.';
  
  isResending: boolean = false;
  timeRemaining: number = 0;
  countdownInterval: any;
  userEmail: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userAuthService: UserAuthService,
    private toastrService: CustomToastrService
  ) {}
  
  ngOnInit() {
    // Servisin rate limit verilerini başlat
    this.userAuthService.initializeRateLimits();
    
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.userId || !this.token) {
      this.loading = false;
      this.isSuccess = false;
      return;
    }
    
    this.verifyEmail();
  }
  
  ngOnDestroy() {
    // Component destroy edildiğinde interval'i temizle
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  
  async verifyEmail() {
    try {
      const response = await this.userAuthService.confirmEmail(this.userId, this.token);
      this.loading = false;
      this.isSuccess = response.isSuccess;
      if (this.isSuccess) {
        setTimeout(() => this.redirectToLogin(), 3000);
      } else {
        this.errorMessage = response.message || this.errorMessage;
      }
    } catch (error) {
      this.loading = false;
      this.isSuccess = false;
      this.errorMessage = error.message || this.errorMessage;
    }
  }
  
  redirectToLogin() {
    this.router.navigate(['/login']);
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
    if (this.userEmail) {
      this.timeRemaining = this.userAuthService.getResendTimeRemaining(this.userEmail);
    }
  }
  
  async resendConfirmationEmail() {
    // Kullanıcıdan email al
    const email = prompt('Please enter your email address:');
    if (!email) return;
    
    this.userEmail = email;
    
    // E-posta için hız sınırlaması kontrolü
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
      await this.userAuthService.resendConfirmationEmail(email);
      this.startCountdown(); // Sayacı başlat
    } catch (error) {
      // Hata servisteki toastr tarafından gösterilecek
      console.error('Failed to resend email:', error);
    } finally {
      this.isResending = false;
    }
  }
}