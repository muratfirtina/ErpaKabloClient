import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { ValidationService } from 'src/app/services/common/validation.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-register-popover',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './register-popover.component.html',
  styleUrl: './register-popover.component.scss'
})
export class RegisterPopoverComponent extends BaseComponent {
  @Output() closePopover = new EventEmitter<void>();
  @Output() openLoginPopover = new EventEmitter<void>();

  isVisible = false;
  isDarkTheme = false;
  frm: FormGroup;
  submitted = false;
  
  passwordRequirements = {
    uppercase: false,
    lowercase: false,
    symbol: false,
    length: false
  };

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private userAuthService: UserAuthService,
    private validationService: ValidationService,
    private toastrService: CustomToastrService,
    private authService: AuthService,
    spinner: SpinnerService,
    private el: ElementRef
  ) {
    super(spinner);
    this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.createForm();

    // Dark mode değişikliklerini dinle
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDarkTheme = e.matches;
    });
  }

  createForm() {
    this.frm = this.formBuilder.group({
      nameSurname: ['', [
        Validators.required,
        this.validationService.nameSurnameValidator,
        this.validationService.inputSanitizer
      ]],
      userName: ['', [
        Validators.required,
        this.validationService.userNameValidator,
        this.validationService.inputSanitizer
      ]],
      email: ['', [
        Validators.required,
        this.validationService.emailValidator,
        this.validationService.inputSanitizer
      ]],
      password: ['', [
        Validators.required,
        this.validationService.passwordValidator
      ]],
      confirmPassword: ['', [
        Validators.required,
        this.validationService.passwordsMatchValidator
      ]]
    });

    // Password değişikliklerini izle
    this.frm.get('password').valueChanges.subscribe(
      (password: string) => {
        const validationResult = this.validationService.passwordValidator(this.frm.get('password'));
        if (validationResult?.passwordRequirements) {
          this.passwordRequirements = validationResult.passwordRequirements;
        }
      }
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Popover dışına tıklandığında kapat
    if (this.isVisible && !this.el.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('keydown.escape')
  onEscapePress() {
    // ESC tuşuna basıldığında kapat
    if (this.isVisible) {
      this.close();
    }
  }

  show() {
    this.isVisible = true;
    this.submitted = false;
    this.frm.reset();
    this.passwordRequirements = {
      uppercase: false,
      lowercase: false,
      symbol: false,
      length: false
    };
  }

  close() {
    this.isVisible = false;
    this.closePopover.emit();
  }

  switchToLogin() {
    this.close();
    this.openLoginPopover.emit();
  }

  get component() {
    return this.frm.controls;
  }

  async onSubmit(user: any) {
    this.submitted = true;
    if (this.frm.invalid) {
      // Form invalid ise scroll to first error
      const firstError = document.querySelector('.is-invalid');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      const result = await this.userService.create(user);
      
      if (result.isSuccess) {
        this.toastrService.message(result.message, "Registration Successful", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        
        // Otomatik login
        try {
          await this.userAuthService.login(user.userName, user.password, () => {
            this.authService.identityCheck();
            this.close();
          });
        } catch (loginError) {
          console.error("Login error:", loginError);
          this.toastrService.message(
            "Registration successful but automatic login failed. Please try logging in manually.", 
            "Login Error", {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.TopRight
            }
          );
          this.switchToLogin();
        }
      } else {
        this.toastrService.message(
          result.message || "Registration failed", 
          "Error", {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      this.toastrService.message(
        "An unexpected error occurred during registration. Please try again.", 
        "Error", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  // Form reset
  resetForm() {
    this.frm.reset();
    this.submitted = false;
    this.passwordRequirements = {
      uppercase: false,
      lowercase: false,
      symbol: false,
      length: false
    };
  }

  // Component destroy edildiğinde
  ngOnDestroy() {
    // Event listener'ları temizle
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => {});
  }
}