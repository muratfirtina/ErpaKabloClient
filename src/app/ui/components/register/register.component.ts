import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CreateUser } from 'src/app/contracts/user/createUser';
import { User } from 'src/app/contracts/user/user';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { DownbarComponent } from '../downbar/downbar.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,DownbarComponent,RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent extends BaseComponent implements OnInit {

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private userAuthService: UserAuthService,
    private toastrService: CustomToastrService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    spinner: NgxSpinnerService
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

  ngOnInit(): void {
    this.frm = this.formBuilder.group({
      nameSurname: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(16)]],
      confirmPassword: ['', [Validators.required, this.passwordsMatchValidator.bind(this)]]
    });

    this.frm.get('password').valueChanges.subscribe(
      (password: string) => {
        this.updatePasswordRequirements(password);
      }
    );
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
    const value: string = control.value;
    const hasUpperCase = /[A-Z]+/.test(value);
    const hasLowerCase = /[a-z]+/.test(value);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
    const isLongEnough = value.length >= 8;
  
    const valid = hasUpperCase && hasLowerCase && hasSymbol && isLongEnough;
    return valid ? null : { 'passwordStrength': true };
  }
  
  get component() { return this.frm.controls; }

  submitted: boolean = false;

  async onSubmit(user: User) {
    this.submitted = true;
    if (this.frm.invalid) return;
  
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    try {
      const result: CreateUser = await this.userService.create(user);
  
      if (result.isSuccess) {
        this.toastrService.message(result.message, "User Created Successfully", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
  
        await new Promise(resolve => setTimeout(resolve, 1000));
  
        try {
          await new Promise<void>((resolve, reject) => {
            this.userAuthService.login(user.userName || user.email, user.password, () => {
              resolve();
            });
          });
  
          await this.authService.identityCheck();
          
          await new Promise(resolve => setTimeout(resolve, 1000));
  
          const returnUrl: string = this.activatedRoute.snapshot.queryParams["returnUrl"];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigateByUrl("/").then(() => {
              location.reload();
            });
          }
        } catch (loginError) {
          console.error("Login error:", loginError);
          this.toastrService.message("An unexpected error occurred during automatic login. Please try logging in manually.", "Login Error", {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          });
          this.router.navigateByUrl("/login");
        }
      } else {
        this.toastrService.message(result.message, "User Creation Failed", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      this.toastrService.message("An error occurred during registration. Please try again.", "Registration Error", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
}