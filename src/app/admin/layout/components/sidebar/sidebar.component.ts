import { Component, HostListener, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { Router } from '@angular/router';

interface SidebarItem {
  title: string;
  icon: string;
  path?: string;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('closed', style({
        width: '70px'
      })),
      state('open', style({
        width: '260px'
      })),
      transition('closed <=> open', animate('300ms ease-in-out'))
    ])
  ]
})
export class SidebarComponent implements OnInit {
  constructor(
    private authService: AuthService, 
    private router: Router, 
    private toastrService: CustomToastrService
  ) { }

  @Output() sidebarToggled = new EventEmitter<boolean>();

  logoUrl = 'assets/icons/TUMdex.png';
  isMobile = false;
  
  // Bootstrap Icon Mapping
  private iconMapping: {[key: string]: string} = {
    'admin_panel_settings': 'shield-lock',
    'dashboard': 'speedometer2',
    'branding_watermark': 'tags',
    'shopping_cart': 'cart',
    'category': 'folder',
    'settings': 'gear',
    'person': 'person',
    'logout': 'box-arrow-right',
    'list': 'list-ul',
    'add': 'plus-circle',
    'update': 'arrow-repeat'
  };

  getIconClass(materialIcon: string): string {
    return this.iconMapping[materialIcon] || materialIcon;
  }

  sidebarItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      icon: 'admin_panel_settings',
      path: 'dashboard'
    },
    {
      title: 'Monitoring',
      icon: 'dashboard',
      path: 'monitoring'
    },
    {
      title: 'Brand',
      icon: 'branding_watermark',
      children: [
        { title: 'Create', icon: 'add', path: 'brands/brand-create' },
        { title: 'List', icon: 'list', path: 'brands/brand-list' },
      ]
    },
    {
      title: 'Product',
      icon: 'shopping_cart',
      children: [
        { title: 'Create', icon: 'add', path: 'products/product-create' },
        { title: 'List', icon: 'list', path: 'products/product-list' },
      ]
    },
    {
      title: 'Category',
      icon: 'category',
      children: [
        { title: 'Create', icon: 'add', path: 'categories/category-create' },
        { title: 'List', icon: 'list', path: 'categories/category-list' },
      ]
    },
    {
      title: 'Feature',
      icon: 'settings',
      children: [
        { title: 'Create', icon: 'add', path: 'features/feature-create' },
        { title: 'List', icon: 'list', path: 'features/feature-list' },
      ]
    },
    {
      title: 'Feature Value',
      icon: 'settings',
      children: [
        { title: 'Create', icon: 'add', path: 'featurevalues/featurevalue-create' },
        { title: 'List', icon: 'list', path: 'featurevalues/featurevalue-list' },
      ]
    },
    {
      title: 'Order',
      icon: 'shopping_cart',
      path: 'orders'
    },
    {
      title: 'User',
      icon: 'person',
      children: [
        { title: 'List', icon: 'list', path: 'users/user-list' },
      ]
    },
    {
      title: 'Carousel',
      icon: 'dashboard',
      children: [
        { title: 'Create', icon: 'add', path: 'carousel/carousel-create' },
        { title: 'Update', icon: 'update', path: 'carousel/carousel-update' },
      ]
    },
    {
      title: 'Logos',
      icon: 'dashboard',
      children: [
        { title: 'CompanyLogo', icon: 'add', path: 'logos/company-logo' },
      ]
    },
    {
      title: 'Role',
      icon: 'person',
      children: [
        { title: 'Create', icon: 'add', path: 'roles/role-create' },
        { title: 'List', icon: 'list', path: 'roles/role-list' },
      ]
    },
    {
      title: 'AuthorizeEndpoint',
      icon: 'person',
      path: 'authorize-menu'
    },
    {
      title: 'Log Out',
      icon: 'logout',
    }
  ];

  ngOnInit(): void {
    // Check screen size on init and set sidebar state
    this.checkScreenSize();
  }

  isExpanded = true;
  activeItems: Set<SidebarItem> = new Set();

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    this.sidebarToggled.emit(this.isExpanded);
    if (!this.isExpanded) {
      this.activeItems.clear();
    }
    
    // Auto close sidebar after selection on mobile
    if (this.isMobile && !this.isExpanded) {
      // Add small delay to allow the navigation to happen first
      setTimeout(() => {
        this.isExpanded = false;
        this.sidebarToggled.emit(this.isExpanded);
      }, 300);
    }
  }

  toggleSubmenu(item: SidebarItem, event: MouseEvent) {
    event.stopPropagation();
    if (this.isExpanded) {
      if (this.activeItems.has(item)) {
        this.activeItems.delete(item);
      } else {
        this.activeItems.add(item);
      }
    } else if (item.children) {
      this.isExpanded = true;
      this.sidebarToggled.emit(this.isExpanded);
      this.activeItems.add(item);
    }
  }

  isActive(item: SidebarItem): boolean {
    return this.activeItems.has(item);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    const width = window.innerWidth;
    this.isMobile = width <= 768;
    
    // On mobile, sidebar should be collapsed by default
    if (this.isMobile) {
      this.isExpanded = false;
    } else {
      this.isExpanded = true;
    }
    
    this.sidebarToggled.emit(this.isExpanded);
  }

  logout() {
    localStorage.removeItem("accessToken");
    this.authService.identityCheck();
    this.toastrService.message("Logged out successfully", "Log Out", {
      toastrMessageType: ToastrMessageType.Warning,
      position: ToastrPosition.TopRight
    });
    setTimeout(() => {
      this.router.navigate([""]).then(() => {
        location.reload();
      });
    }, 1000);
  }

  handleItemClick(item: SidebarItem, event: MouseEvent) {
    if (item.title === 'Log Out') {
      event.preventDefault();
      this.logout();
    } else if (item.children) {
      this.toggleSubmenu(item, event);
    } else if (this.isMobile) {
      // Auto close sidebar after navigation on mobile
      setTimeout(() => {
        this.isExpanded = false;
        this.sidebarToggled.emit(this.isExpanded);
      }, 300);
    }
  }
}