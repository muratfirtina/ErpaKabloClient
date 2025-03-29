import { Component, HostListener, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { AuthService } from 'src/app/services/common/auth.service';
import { CartService } from 'src/app/services/common/models/cart.service';
import { CartComponent } from '../cart/cart.component';
import { CommonModule } from '@angular/common';
import { UserSidebarComponent } from '../user/user-sidebar/user-sidebar.component';
import { CategoriesSidebarComponent } from '../category/categories-sidebar/categories-sidebar.component';
import { ThemeService } from 'src/app/services/common/theme.service';

@Component({
  selector: 'app-downbar',
  standalone: true,
  imports: [CommonModule, RouterModule, CartComponent, UserSidebarComponent,CategoriesSidebarComponent],
  templateUrl: './downbar.component.html',
  styleUrl: './downbar.component.scss'
})
export class DownbarComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private themeService: ThemeService,
  ) {}


  cartItemCount: number = 0;
  isCartOpen: boolean = false;
  isSidebarOpen: boolean = false;
  isCategoriesSidebarOpen: boolean = false;

  selectedButton: 'home' | 'categories' | 'account' | 'cart' = null;
  lastSelectedButton: 'home' | 'categories' | 'account' | 'cart' = null;

  ngOnInit() {
    if (this.authService.isAuthenticated) {
      // İlk sepet verilerini yükle
      this.cartService.get().then(items => {
        this.cartItemCount = items.length;
      });
      
      // Sepet değişikliklerini takip et
      this.cartService.getCartItemsObservable().subscribe(
        (items: CartItem[]) => {
          this.cartItemCount = items.length;
        }
      );
    }
  }

  navigateToHome() {
    this.closeAllSidebars();
    this.toggleButton('home');
    this.router.navigate(['/']);
  }

  navigateToCategories() {
    if (this.lastSelectedButton === 'categories' && this.isCategoriesSidebarOpen) {
      // Aynı butona ikinci kez tıklandı, menüyü kapat
      this.closeAllSidebars();
      return;
    }
    
    this.closeAllSidebars();
    this.toggleButton('categories');
    this.toggleCategoriesSidebar();
  }

  handleUserAction() {
    if (this.lastSelectedButton === 'account' && this.isSidebarOpen) {
      // Aynı butona ikinci kez tıklandı, menüyü kapat
      this.closeAllSidebars();
      return;
    }
    
    this.closeAllSidebars();
    if (this.authService.isAuthenticated) {
      this.toggleButton('account');
      this.toggleSidebar();
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleCart() {
    if (this.lastSelectedButton === 'cart' && this.isCartOpen) {
      // Aynı butona ikinci kez tıklandı, menüyü kapat
      this.closeAllSidebars();
      return;
    }
    
    this.closeAllSidebars();
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    this.toggleButton('cart');
    this.isCartOpen = true;
    document.body.style.overflow = 'hidden';
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    if (this.isSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }

  toggleCategoriesSidebar() {
    this.isCategoriesSidebarOpen = !this.isCategoriesSidebarOpen;
  }

  // Yeni metod: Buton durumunu değiştir ve son seçili butonu kaydet
  toggleButton(button: 'home' | 'categories' | 'account' | 'cart') {
    this.lastSelectedButton = this.selectedButton;
    this.selectedButton = button;
  }

  private closeAllSidebars() {
    this.isCartOpen = false;
    this.isSidebarOpen = false;
    this.isCategoriesSidebarOpen = false;
    document.body.style.overflow = '';
    document.body.classList.remove('sidebar-open');
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    document.body.classList.remove('sidebar-open');
  }
}