import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { CreateCartItem } from 'src/app/contracts/cart/createCartItem';
import { CartService } from 'src/app/services/common/models/cart.service';
import { UiProductListComponent } from '../product/ui-product-list/ui-product-list.component';
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';


@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule,
    MainHeaderComponent,
    NavbarComponent,
    UiProductListComponent, 
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
  subCategories: Category[] = [];
  products: Product[] = [];
  availableFilters: FilterGroup[] = [];
  selectedFilters: { [key: string]: string[] } = {};
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  totalItems: number = 0;
  noResults: boolean = false;
  sortOrder: string = '';
  isMobile: boolean = false;
  quantity: number = 1;

  @ViewChild('categoryGrid') categoryGrid!: ElementRef;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private productService: ProductService,
    private breadcrumbService: BreadcrumbService,
    private productLikeService: ProductLikeService,
    private authService: AuthService,
    private customToasterService: CustomToastrService,
    private cartService: CartService,
    private productOperations: ProductOperationsService,
    spinner: NgxSpinnerService,
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.route.params.subscribe(params => {
      this.categoryId = params['id'];
      this.loadCategory();
      this.loadAvailableFilters();
      this.loadProducts();
      this.loadSubCategories();
      this.checkScreenSize();
    });
  }

  async loadCategory() {
    await this.categoryService.getById(this.categoryId).then(
      category => {
        this.category = category;
        this.updateBreadcrumbs();
      },
      error => {
        console.error('Error loading category:', error);
      }
    );
  }

  async loadSubCategories() {
    await this.categoryService.getSubCategories(this.categoryId).then(
      (response: GetListResponse<Category>) => {
        this.subCategories = response.items;
      },
      error => {
        console.error('Error loading subcategories:', error);
      }
    );
  }

  async loadAvailableFilters() {
    await this.productService.getAvailableFilters(this.categoryId).subscribe(
      filters => {
        this.availableFilters = filters;
      },
      error => {
        console.error('Error loading filters:', error);
      }
    );
  }

 async loadProducts() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    // Ensure the current category is always included in the filter
    this.selectedFilters['Category'] = [this.categoryId];
    this.productService.filterProducts('', this.selectedFilters, this.pageRequest, this.sortOrder)
      .then(
        async (response) => {
          this.products = response.items;
          this.totalItems = response.count;
          this.noResults = this.products.length === 0;

          if (this.authService.isAuthenticated) {
            const productIds = this.products.map(p => p.id);
            const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
            
            this.products.forEach(product => {
              product.isLiked = likedProductIds.includes(product.id);
            });
          }
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


  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  scrollLeft() {
    const grid = this.categoryGrid.nativeElement;
    grid.scrollBy({ left: -250, behavior: 'smooth' });
  }

  scrollRight() {
    const grid = this.categoryGrid.nativeElement;
    grid.scrollBy({ left: 250, behavior: 'smooth' });
  }
}