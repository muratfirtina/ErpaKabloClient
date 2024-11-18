import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DownbarComponent } from '../downbar/downbar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DownbarComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent extends BaseComponent {
  logoUrl = 'assets/homecard/TUMdex.png';

  constructor(
    private userAuthService: UserAuthService,
    spinner: NgxSpinnerService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    super(spinner);
  }

  async login(userNameOrEmail: string, password: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
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
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }
}