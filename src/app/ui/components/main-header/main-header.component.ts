import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, map, takeUntil } from 'rxjs';
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
import { AnimationService } from 'src/app/services/common/animation.service';
import { DrawerType, DrawerService } from 'src/app/services/common/drawer.service';
import { StoreService } from 'src/app/services/common/store.service';
import { ThemeService } from 'src/app/services/common/theme.service';
import { LoginPopoverComponent } from '../login/login-popover/login-popover.component';
import { RegisterPopoverComponent } from '../register/register-popover/register-popover.component';

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
  cartItems: CartItem[];
 
  currentUser: UserDto | null = null;
  isLoading: boolean = true;
  isDarkTheme = false;
  DrawerType = DrawerType;
  logoUrl = 'assets/homecard/TUMdex.png';
  topline = 'assets/homecard/top-line.png';
  companySlogan = 'For All Industrial Products';
  
  drawerState$ = this.drawerService.getDrawerState();
  cartItems$ = this.store.select('cart').pipe(map(cart => cart.items));
  userData$ = this.store.select('user').pipe(map(user => user.data));

  showLoginPopover(event: MouseEvent) {
    event.stopPropagation();
    const loginPopover = this.loginPopoverComponent;
    if (loginPopover) {
      loginPopover.show();
    }
  }
  

  showRegisterPopover(event: MouseEvent) {
    event.stopPropagation();
    const registerPopover = this.registerPopoverComponent;
    if (registerPopover) {
      registerPopover.show();
    }
  }
  @ViewChild(RegisterPopoverComponent)
  registerPopoverComponent: RegisterPopoverComponent;

  @ViewChild(LoginPopoverComponent)
  loginPopoverComponent: LoginPopoverComponent;

  constructor(
    private drawerService: DrawerService,
    private themeService: ThemeService,
    private store: StoreService,
    private cartService: CartService,
    private userService: UserService,
    public authService: AuthService,
    public animationService: AnimationService
  ) {}

  createRipple(event: MouseEvent): void {
    const element = event.currentTarget as HTMLElement;
    this.animationService.createRippleEffect(event, element);
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

    this.themeService.getCurrentTheme()
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.isDarkTheme = theme.isDark;
      });

    this.store.select('theme')
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.isDarkTheme = theme.isDark;
      });
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

  toggleDrawer(type: DrawerType): void {
    this.drawerService.toggle(type);
  }

  closeDrawer(): void {
    this.drawerService.close();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}