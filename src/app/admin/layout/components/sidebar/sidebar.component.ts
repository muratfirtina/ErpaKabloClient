import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsComponent } from 'src/app/admin/components/products/products.component';
import { MatListModule } from '@angular/material/list';
import { CategoriesComponent } from 'src/app/admin/components/categories/categories.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule,MatListModule,ProductsComponent,CategoriesComponent,RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

}
