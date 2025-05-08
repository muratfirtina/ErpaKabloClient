import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, map, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService } from 'src/app/services/ui/custom-toastr.service';
import { CartService } from 'src/app/services/common/models/cart.service';
import { DynamicloadcomponentService } from 'src/app/services/common/dynamicloadcomponent.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { UserService } from 'src/app/services/common/models/user.service';
import { CartComponent } from '../cart/cart.component';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { UserDto } from 'src/app/contracts/user/userDto';
import { UserSidebarComponent } from '../user/user-sidebar/user-sidebar.component';
import { AnimationService } from 'src/app/services/common/animation.service';
import { DrawerType, DrawerService } from 'src/app/services/common/drawer.service';
import { StoreService } from 'src/app/services/common/store.service';
import { ThemeService } from 'src/app/services/common/theme.service';
import { LoginPopoverComponent } from '../login/login-popover/login-popover.component';

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    NgxSpinnerModule, 
    CartComponent,
    UserSidebarComponent,
    LoginPopoverComponent,
  ],
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss']
})
export class MainHeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private cartUpdateSubscription: any;
  
  // State variables
  cartItems: CartItem[] = [];
  currentUser: UserDto | null = null;
  isLoading: boolean = false;
  isDarkTheme = false;
  DrawerType = DrawerType;
  
  // Assets
  logoUrl = 'assets//icons/TUMdex.png';
  topline = 'assets/homecard/top-line.png';
  companySlogan = 'For All Industrial Products';
  
  // Observables
  drawerState$ = this.drawerService.getDrawerState();
  cartItems$ = this.store.select('cart').pipe(map(cart => cart.items));
  userData$ = this.store.select('user').pipe(map(user => user.data));

  @ViewChild(LoginPopoverComponent)
  loginPopoverComponent: LoginPopoverComponent;

  constructor(
    private drawerService: DrawerService,
    private themeService: ThemeService,
    private store: StoreService,
    private cartService: CartService,
    private userService: UserService,
    private authService: AuthService,
    private animationService: AnimationService,
    private router: Router
  ) {}

  // Ripple effect animation
  createRipple(event: MouseEvent): void {
    const element = event.currentTarget as HTMLElement;
    this.animationService.createRippleEffect(event, element);
  }

  // Authentication check
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  async ngOnInit() {
    this.isLoading = true;
    
    try {
      // Identity check and cart initialization
      await this.authService.identityCheck();
      
      if (this.isAuthenticated) {
        await this.initializeUserData();
      }
    } catch (error) {
      console.error('Error initializing header:', error);
    } finally {
      this.isLoading = false;
    }

    // Theme subscription
    this.themeService.getCurrentTheme()
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.isDarkTheme = theme.isDark;
      });

    // Store subscription 
    this.store.select('theme')
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.isDarkTheme = theme.isDark;
      });
      
    // Cart subscription - optimized to prevent memory leaks
    this.cartUpdateSubscription = this.cartService.getCartItemsObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
      });
  }

  // Initialize user data and cart
  private async initializeUserData() {
    try {
      // Load cart items
      const items = await this.cartService.get();
      this.cartItems = items;
      
      // Load user data
      this.currentUser = await this.userService.getCurrentUser();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Show login popover
  showLoginPopover(event: MouseEvent) {
    event.stopPropagation();
    if (this.loginPopoverComponent) {
      // Event'in hedefini sign-in-content elementi olarak al
      const triggerElement = event.currentTarget as HTMLElement;
      this.loginPopoverComponent.show(triggerElement);
    }
  }

  // Drawer controls
  toggleDrawer(type: DrawerType): void {
    this.drawerService.toggle(type);
  }

  closeDrawer(): void {
    this.drawerService.close();
  }

  // Theme toggle
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
  // Navigations
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
  
  navigateToUserProfile(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/user/profile']);
    } else {
      this.toggleDrawer(DrawerType.UserMenu);
    }
  }

  // Cleanup
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}