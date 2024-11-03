import { Component, HostListener, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { AuthService } from 'src/app/services/common/auth.service';
import { CartService } from 'src/app/services/common/models/cart.service';
import { CartComponent } from '../cart/cart.component';
import { CommonModule } from '@angular/common';
import { UserSidebarComponent } from '../user/user-sidebar/user-sidebar.component';
import { SidebarComponent } from "../../../admin/layout/components/sidebar/sidebar.component";
import { CategoriesSidebarComponent } from '../category/categories-sidebar/categories-sidebar.component';

@Component({
  selector: 'app-downbar',
  standalone: true,
  imports: [CommonModule, RouterModule, CartComponent, UserSidebarComponent, SidebarComponent,CategoriesSidebarComponent],
  templateUrl: './downbar.component.html',
  styleUrl: './downbar.component.scss'
})
export class DownbarComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private cartService = inject(CartService);

  cartItemCount: number = 0;
  isCartOpen: boolean = false;
  isSidebarOpen: boolean = false;
  isCategoriesSidebarOpen: boolean = false;

  selectedButton: 'home' | 'categories' | 'account' | 'cart' = null;

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
    this.selectedButton = 'home';
    this.router.navigate(['/']);
  }

  navigateToCategories() {
    this.closeAllSidebars();
    this.selectedButton = 'categories';
    this.toggleCategoriesSidebar();
  }

  handleUserAction() {
    this.closeAllSidebars();
    if (this.authService.isAuthenticated) {
      this.selectedButton = 'account';
      this.toggleSidebar();
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleCart() {
    this.closeAllSidebars();
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    this.selectedButton = 'cart';
    this.isCartOpen = !this.isCartOpen;
    if (this.isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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

  

  private closeAllSidebars() {
    this.isCartOpen = false;
    this.isSidebarOpen = false;
    this.isCategoriesSidebarOpen = false;
    document.body.style.overflow = '';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}