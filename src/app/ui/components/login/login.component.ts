import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DownbarComponent } from '../downbar/downbar.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { ButtonSpinnerComponent } from 'src/app/base/spinner/button-spinner/button-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DownbarComponent,
    ButtonSpinnerComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent extends BaseComponent {
  logoUrl = 'assets/homecard/TUMdex.png';
  loading: boolean = false;

  constructor(
    private userAuthService: UserAuthService,
    spinner: SpinnerService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    super(spinner);
  }

  async login(userNameOrEmail: string, password: string) {
    this.loading = true;
    try {
      await this.userAuthService.login(userNameOrEmail, password, () => {
        this.authService.identityCheck();
        sessionStorage.clear();
        this.activatedRoute.queryParams.subscribe(params => {
          const returnUrl: string = params['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigate([""]);
          }
        });
      });
    } finally {
      this.loading = false;
    }
  }
}