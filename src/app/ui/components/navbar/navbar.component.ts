import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from 'src/app/contracts/category/category';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { Product } from 'src/app/contracts/product/product';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
export class NavbarComponent extends BaseComponent implements OnInit {
  categories: CategoryWithSubcategories[] = [];
  topLevelCategories: CategoryWithSubcategories[] = [];
  selectedCategory: CategoryWithSubcategories | null = null;
  recommendedProducts: Product[] = [];
  isAllProductsOpen: boolean = false;
  private categorySubject = new Subject<string>();
  private categoryCache: Map<string, Product[]> = new Map();

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
    this.setupCategorySubject();
  }

  private setupCategorySubject() {
    this.categorySubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(categoryId => {
      this.loadRecommendedProductsWithCache(categoryId);
    });
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

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 1000 };
    try {
      const response = await this.categoryService.list(pageRequest);
      this.categories = response.items;
      this.organizeCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
    this.hideSpinner(SpinnerType.BallSpinClockwise);
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

  selectCategory(category: CategoryWithSubcategories) {
    this.selectedCategory = category;
    this.categorySubject.next(category.id);
  }

  async loadRecommendedProductsWithCache(categoryId: string) {
    if (this.categoryCache.has(categoryId)) {
      this.recommendedProducts = this.categoryCache.get(categoryId)!;
    } else {
      this.showSpinner(SpinnerType.BallSpinClockwise);
      try {
        const products = await this.productService.getRandomProductsByCategory(categoryId);
        this.categoryCache.set(categoryId, products);
        this.recommendedProducts = products;
      } catch (error) {
        console.error(`Error loading recommended products for category ${categoryId}:`, error);
        this.recommendedProducts = [];
      } finally {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      }
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
}