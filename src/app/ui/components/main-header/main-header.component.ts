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
import { UserSidebarComponent } from '../user/user-sidebar/user-sidebar.component';

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    NgxSpinnerModule, 
    CartComponent,
    UserSidebarComponent
  ],
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss']
})
export class MainHeaderComponent implements OnInit {
  @ViewChild('accountButton') accountButton: ElementRef;

  cartItems: CartItem[];
  cartItemsObservable: Observable<CartItem[]>;
  isCartOpen: boolean = false;
  isSidebarOpen: boolean = false;
  currentUser: UserDto | null = null;
  isLoading: boolean = true;
  isMobile: boolean = false;

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
        await this.loadInitialCartItems();
        
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

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    if (this.isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    document.body.style.overflow = 'auto';
  }


  @HostListener('window:keydown.escape')
  onEscPress() {
    if (this.isCartOpen) {
      this.toggleCart();
    }
    if (this.isSidebarOpen) {
      this.closeSidebar();
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  async signOut() {
    await this.authService.logout();
    await this.router.navigate(['']); 
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