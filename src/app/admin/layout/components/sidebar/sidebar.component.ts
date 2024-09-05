import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import {MatExpansionModule} from '@angular/material/expansion';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
  styleUrls: ['./sidebar.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('closed', style({
        width: '72px'
      })),
      state('open', style({
        width: '260px'
      })),
      transition('closed <=> open', animate('400ms ease-in-out'))
    ])
  ]
})
export class SidebarComponent implements OnInit{
  sidebarItems: SidebarItem[] = [
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
      title: 'User',
      icon: 'person',
      children: [
        
        { title: 'List', icon: 'list', path: 'users/user-list' },
      ]
    },
    {
      title: 'Role',
      icon: 'person',
      children: [
        { title: 'Create', icon: 'add', path: 'roles/role-create' },
        { title: 'List', icon: 'list', path: 'roles/role-list' },
      ]
    }
  ];
  ngOnInit(): void {
      
  }

  isExpanded = true;
  activeItems: Set<SidebarItem> = new Set();
  hoveredItem: SidebarItem | null = null;

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    if (!this.isExpanded) {
      this.activeItems.clear();
      this.hoveredItem = null;
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
    } else {
      this.isExpanded = true;
      this.activeItems.add(item);
    }
  }

  isActive(item: SidebarItem): boolean {
    return this.activeItems.has(item);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isExpanded = event.target.innerWidth > 768;
    if (!this.isExpanded) {
      this.activeItems.clear();
      this.hoveredItem = null;
    }
  }
}