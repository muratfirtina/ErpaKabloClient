import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Category } from 'src/app/contracts/category/category';
import { DynamicLoadComponentDirective } from 'src/app/directives/dynamic-load-component.directive';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { CartService } from 'src/app/services/common/models/cart.service';
import { ComponentName, DynamicloadcomponentService } from 'src/app/services/common/dynamicloadcomponent.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserService } from 'src/app/services/common/models/user.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CartComponent } from '../cart/cart.component';


@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [CommonModule, RouterModule,FormsModule,NgxSpinnerModule, CartComponent ,DynamicLoadComponentDirective],
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss','../../../../styles.scss']
})
export class MainHeaderComponent implements OnInit {
  @ViewChild(DynamicLoadComponentDirective, { static: true })
  dynamicLoadComponentDirective: DynamicLoadComponentDirective;

  cartItems: CartItem[]
  cartItemsObservable: Observable<CartItem[]> // Observable'ı tanımla

  isDropdownOverlayActive: boolean = false;

  constructor(
    public authService: AuthService,
    private toastrService: CustomToastrService,
    private router: Router,
    private dynamicLoadComponentService: DynamicloadcomponentService,
    private cartService: CartService,
    private userService: UserService,
    private route: ActivatedRoute,
    private jwtHelper: JwtHelperService
    ) {
    authService.identityCheck();
    this.cartItemsObservable = cartService.getCartItemsObservable();
  }
  async ngOnInit() {
    await this.authService.identityCheck();
    console.log(this.authService.isAdmin);
    if (this.authService.isAuthenticated) {
      await this.getCartItems();
      this.loadComponent();
    }
    this.cartItemsObservable.subscribe(cartItems => {
      this.cartItems = cartItems; // Yeni sepet öğelerini güncelle
    });
  }
  
  async getCartItems() {
    this.cartItems = await this.cartService.get();
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
    // Mevcut URL'yi al
    const currentUrl = this.router.url;
    
    // Login sayfasına yönlendir ve mevcut URL'yi returnUrl olarak ekle
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