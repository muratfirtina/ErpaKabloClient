import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CreateUser } from 'src/app/contracts/user/createUser';
import { User } from 'src/app/contracts/user/user';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { ValidationService } from 'src/app/services/common/validation.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { DownbarComponent } from '../downbar/downbar.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { ButtonSpinnerComponent } from 'src/app/base/spinner/button-spinner/button-spinner.component';
import { PrivacyPolicyComponent } from 'src/app/dialogs/privacy/privacy-policy/privacy-policy.component';
import { TermsOfUseComponent } from 'src/app/dialogs/privacy/terms-of-use/terms-of-use.component';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    DownbarComponent, 
    RouterModule, 
    ButtonSpinnerComponent,
    TermsOfUseComponent,
    PrivacyPolicyComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent extends BaseComponent implements OnInit {
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private userAuthService: UserAuthService,
    private validationService: ValidationService,
    private toastrService: CustomToastrService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  logoUrl = 'assets/homecard/TUMdex.png';
  frm: FormGroup;
  passwordRequirements = {
    uppercase: false,
    lowercase: false,
    symbol: false,
    length: false
  };
  submitted: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  loading: boolean = false;

  ngOnInit(): void {
    this.frm = this.formBuilder.group({
      nameSurname: ['', {
        validators: [
          Validators.required,
          this.validationService.nameSurnameValidator,
          this.validationService.inputSanitizer
        ],
        updateOn: 'blur'
      }],
      userName: ['', {
        validators: [
          Validators.required,
          this.validationService.userNameValidator,
          this.validationService.inputSanitizer
        ],
        updateOn: 'blur'
      }],
      email: ['', {
        validators: [
          Validators.required,
          this.validationService.emailValidator
        ],
        updateOn: 'blur'
      }],
      password: ['', {
        validators: [
          Validators.required,
          this.validationService.passwordValidator
        ],
        updateOn: 'change'
      }],
      confirmPassword: ['', {
        validators: [
          Validators.required,
          this.validationService.passwordsMatchValidator
        ],
        updateOn: 'change'
      }],
      agreeToTerms: [false, Validators.requiredTrue]
    });

    this.subscribeToPasswordChanges();
  }

  private subscribeToPasswordChanges(): void {
    this.frm.get('password').valueChanges.subscribe((password: string) => {
      const control = this.frm.get('password');
      const validationResult = this.validationService.passwordValidator(control);
      
      this.passwordRequirements = validationResult?.passwordRequirements || {
        uppercase: false,
        lowercase: false,
        symbol: false,
        length: false
      };
  
      // Şifre gereksinimlerini karşılamıyorsa invalid işaretle
      if (validationResult) {
        control.setErrors(validationResult);
      }
  
      // Confirm password'ü tekrar validate et
      this.frm.get('confirmPassword').updateValueAndValidity();
    });
  }

  get component() { return this.frm.controls; }

  async onSubmit(user: User) {
    if (this.submitted) return;
    this.submitted = true;
    this.loading = true;
  
    if (this.frm.invalid) {
      const firstError = document.querySelector('.is-invalid');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      this.loading = false;
      this.submitted = false;
      return;
    }
  
    this.loading = true;
    try {
      const result: CreateUser = await this.userService.create(user);
  
      if (result.isSuccess) {
        this.toastrService.message(
          "Please check your email to activate your account.",
          "Registration Successful",
          {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          }
        );
  
        // Kullanıcıyı aktivasyon bilgilendirme sayfasına yönlendir
        this.router.navigate(['/activation-info'], {
          queryParams: { email: user.email }
        });
      } else {
        this.toastrService.message(result.message, "Registration Failed", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      this.toastrService.message(
        "An error occurred during registration. Please try again.",
        "Registration Error",
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    } finally {
      this.loading = false;
      this.submitted = false;
    }
  }

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
}