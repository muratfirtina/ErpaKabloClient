import { Component, OnInit, ElementRef, Input, Output, EventEmitter } from '@angular/core';
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
export class UserSidebarComponent extends BaseDrawerComponent implements OnInit {
  @Output() closeCart = new EventEmitter<void>();

  userNameSurname: string | undefined;
  userData$: Observable<UserData | null>;
  currentRoute: string = '';

  readonly Roles = Roles;

  // isAdmin getter'ı
  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }
  
  // Tüm menü itemlarını burada tanımlayalım
  readonly menuItems: MenuItem[] = [
    { id: 1,label: 'Admin Panel', icon: 'fas fa-user-shield', route: '/admin',roles: [Roles.ADMIN] },
    { id: 2,label: 'My Orders', icon: 'fas fa-box', route: '/order'},
    { id: 3,label: 'My Profile', icon: 'fas fa-user', route: '/user'},
    { id: 4,label: 'Favorites', icon: 'fas fa-heart', route: '/my-favorites'},
    { id: 5,label: 'Sign Out', icon: 'fas fa-sign-out-alt', route: 'logout'}
  ];

  // Görüntülenecek menü itemlarını filtreleyen getter
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
    public authService: AuthService
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

  override close() {
    this.isOpen = false;
    this.closeCart.emit();
    // Body overflow'ı düzelt
    document.body.style.overflow = 'auto';
    // Drawer service'i kullanarak tam kapanmayı sağla
    this.drawerService.close();
  }

  // Overlay'e tıklandığında da kapanması için
  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('sidebar-overlay')) {
      this.close();
    }
  }

  

  navigateTo(route: string): void {
    if (route === 'logout') {
      this.logout();
      return;
    }
    this.router.navigate([route]);
    this.close();
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

  async logout(): Promise<void> {
    await this.authService.logout();
    
    this.close();
    
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute === route;
  }
}