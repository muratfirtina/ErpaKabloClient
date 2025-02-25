import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { ButtonSpinnerComponent } from 'src/app/base/spinner/button-spinner/button-spinner.component';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-login-popover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonSpinnerComponent],
  templateUrl: './login-popover.component.html',
  styleUrl: './login-popover.component.scss'
})
export class LoginPopoverComponent extends BaseComponent {
  @Output() closePopover = new EventEmitter<void>();
  isVisible = false;
  isDarkTheme = false;
  loading: boolean = false;
  rememberMe: boolean = false;

  constructor(
    private userAuthService: UserAuthService,
    spinner: SpinnerService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private el: ElementRef
  ) {
    super(spinner);
    // Check system theme preference
    this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.checkRememberMe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  show() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
    this.closePopover.emit();
  }

  private checkRememberMe() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      const userData = JSON.parse(rememberedUser);
      setTimeout(() => {
        const usernameInput = document.getElementById('usernameOrEmail') as HTMLInputElement;
        if (usernameInput) {
          usernameInput.value = userData.username;
        }
      });
    }
  }

  async login(userNameOrEmail: string, password: string) {
    this.loading = true;
    try {
      await this.userAuthService.login(userNameOrEmail, password, () => {
        // Remember me seçiliyse kullanıcı bilgilerini kaydet
        if (this.rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({
            username: userNameOrEmail
          }));
        } else {
          localStorage.removeItem('rememberedUser');
        }

        this.authService.identityCheck();
        sessionStorage.clear();
        this.activatedRoute.queryParams.subscribe(params => {
          const returnUrl: string = params['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl).then(() => {
              window.location.reload();
            });
          } else {
            this.router.navigate([""]).then(() => {
              window.location.reload();
            });
          }
        });
      });
    } finally {
      this.loading = false;
    }
  }
}