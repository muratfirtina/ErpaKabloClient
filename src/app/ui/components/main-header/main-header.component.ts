import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { CartService } from 'src/app/services/common/models/cart.service';
import { ComponentName, DynamicloadcomponentService } from 'src/app/services/common/dynamicloadcomponent.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { UserService } from 'src/app/services/common/models/user.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CartComponent } from '../cart/cart.component';
import { DynamicLoadComponentDirective } from 'src/app/directives/dynamic-load-component.directive';

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxSpinnerModule, CartComponent, DynamicLoadComponentDirective],
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss', '../../../../styles.scss']
})
export class MainHeaderComponent implements OnInit {
  @ViewChild(DynamicLoadComponentDirective, { static: true })
  dynamicLoadComponentDirective: DynamicLoadComponentDirective;

  cartItems: any[] = [];
  isDropdownOverlayActive: boolean = false;

  constructor(
    public authService: AuthService,
    private toastrService: CustomToastrService,
    private router: Router,
    private dynamicLoadComponentService: DynamicloadcomponentService,
    private cartService: CartService,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    // `identityCheck` çağrısının tamamlanmasını bekle
    await this.authService.identityCheck();
    if (this.authService.isAuthenticated) {
      await this.getCartItems(); // Kullanıcı giriş yaptıysa sepetteki ürünleri al
      this.loadComponent();
    }
  }

  async getCartItems() {
    this.cartItems = await this.cartService.get(); // Sepet öğelerini al
  }

  signOut() {
    localStorage.removeItem("accessToken");
    this.authService.identityCheck(); // Oturumu kapattıktan sonra kimlik doğrulamasını yeniden kontrol et
    this.router.navigate([""]).then(() => {
      location.reload();
    });
    this.toastrService.message("Logged out successfully", "Log Out", {
      toastrMessageType: ToastrMessageType.Warning,
      position: ToastrPosition.TopRight
    });
  }

  navigateToLogin() {
    const currentUrl = this.router.url; // Mevcut URL'yi al
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: currentUrl },
      relativeTo: this.route
    });
  }

  navigateToRegister() {
    const currentUrl = this.router.url;
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: currentUrl },
      relativeTo: this.route
    });
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  loadComponent() {
    this.dynamicLoadComponentService.loadComponent(ComponentName.CartComponent, this.dynamicLoadComponentDirective.viewContainerRef);
  }

  toggleDropdownOverlay() {
    this.isDropdownOverlayActive = !this.isDropdownOverlayActive;
  }

  openDropdown() {
    this.isDropdownOverlayActive = true;
  }

  closeDropdown() {
    this.isDropdownOverlayActive = false;
  }
}