import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent extends BaseComponent {
  isEmailSent: boolean = false;
  resendTimer: number = 0;
  canResend: boolean = true;
  email: string = '';

  constructor(
    spinner: NgxSpinnerService,
    private userAuthService: UserAuthService,
    private toastr: CustomToastrService
  ) {
    super(spinner);
  }

  async sendPasswordResetEmail() {
    if (!this.email) {
        this.toastr.message('Please enter your email address', 'Warning', {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
        });
        return;
    }

    try {
        this.showSpinner(SpinnerType.BallSpinClockwise);
        const result = await this.userAuthService.passwordReset(this.email);
        
        // Başarılı durum
        if (result) {
            this.isEmailSent = true;
            this.canResend = false;
            this.startResendTimer();
            
            this.toastr.message('Password reset link has been sent to your email', 'Success', {
                toastrMessageType: ToastrMessageType.Success,
                position: ToastrPosition.TopRight
            });
        }
    } catch (error: any) {
        console.error('Password reset error:', error);
        
        // API'den gelen hata mesajını kullan veya varsayılan mesaj göster
        const errorMessage = error.error?.message || 'Failed to send reset link. Please try again.';
        
        this.toastr.message(errorMessage, 'Error', {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
        });
    } finally {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
}

  startResendTimer() {
    this.resendTimer = 20;
    const timer = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.canResend = true;
        clearInterval(timer);
      }
    }, 1000);
  }
}