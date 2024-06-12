import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import {MatExpansionModule} from '@angular/material/expansion';

interface SidebarItem {
  title: string;
  icon: string;
  path?: string;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, RouterModule, MatIconModule, MatExpansionModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit{
  sidebarItems: SidebarItem[] = [
    {
      title: 'Brand',
      icon: 'branding_watermark',
      children: [
        { title: 'Create', icon: 'add', path: 'brands/brand-create' },
        { title: 'List', icon: 'list', path: 'brands/brand-list' },
        { title: 'Update', icon: 'edit', path: 'brands/brand-update' }
      ]
    },
    {
      title: 'Product',
      icon: 'shopping_cart',
      children: [
        { title: 'Create', icon: 'add', path: 'products/create' },
        { title: 'List', icon: 'list', path: 'products/list' },
        { title: 'Update', icon: 'edit', path: 'products/update' }
      ]
    },
    {
      title: 'Category',
      icon: 'category',
      children: [
        { title: 'Create', icon: 'add', path: 'categories/category-create' },
        { title: 'List', icon: 'list', path: 'categories/category-list' },
        { title: 'Update', icon: 'edit', path: 'categories/category-update' }
      ]
    },
    {
      title: 'Feature',
      icon: 'settings',
      children: [
        { title: 'Create', icon: 'add', path: 'features/feature-create' },
        { title: 'List', icon: 'list', path: 'features/feature-list' },
        { title: 'Update', icon: 'edit', path: 'features/feature-update' }
      ]
    },
    {
      title: 'Feature Value',
      icon: 'settings',
      children: [
        { title: 'Create', icon: 'add', path: 'featurevalues/featurevalue-create' },
        { title: 'List', icon: 'list', path: 'featurevalues/featurevalue-list' },
        { title: 'Update', icon: 'edit', path: 'featurevalues/featurevalue-update' }
      ]
    }
  ];

  isLocked = true;
  isHoverable = false;
  isClosed = false;

  ngOnInit() {
    if (window.innerWidth < 800) {
      this.isClosed = true;
      this.isLocked = false;
      this.isHoverable = false;
    }
  }

  toggleLock() {
    this.isLocked = !this.isLocked;
    this.isHoverable = !this.isLocked;
  }

  toggleSidebar() {
    this.isClosed = !this.isClosed;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth < 800) {
      this.isClosed = true;
      this.isLocked = false;
      this.isHoverable = false;
    } else if (!this.isLocked) {
      this.isClosed = false;
      this.isHoverable = true;
    }
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.isHoverable) {
      this.isClosed = false;
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.isHoverable) {
      this.isClosed = true;
    }
  }
   
}