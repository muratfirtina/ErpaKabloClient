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

  logoUrl = 'assets/icons/TUMdex.png';
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
  
      // Mark as invalid if password doesn't meet requirements
      if (validationResult) {
        control.setErrors(validationResult);
      }
  
      // Revalidate confirm password
      this.frm.get('confirmPassword').updateValueAndValidity();
    });
  }

  get component() { return this.frm.controls; }

  async onSubmit(user: User) {
    if (this.submitted || this.loading) return;
    this.submitted = true;
    this.loading = true;
    
    // Show spinner
    this.showSpinner(SpinnerType.SquareLoader);
    
    // 30 second timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 30000);
    });
    
    try {
      // Perform registration with timeout check using Promise.race
      const result: CreateUser = await Promise.race([
        this.userService.create(user),
        timeoutPromise
      ]) as CreateUser;
      
      if (result.isSuccess) {
        this.toastrService.message(
          "Your registration has been successfully created. Your activation code has been sent to your email address.",
          "Registration Successful",
          {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          }
        );
        
        // Redirect with token if available, otherwise with userId and email
        if (result.activationToken) {
          
          // Redirect with token
          this.router.navigate(['/activation-code'], {
            queryParams: {
              token: result.activationToken
            }
          }).then(navigated => {
            if (!navigated) {
              console.error('Redirection to activation page failed');
              // Use window.location as an alternative method
              window.location.href = `/activation-code?token=${encodeURIComponent(result.activationToken)}`;
            }
          });
        } else {
          // Redirect with userId and email (backup method)
          
          this.router.navigate(['/activation-code'], {
            queryParams: {
              userId: result.userId,
              email: user.email
            }
          }).then(navigated => {
            if (!navigated) {
              console.error('Redirection to activation page failed');
              // Use window.location as an alternative method
              window.location.href = `/activation-code?userId=${encodeURIComponent(result.userId)}&email=${encodeURIComponent(user.email)}`;
            }
          });
        }
      } else {
        this.toastrService.message(result.message, "Registration Error", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    } catch (error) {
      // Handle timeout or other errors with appropriate message
      let errorMessage = "An error occurred during the registration process.";
      
      if (error.message === "Request timed out") {
        errorMessage = "Server did not respond. Please try again later.";
        
        // Offer the user the option to go to the activation page
        this.toastrService.message(
          "The registration process may have completed, but we didn't receive a response. Would you like to go to the activation page?",
          "Process Uncertain",
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      }
      
      console.error("Registration error:", error);
      this.toastrService.message(errorMessage, "Registration Error", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      // Hide spinner
      this.hideSpinner(SpinnerType.SquareLoader);
      
      // Reset state, with a short delay to prevent double clicks
      setTimeout(() => {
        this.loading = false;
        this.submitted = false;
      }, 1000);
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