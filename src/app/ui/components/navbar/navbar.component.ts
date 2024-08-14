import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from 'src/app/contracts/category/category';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { Product } from 'src/app/contracts/product/product';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { ProductService } from 'src/app/services/common/models/product.service';

interface CategoryWithSubcategories extends Category {
  subcategories?: CategoryWithSubcategories[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  categories: CategoryWithSubcategories[] = [];
  topLevelCategories: CategoryWithSubcategories[] = [];
  selectedCategory: CategoryWithSubcategories | null = null;
  recommendedProducts: Product[] = [];
  isAllProductsOpen: boolean = false;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories() {
    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 1000 };
    try {
      const response = await this.categoryService.list(pageRequest);
      this.categories = response.items;
      this.organizeCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  organizeCategories() {
    const categoryMap = new Map<string, CategoryWithSubcategories>();
    
    this.categories.forEach(category => {
      categoryMap.set(category.id, { ...category, subcategories: [] });
    });

    this.categories.forEach(category => {
      if (category.parentCategoryId) {
        const parentCategory = categoryMap.get(category.parentCategoryId);
        if (parentCategory) {
          parentCategory.subcategories?.push(categoryMap.get(category.id)!);
        }
      }
    });

    this.topLevelCategories = Array.from(categoryMap.values()).filter(category => !category.parentCategoryId);
  }

  async selectCategory(category: CategoryWithSubcategories) {
    this.selectedCategory = category;
    await this.loadRecommendedProducts(category.id);
  }

  async loadRecommendedProducts(categoryId: string) {
    try {
      this.recommendedProducts = await this.productService.getRandomProductsByCategory(categoryId);
    } catch (error) {
      console.error(`Error loading recommended products for category ${categoryId}:`, error);
      this.recommendedProducts = [];
    }
  }

  toggleAllProducts() {
    this.isAllProductsOpen = !this.isAllProductsOpen;
  }

  openAllProducts() {
    this.isAllProductsOpen = true;
  }

  closeAllProducts() {
    this.isAllProductsOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const dropdownElement = document.querySelector('.dropdown-overlay');
    const allProductsButton = document.querySelector('.all-products-dropdown button');
    
    if (dropdownElement && allProductsButton) {
      if (!dropdownElement.contains(event.target as Node) && !allProductsButton.contains(event.target as Node)) {
        this.closeAllProducts();
      }
    }
  }
}