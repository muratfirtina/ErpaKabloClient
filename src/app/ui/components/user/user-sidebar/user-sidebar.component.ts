import { Component, OnInit, ElementRef, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoreService } from 'src/app/services/common/store.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from 'src/app/services/common/models/user.service';
import { BaseDrawerComponent } from '../../base-drawer.component';
import { AnimationService } from 'src/app/services/common/animation.service';
import { ThemeService } from 'src/app/services/common/theme.service';
import { DrawerService } from 'src/app/services/common/drawer.service';
import { Roles } from 'src/app/contracts/user/roles';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

// Import Bootstrap Modal
declare var bootstrap: any;

interface UserData {
  name: string;
  nameSurname: string;
  email: string;
}

interface MenuItem {
  id: number;
  label: string;
  icon: string;
  route: string;
  roles?: Roles[];
}

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-sidebar.component.html',
  styleUrls: ['./user-sidebar.component.scss']
})
export class UserSidebarComponent extends BaseDrawerComponent implements OnInit, AfterViewInit {
  @Output() closeCart = new EventEmitter<void>();

  userNameSurname: string | undefined;
  userData$: Observable<UserData | null>;
  currentRoute: string = '';
  isLoggingOut: boolean = false;

  // Modal references
  private logoutModal: any;
  private logoutAllDevicesModal: any;

  readonly Roles = Roles;

  // isAdmin getter
  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }
  
  // All menu items defined here
  readonly menuItems: MenuItem[] = [
    { id: 1, label: 'Admin Panel', icon: 'fas fa-user-shield', route: '/admin', roles: [Roles.ADMIN] },
    { id: 2, label: 'My Orders', icon: 'fas fa-box', route: '/order'},
    { id: 3, label: 'My Profile', icon: 'fas fa-user', route: '/user'},
    { id: 4, label: 'Favorites', icon: 'fas fa-heart', route: '/my-favorites'},
    { id: 5, label: 'Sign Out', icon: 'fas fa-sign-out-alt', route: 'logout'},
    { id: 6, label: 'Sign Out From All Devices', icon: 'fas fa-sign-out-alt', route: 'logout-all-devices' }
  ];

  // Visible menu items filter
  get visibleMenuItems(): MenuItem[] {
    return this.menuItems.filter(item => {
      if (!item.roles) return true;
      
      if (item.roles.includes(Roles.ADMIN)) {
        return this.isAdmin;
      }
      
      return true;
    });
  }

  constructor(
    elementRef: ElementRef,
    animationService: AnimationService,
    themeService: ThemeService,
    spinner: SpinnerService,
    private store: StoreService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private drawerService: DrawerService,
    public authService: AuthService,
    private toastrService: CustomToastrService
  ) {
    super(spinner, elementRef, animationService, themeService);
    this.userData$ = this.store.select('user').pipe(
      map(userState => userState.data as UserData)
    );
    this.currentRoute = this.router.url;
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.userService.getCurrentUser().then(user => {
        this.userNameSurname = user.nameSurname.toUpperCase();
      }).catch(error => {
        console.error('Error getting current user:', error);
      });
    }
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngAfterViewInit(): void {
    // Initialize Bootstrap modals after view init
    this.initModals();
  }

  // Initialize Bootstrap modals
  initModals(): void {
    // Get modal elements
    const logoutModalEl = document.getElementById('logoutModal');
    const logoutAllDevicesModalEl = document.getElementById('logoutAllDevicesModal');

    // Create Bootstrap modal instances if elements exist
    if (logoutModalEl) {
      this.logoutModal = new bootstrap.Modal(logoutModalEl);
    }

    if (logoutAllDevicesModalEl) {
      this.logoutAllDevicesModal = new bootstrap.Modal(logoutAllDevicesModalEl);
    }
  }

  override close() {
    this.isOpen = false;
    this.closeCart.emit();
    // Fix body overflow
    document.body.style.overflow = 'auto';
    // Use drawer service to ensure complete closure
    this.drawerService.close();
  }

  // Close on overlay click
  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('sidebar-overlay')) {
      this.close();
    }
  }

  navigateTo(route: string): void {
    if (route === 'logout') {
      this.showLogoutModal();
      return;
    }
    if (route === 'logout-all-devices') {
      this.showLogoutAllDevicesModal();
      return;
    }
    this.router.navigate([route]);
    this.close();
  }

  // Show the logout confirmation modal
  showLogoutModal(): void {
    if (this.logoutModal) {
      this.logoutModal.show();
    }
  }

  // Show the logout from all devices confirmation modal
  showLogoutAllDevicesModal(): void {
    if (this.logoutAllDevicesModal) {
      this.logoutAllDevicesModal.show();
    }
  }

  // Confirm regular logout
  async confirmLogout(): Promise<void> {
    await this.authService.logout();
    if (this.logoutModal) {
      this.logoutModal.hide();
    }
    this.close();
  }

  // Confirm logout from all devices
  async confirmLogoutFromAllDevices(): Promise<void> {
    try {
      // Show loading state
      this.isLoggingOut = true;
      
      // Show process message
      this.toastrService.message('Logging out from all devices...', 'Process in Progress', {
        toastrMessageType: ToastrMessageType.Info,
        position: ToastrPosition.TopRight,
      });
      
      // Perform logout operation
      console.log("Initiating logout from all devices...");
      const success = await this.authService.logoutFromAllDevices();
      
      if (success) {
        console.log("Logout from all devices successful, redirecting to login page...");
        
        // Hide the modal
        if (this.logoutAllDevicesModal) {
          this.logoutAllDevicesModal.hide();
        }
        
        this.router.navigate(['/login']);
      } else {
        console.error("Logout from all devices failed");
        this.toastrService.message('Could not log out from all devices. Please try again.', 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight,
        });
      }
    } catch (error) {
      console.error('An error occurred while logging out from all devices:', error);
      this.toastrService.message('An error occurred while logging out from all devices', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight,
      });
    } finally {
      // Close loading state
      this.isLoggingOut = false;
    }
  }

  navigateToLogin(): void {
    const currentUrl = this.router.url;
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: currentUrl },
      relativeTo: this.route
    });
    this.close();
  }

  navigateToRegister(): void {
    const currentUrl = this.router.url;
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: currentUrl },
      relativeTo: this.route
    });
    this.close();
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute === route;
  }
}