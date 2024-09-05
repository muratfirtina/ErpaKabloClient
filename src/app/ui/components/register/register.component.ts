import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CreateUser } from 'src/app/contracts/user/createUser';
import { User } from 'src/app/contracts/user/user';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
    this.showSpinner(SpinnerType.BallSpinClockwise);

    this.authService.identityCheck();
    this.hideSpinner(SpinnerType.BallSpinClockwise)
  }

  frm: FormGroup;

  ngOnInit(): void {
    this.frm = this.formBuilder.group({
      nameSurname: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(3), this.passwordsMatchValidator.bind(this)]]
    });
  }

  passwordsMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.root.get('password');
    return password && control.value !== password.value ? { 'notSame': true } : null;
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
  
        // Kısa bir bekleme süresi ekleyelim (backend'in kullanıcıyı tamamen oluşturması için)
        await new Promise(resolve => setTimeout(resolve, 1000));
  
        try {
          await new Promise<void>((resolve, reject) => {
            this.userAuthService.login(user.userName || user.email, user.password, () => {
              resolve();
            });
          });
  
          // Login başarılı olduysa
          await this.authService.identityCheck();
          
          // 2 saniye bekle
          await new Promise(resolve => setTimeout(resolve, 2000));
  
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
          // Kullanıcıyı login sayfasına yönlendir
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