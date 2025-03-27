import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Filter, DynamicQuery } from 'src/app/contracts/dynamic-query';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { Product } from 'src/app/contracts/product/product';
import { ProductFilterByDynamic } from 'src/app/contracts/product/productFilterByDynamic';
import { ProductService } from 'src/app/services/common/models/product.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { FilterComponent } from '../filter/filter.component';
import { FilterGroup } from 'src/app/contracts/product/filter/filters';
import { CreateCartItem } from 'src/app/contracts/cart/createCartItem';
import { CartService } from 'src/app/services/common/models/cart.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { UiProductListComponent } from '../product/ui-product-list/ui-product-list.component';
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';
import { DownbarComponent } from '../downbar/downbar.component';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule,
    MatPaginatorModule,
    MatIconModule,
    NavbarComponent,
    MainHeaderComponent,
    BreadcrumbComponent,
    UiProductListComponent,
    FilterComponent,
    RouterModule,
    DownbarComponent,
    FooterComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent extends BaseComponent implements OnInit {
  searchTerm: string = '';
  products: Product[] = [];
  availableFilters: FilterGroup[] = [];
  selectedFilters: { [key: string]: string[] } = {};
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 20 };
  totalItems: number = 0;
  noResults: boolean = false;
  sortOrder: string = '';
  isFiltersLoading: boolean = false;
  isProductsLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private router: Router,
    private productService: ProductService,
    private customToasterService: CustomToastrService,
    private breadcrumbService: BreadcrumbService,
    private productLikeService: ProductLikeService,
    private authService: AuthService,
    private productOperations: ProductOperationsService,
    spinner: SpinnerService
  ) { 
    super(spinner);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['q'] || '';
      this.pageRequest.pageIndex = +params['page'] || 0;
      this.selectedFilters = this.parseFiltersFromUrl(params);
    
      this.loadAvailableFilters();
      this.searchProducts();
      this.updateBreadcrumbs();
    });
  }

  async loadAvailableFilters() {
    this.isFiltersLoading = true;
    try {
      const filters = await this.productService.getAvailableFilters(
        this.searchTerm, // Arama terimi
        null, // categoryIds yok
        null  // brandIds yok
      );
      this.availableFilters = filters;
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      this.isFiltersLoading = false;
    }
  }
  async searchProducts() {
    this.isProductsLoading = true;
    try {
      const response = await this.productService.filterProducts(
        this.searchTerm,
        this.selectedFilters, 
        this.pageRequest, 
        this.sortOrder
      );
      
      this.products = response.items;
      this.totalItems = response.count;
      this.noResults = this.products.length === 0;

      if (!this.noResults) {
        const filters = await this.productService.getAvailableFilters(this.searchTerm);
        this.availableFilters = filters;
      }

      if (this.authService.isAuthenticated) {
        const productIds = this.products.map(p => p.id);
        const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
        
        this.products.forEach(product => {
          product.isLiked = likedProductIds.includes(product.id);
        });
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      this.noResults = true;
    } finally {
      this.isProductsLoading = false;
    }
  }

  onFilterChange(filters: { [key: string]: string[] }) {
    this.selectedFilters = { ...filters };
    this.pageRequest.pageIndex = 0;
    this.updateUrl();
    this.searchProducts();
  }

  onSortChange(event: Event) {
    this.sortOrder = (event.target as HTMLSelectElement).value;
    this.searchProducts();
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.updateUrl();
    this.searchProducts();
  }

  updateUrl() {
    const queryParams = {
      q: this.searchTerm,
      page: this.pageRequest.pageIndex.toString(),
      ...this.selectedFilters
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
  }

  parseFiltersFromUrl(params: any): { [key: string]: string[] } {
    const filters: { [key: string]: string[] } = {};
    Object.keys(params).forEach(key => {
      if (key !== 'q' && key !== 'page') {
        filters[key] = Array.isArray(params[key]) ? params[key] : [params[key]];
      }
    });
    return filters;
  }

  updateBreadcrumbs() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.searchTerm, url: '/search-results' }
    ]);
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

}