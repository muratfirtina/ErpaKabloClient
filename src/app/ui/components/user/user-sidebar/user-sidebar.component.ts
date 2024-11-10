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
import { NgxSpinnerService } from 'ngx-spinner';
import { DrawerService } from 'src/app/services/common/drawer.service';

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
  isAdmin: boolean = false;

  menuItems = [
    { label: 'My Orders', icon: 'fas fa-box', route: '/order' },
    { label: 'My Profile', icon: 'fas fa-user', route: '/user' },
    { label: 'Favorites', icon: 'fas fa-heart', route: '/favorites' },
    { label: 'Sign Out', icon: 'fas fa-sign-out-alt', route: 'logout' }
  ];

  constructor(
    elementRef: ElementRef,
    animationService: AnimationService,
    themeService: ThemeService,
    spinner: NgxSpinnerService,
    private store: StoreService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private drawerService: DrawerService,
    public authService: AuthService
  ) {
    super(spinner,elementRef, animationService,themeService);
    this.userData$ = this.store.select('user').pipe(
      map(userState => userState.data as UserData)
    );
    this.currentRoute = this.router.url;
    this.isAdmin = this.authService.isAdmin;
    
    // Admin kontrolü yapılıp, admin menü öğesi ekleniyor
    if (this.isAdmin) {
      this.menuItems.unshift({
        label: 'Admin Panel',
        icon: 'fas fa-user-shield',
        route: '/admin'
      });
    }
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