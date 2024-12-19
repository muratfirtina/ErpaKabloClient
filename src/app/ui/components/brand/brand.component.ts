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
import { BrandService } from 'src/app/services/common/models/brand.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Breadcrumb, BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { Brand } from 'src/app/contracts/brand/brand';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { Category } from 'src/app/contracts/category/category';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { UiProductListComponent } from '../product/ui-product-list/ui-product-list.component';
import { DownbarComponent } from '../downbar/downbar.component';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [
    CommonModule,
    MainHeaderComponent,
    NavbarComponent, 
    MatPaginatorModule, 
    FilterComponent,
    RouterModule,
    BreadcrumbComponent,
    UiProductListComponent,
    DownbarComponent
  ],
  templateUrl: './brand.component.html',
  styleUrls: ['./brand.component.scss']
})
export class BrandComponent extends BaseComponent implements OnInit,OnChanges {
  @Input() brandId: string;
  @Input() key: number;

  brand: Brand;
  defaultBrandImageUrl: string = 'assets/brand/ecommerce-default-brand.png';
  subCategories: Category[] = [];
  products: Product[] = [];
  availableFilters: FilterGroup[] = [];
  selectedFilters: { [key: string]: string[] } = {};
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  totalItems: number = 0;
  noResults: boolean = false;
  sortOrder: string = '';
  isMobile: boolean = false;

  @ViewChild('categoryGrid') categoryGrid!: ElementRef;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private brandService: BrandService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private breadcrumbService: BreadcrumbService,
    private productLikeService: ProductLikeService,
    private authService: AuthService,
    private customToasterService: CustomToastrService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['brandId'] || changes['key']) && this.brandId) {
      // Reset sayfanın state'ini sıfırla
      this.products = [];
      this.selectedFilters = {};
      this.pageRequest.pageIndex = 0;
      
      // Yeni veriyi yükle
      this.loadBrand();
      this.loadAvailableFilters();
      this.loadProducts();
      this.loadSubCategories();
      
      // Sayfa başına scroll
      window.scrollTo(0, 0);
    }
  }

  ngOnInit() {
    // Remove the route.params subscription since we're using Input now
    if (this.brandId) {
      this.loadBrand();
      this.loadAvailableFilters();
      this.loadProducts();
      this.loadSubCategories();
      this.checkScreenSize();
    }
  }

  async loadBrand() {
    if (!this.brandId) return;

    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      const brand = await this.brandService.getById(this.brandId);
      if (!brand) {
        throw new Error('Brand not found');
      }
      this.brand = brand;
      this.updateBreadcrumbs();
    } catch (error) {
      console.error('Error loading brand:', error);
      this.router.navigate(['/']);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
  
  loadSubCategories() {
    
    this.categoryService.getSubCategoriesByBrandId(this.brandId).then(
      response => {
        this.subCategories = response.items;
      },
      error => {
        console.error('Error loading subcategories:', error);
      }
    );
  }

  async loadAvailableFilters() {
    try {
        const filters = await this.productService.getAvailableFilters(this.brandId);
        this.availableFilters = filters;
    } catch (error) {
        console.error('Error loading filters:', error);
    }
}

  async loadProducts() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    // Ensure the current brand is always included in the filter
    this.selectedFilters['Brand'] = [this.brandId];
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
    // Check if the brand has changed
    const newBrandId = filters['Brand'] ? filters['Brand'][0] : this.brandId;
    
    if (newBrandId !== this.brandId) {
      // Brand has changed, update the route
      this.router.navigate(['/brand', newBrandId]);
    } else {
      // Brand hasn't changed, just update filters and reload products
      this.selectedFilters = filters;
      this.pageRequest.pageIndex = 0;
      this.loadProducts();
    }
  }

  onPageChange(event: PageEvent) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.loadProducts();
  }

  onSortChange(event: Event) {
    this.sortOrder = (event.target as HTMLSelectElement).value;
    this.loadProducts();
  }

  updateBreadcrumbs() {
    if (this.brand) {
      const breadcrumbs: Breadcrumb[] = [
        { label: 'Brands', url: '/brands' },
        { label: this.brand.name, url: `/brand/${this.brand.id}` }
      ];
      this.breadcrumbService.setBreadcrumbs(breadcrumbs);
    }
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  addToCart(event: Event, product: Product) {
    event.stopPropagation();
    // Implement cart addition logic here
  }

  async toggleLike(event: Event, product: Product) {
    event.stopPropagation();
  
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }
  
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      const isLiked = await this.productLikeService.toggleProductLike(product.id);
      product.isLiked = isLiked;
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.customToasterService.message(
        isLiked ? 'Product Like' : 'Product Like Romeved',
        'Success',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.customToasterService.message(
        'An error occurred while processing your request.',
        'Error',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    }
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