import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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
import { CartItem } from 'src/app/contracts/cart/cartItem';

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

  @ViewChild('accountButton') accountButton: ElementRef; // Account butonuna referans

  cartItems: CartItem[];
  cartItemsObservable: Observable<CartItem[]>;
  isDropdownVisible: boolean = false;

  constructor(
    public authService: AuthService,
    private toastrService: CustomToastrService,
    private router: Router,
    private cartService: CartService,
    private route: ActivatedRoute,
    private dynamicLoadComponentService: DynamicloadcomponentService,
    private elementRef: ElementRef // HTML elemanlarına erişim için kullanıyoruz
  ) {
    authService.identityCheck();
    this.cartItemsObservable = cartService.getCartItemsObservable();
  }

  async ngOnInit() {
    await this.authService.identityCheck();
    if (this.authService.isAuthenticated) {
      await this.getCartItems();
    }

    // Dışarıya tıklayınca dropdown menüsünü kapatma işlevi
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  async getCartItems() {
    this.cartItems = await this.cartService.get();
  }
  loadComponent() {
    this.dynamicLoadComponentService.loadComponent(ComponentName.CartComponent, this.dynamicLoadComponentDirective.viewContainerRef);
  }

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  closeDropdown() {
    this.isDropdownVisible = false;
  }

  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Dropdown ya da account butonuna tıklanmadıysa dropdown'u kapat
    if (!target.closest('.dropdown-menu') && !this.accountButton.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }

  signOut() {
    localStorage.removeItem("accessToken");
    this.authService.identityCheck();
    this.router.navigate([""]).then(() => {
      location.reload();
    });
    this.toastrService.message("Logged out successfully", "Log Out", {
      toastrMessageType: ToastrMessageType.Warning,
      position: ToastrPosition.TopRight
    });
  }

  navigateToLogin() {
    const currentUrl = this.router.url;
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
}

  
