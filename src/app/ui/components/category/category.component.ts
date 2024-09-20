import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FilterComponent } from '../filter/filter.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { FilterGroup } from 'src/app/contracts/product/filter/filters';
import { Product } from 'src/app/contracts/product/product';
import { ProductService } from 'src/app/services/common/models/product.service';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Breadcrumb, BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { Category } from 'src/app/contracts/category/category';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';


@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule,
    MainHeaderComponent,
    NavbarComponent, 
    MatPaginatorModule, 
    FilterComponent,
    RouterModule,
    BreadcrumbComponent],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent extends BaseComponent implements OnInit {
  categoryId: string;
  category: Category;
  products: Product[] = [];
  availableFilters: FilterGroup[] = [];
  selectedFilters: { [key: string]: string[] } = {};
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  totalItems: number = 0;
  noResults: boolean = false;
  sortOrder: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private productService: ProductService,
    private breadcrumbService: BreadcrumbService,
    spinner: NgxSpinnerService,
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.categoryId = params['id'];
      this.loadCategory();
      this.loadAvailableFilters();
      this.loadProducts();
    });
  }

  loadCategory() {
    this.categoryService.getById(this.categoryId).then(
      category => {
        this.category = category;
        this.updateBreadcrumbs();
      },
      error => {
        console.error('Error loading category:', error);
      }
    );
  }

  loadAvailableFilters() {
    this.productService.getAvailableFilters(this.categoryId).subscribe(
      filters => {
        this.availableFilters = filters;
      },
      error => {
        console.error('Error loading filters:', error);
      }
    );
  }

  loadProducts() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    // Ensure the current category is always included in the filter
    this.selectedFilters['Category'] = [this.categoryId];
    this.productService.filterProducts('', this.selectedFilters, this.pageRequest, this.sortOrder)
      .then(
        (response) => {
          this.products = response.items;
          this.totalItems = response.count;
          this.noResults = this.products.length === 0;
          this.hideSpinner(SpinnerType.BallSpinClockwise);
        },
        (error) => {
          console.error('Error fetching products:', error);
          this.noResults = true;
          this.hideSpinner(SpinnerType.BallSpinClockwise);
        }
      );
  }

  onFilterChange(filters: { [key: string]: string[] }) {
    // Check if the category has changed
    const newCategoryId = filters['Category'] ? filters['Category'][0] : this.categoryId;
    
    if (newCategoryId !== this.categoryId) {
      // Category has changed, update the route
      this.router.navigate(['/category', newCategoryId]);
    } else {
      // Category hasn't changed, just update filters and reload products
      this.selectedFilters = filters;
      this.pageRequest.pageIndex = 0;
      this.loadProducts();
    }
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.loadProducts();
  }

  onSortChange(event: Event) {
    this.sortOrder = (event.target as HTMLSelectElement).value;
    this.loadProducts();
  }

  async updateBreadcrumbs() {
    if (this.category) {
      const categoryHierarchy = await this.getCategoryHierarchy(this.category);
      const breadcrumbs: Breadcrumb[] = categoryHierarchy.map(cat => ({
        label: cat.name,
        url: `/category/${cat.id}`
      }));
      this.breadcrumbService.setBreadcrumbs(breadcrumbs);
    }
  }

  async getCategoryHierarchy(category: Category): Promise<Category[]> {
    const hierarchy: Category[] = [category];
    let currentCategory = category;

    while (currentCategory.parentCategoryId) {
      try {
        const parentCategory = await this.categoryService.getById(currentCategory.parentCategoryId);
        hierarchy.unshift(parentCategory);
        currentCategory = parentCategory;
      } catch (error) {
        console.error('Error fetching parent category:', error);
        break;
      }
    }

    return hierarchy;
  }

  selectCategory(node: any, event: Event) {
    event.stopPropagation();
    this.onFilterChange({ 'Category': [node.id] });
  }

  toggleNode(node: any) {
    node.expanded = !node.expanded;
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  addToCart(event: Event, product: any) {
    event.stopPropagation();
    // Sepete ekleme mantığı
  }
}