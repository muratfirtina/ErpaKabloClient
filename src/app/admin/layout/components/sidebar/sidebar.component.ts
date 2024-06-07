import { Component } from '@angular/core';
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
export class SidebarComponent {
  sidebarItems: SidebarItem[] = [
    {
      title: 'Brand',
      icon: 'branding_watermark',
      children: [
        { title: 'Create', icon: 'add', path: '/brand/create' },
        { title: 'List', icon: 'list', path: '/brand/list' },
        { title: 'Update', icon: 'edit', path: '/brand/update' }
      ]
    },
    {
      title: 'Product',
      icon: 'shopping_cart',
      children: [
        { title: 'Create', icon: 'add', path: '/product/create' },
        { title: 'List', icon: 'list', path: '/product/list' },
        { title: 'Update', icon: 'edit', path: '/product/update' }
      ]
    },
    {
      title: 'Category',
      icon: 'category',
      children: [
        { title: 'Create', icon: 'add', path: '/category/create' },
        { title: 'List', icon: 'list', path: '/category/list' },
        { title: 'Update', icon: 'edit', path: '/category/update' }
      ]
    }
  ];
   
}