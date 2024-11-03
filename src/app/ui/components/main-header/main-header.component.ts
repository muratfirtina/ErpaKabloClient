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
import { CartComponent } from '../cart/cart.component';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { UserDto } from 'src/app/contracts/user/userDto';

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    NgxSpinnerModule, 
    CartComponent
  ],
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss']
})
export class MainHeaderComponent implements OnInit {
  @ViewChild('accountButton') accountButton: ElementRef;

  cartItems: CartItem[];
  cartItemsObservable: Observable<CartItem[]>;
  isDropdownVisible: boolean = false;
  isCartOpen: boolean = false;
  currentUser: UserDto | null = null;
  isLoading: boolean = true;

  constructor(
    public authService: AuthService,
    private toastrService: CustomToastrService,
    private router: Router,
    private cartService: CartService,
    private route: ActivatedRoute,
    private userService: UserService,
    private elementRef: ElementRef
  ) {
    
  }

  async ngOnInit() {
    try {
      await this.authService.identityCheck();
      
      if (this.authService.isAuthenticated) {
        // Önce sepet verilerini yükle
        await this.loadInitialCartItems();
        
        // Sonra observable'a subscribe ol
        this.cartService.getCartItemsObservable().subscribe(
          items => {
            this.cartItems = items;
          }
        );
        
        await this.getCurrentUser();
      }
    } catch (error) {
      console.error('Error in ngOnInit:', error);
    }

    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  private async loadInitialCartItems() {
    try {
      const items = await this.cartService.get();
      this.cartItems = items;
    } catch (error) {
      console.error('Error loading initial cart items:', error);
    }
  }


  async getCurrentUser() {
    this.isLoading = true;
    try {
      this.currentUser = await this.userService.getCurrentUser();
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      this.isLoading = false;
    }
  }

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
    if (this.isCartOpen) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling when cart is open
    } else {
      document.body.style.overflow = ''; // Restore scrolling when cart is closed
    }
  }

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  closeDropdown() {
    this.isDropdownVisible = false;
  }

  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-menu') && !this.accountButton?.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }

  @HostListener('window:keydown.escape')
  onEscPress() {
    if (this.isCartOpen) {
      this.toggleCart();
    }
    if (this.isDropdownVisible) {
      this.closeDropdown();
    }
  }

  signOut() {
    this.authService.logout();
    window.location.reload();
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

  ngOnDestroy() {
    document.body.style.overflow = ''; // Restore scrolling when component is destroyed
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }
}