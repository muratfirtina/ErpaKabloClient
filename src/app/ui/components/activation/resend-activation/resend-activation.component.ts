import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-resend-activation',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './resend-activation.component.html',
  styleUrl: './resend-activation.component.scss'
})
export class ResendActivationComponent {
  email: string = '';

  constructor(
    private userAuthService: UserAuthService,
    private userService: UserService,
    private toastrService: CustomToastrService
  ) {}

  async resendActivationEmail() {
    if (!this.email) {
      this.toastrService.message("Please enter your email address.", "Error", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return;
    }

    try {
      await this.userAuthService.resendConfirmationEmail(this.email);
      this.toastrService.message(
        "Activation email has been resent. Please check your email.",
        "Success",
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
    } catch (error) {
      this.toastrService.message(
        "An error occurred while resending the activation email.",
        "Error",
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    }
  }
}