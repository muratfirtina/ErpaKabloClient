import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from 'src/app/contracts/category/category';
import { CategoryService } from 'src/app/services/common/models/category.service';

@Component({
  selector: 'app-categories-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories-sidebar.component.html',
  styleUrl: './categories-sidebar.component.scss'
})
export class CategoriesSidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();
  mainCategories: Category[] = [];

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadMainCategories();
  }

  async loadMainCategories() {
    const response = await this.categoryService.getMainCategories({ pageIndex: 0, pageSize: 1000 });
    this.mainCategories = response.items;
  }

  close() {
    this.closeSidebar.emit();
  }

  navigateToCategory(categoryId: string) {
    this.router.navigate(['/' + categoryId]);
    this.close();
  }
}