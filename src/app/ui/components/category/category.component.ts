import { Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { CreateCartItem } from 'src/app/contracts/cart/createCartItem';
import { CartService } from 'src/app/services/common/models/cart.service';
import { UiProductListComponent } from '../product/ui-product-list/ui-product-list.component';
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';
import { DownbarComponent } from '../downbar/downbar.component';
import { FooterComponent } from '../footer/footer.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';


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
    BreadcrumbComponent,
    DownbarComponent,
    FooterComponent,
    ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent extends BaseComponent implements OnInit,OnChanges {
  @Input() categoryId: string;
  @Input() key: number; 

  category: Category;
  subCategories: Category[] = [];
  products: Product[] = [];
  availableFilters: FilterGroup[] = [];
  selectedFilters: { [key: string]: string[] } = {};
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 50 };
  totalItems: number = 0;
  noResults: boolean = false;
  sortOrder: string = '';
  isMobile: boolean = false;
  quantity: number = 1;
  isFiltersLoading: boolean = false;
  isProductsLoading: boolean = false;

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
    spinner: SpinnerService,
  ) {
    super(spinner);
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['categoryId'] || changes['key']) && this.categoryId) {
      // Reset sayfanın state'ini sıfırla
      this.products = [];
      this.subCategories = [];
      this.selectedFilters = {};
      this.pageRequest.pageIndex = 0;
      
      // Yeni veriyi yükle
      this.loadCategory();
      this.loadAvailableFilters();
      this.loadProducts();
      this.loadSubCategories();
      
      // Sayfa başına scroll
      window.scrollTo(0, 0);
    }
  }

  ngOnInit() {
    // Remove the route.params subscription since we're using Input now
    if (this.categoryId) {
      this.loadCategory();
      this.loadAvailableFilters();
      this.loadProducts();
      this.loadSubCategories();
      this.checkScreenSize();
    }
  }

  async loadCategory() {
    if (!this.categoryId?.includes('-c-')) return;

    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      const category = await this.categoryService.getById(this.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
      this.category = category;
      this.updateBreadcrumbs();
    } catch (error) {
      console.error('Error loading category:', error);
      this.router.navigate(['/']);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
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
    this.isFiltersLoading = true;
    try {
      const filters = await this.productService.getAvailableFilters(this.categoryId);
      this.availableFilters = filters;
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      this.isFiltersLoading = false;
    }
  }

async loadProducts() {
  if (!this.categoryId?.includes('-c-')) return;
  this.isProductsLoading = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.selectedFilters['Category'] = [this.categoryId];
    const response = await this.productService.filterProducts(
      '', 
      this.selectedFilters, 
      this.pageRequest, 
      this.sortOrder
    );
    
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
  } catch (error) {
    
    this.noResults = true;
  } finally {
    this.isProductsLoading = false;
  }
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