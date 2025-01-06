import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { DownbarComponent } from '../downbar/downbar.component';
import { UserService } from 'src/app/services/common/models/user.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DownbarComponent],
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.scss']
})
export class UpdatePasswordComponent extends BaseComponent implements OnInit {
  updatePasswordForm: FormGroup;
  state: boolean = false;
  userId: string;
  resetToken: string;
  
  passwordRequirements = {
    uppercase: false,
    lowercase: false,
    symbol: false,
    length: false
  };

  constructor(
    private formBuilder: FormBuilder,
    private userAuthService: UserAuthService,
    private userService: UserService,
    private toastr: CustomToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    spinner: SpinnerService
  ) {
    super(spinner);
    this.initializeForm();
  }

  private initializeForm() {
    this.updatePasswordForm = this.formBuilder.group({
      password: ['', [
        Validators.required,
        this.passwordStrengthValidator.bind(this)
      ]],
      passwordConfirm: ['', [
        Validators.required,
        this.passwordsMatchValidator.bind(this)
      ]]
    });

    this.updatePasswordForm.get('password')?.valueChanges.subscribe(
      (password: string) => {
        this.updatePasswordRequirements(password || '');
      }
    );
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      this.userId = this.activatedRoute.snapshot.paramMap.get('userId');
      this.resetToken = this.activatedRoute.snapshot.paramMap.get('resetToken');
      
      if (!this.userId || !this.resetToken) {
        throw new Error('Invalid password reset link');
      }
  
      // Token'ı doğrula
      const isValid = await this.userAuthService.verifyResetPasswordToken(
        this.resetToken,
        this.userId
      );
  
      if (!isValid) {
        throw new Error('Invalid or expired reset token');
      }
  
      this.state = true; // Token geçerli ise form gösterilsin
    } catch (error) {
      this.toastr.message(error.message || 'Error verifying reset token', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      await this.router.navigate(['/login']);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  updatePasswordRequirements(password: string) {
    this.passwordRequirements = {
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password),
      length: password.length >= 8
    };
  }

  passwordsMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.root.get('password');
    return password && control.value !== password.value ? { 'notSame': true } : null;
  }

  passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value: string = control.value || '';
    
    if (!value && !control.hasValidator(Validators.required)) {
      return null;
    }

    const hasUpperCase = /[A-Z]+/.test(value);
    const hasLowerCase = /[a-z]+/.test(value);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
    const isLongEnough = value.length >= 8;
  
    const valid = hasUpperCase && hasLowerCase && hasSymbol && isLongEnough;
    
    this.passwordRequirements = {
      uppercase: hasUpperCase,
      lowercase: hasLowerCase,
      symbol: hasSymbol,
      length: isLongEnough
    };

    return valid ? null : { 'passwordStrength': true };
  }

  async onSubmit() {
    if (this.updatePasswordForm.invalid) return;
  
    try {
      this.showSpinner(SpinnerType.BallSpinClockwise);
      const { password, passwordConfirm } = this.updatePasswordForm.value;
  
      await this.userAuthService.updateForgotPassword(
        password,
        passwordConfirm,
        this.userId,
        this.resetToken
      );
  
      this.toastr.message('Password updated successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      
      await this.router.navigate(['/login']);
    } catch (error) {
      this.toastr.message('Error updating password', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
}