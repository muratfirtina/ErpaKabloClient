import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
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

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule,MatPaginatorModule,NavbarComponent,MainHeaderComponent,BreadcrumbComponent,FilterComponent, RouterModule],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent extends BaseComponent implements OnInit {
  searchTerm: string = '';
  products: Product[] = [];
  availableFilters: FilterGroup[] = [];
  selectedFilters: { [key: string]: string[] } = {};
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  totalItems: number = 0;
  noResults: boolean = false;
  sortOrder: string = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private breadcrumbService: BreadcrumbService,
    private router: Router,
    spinner: NgxSpinnerService
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
      this.updateBreadcrumbs()
    });
  }

  loadAvailableFilters() {
    this.productService.getAvailableFilters().subscribe(
      filters => {
        this.availableFilters = filters;
      },
      error => {
        console.error('Error loading filters:', error);
      }
    );
  }
  onSortChange(event: Event) {
    this.sortOrder = (event.target as HTMLSelectElement).value;
    this.loadProducts();
  }

  loadProducts() {
    this.productService.filterProducts(this.searchTerm, this.selectedFilters, this.pageRequest, this.sortOrder)
      .then(
        (response) => {
          this.products = response.items;
          this.totalItems = response.count;
          this.noResults = this.products.length === 0;
        },
        (error) => {
          console.error('Error fetching products:', error);
          this.noResults = true;
        }
      );
  }

  async searchProducts() {
    try {
      const response = await this.productService.filterProducts(this.searchTerm, this.selectedFilters, this.pageRequest, this.sortOrder);
      this.products = response.items;
      this.totalItems = response.count;
      this.noResults = this.products.length === 0;
    } catch (error) {
      console.error('Error searching products:', error);
      this.noResults = true;
    }
  }

  onFilterChange(filters: { [key: string]: string[] }) {
    this.selectedFilters = filters;
    this.pageRequest.pageIndex = 0;
    this.updateUrl();
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

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  updateBreadcrumbs(){
    this.breadcrumbService.setBreadcrumbs([
      { label: this.searchTerm, url: '/search-results' }
    ]);
  }

  addToCart(event: Event, product: any) {
    event.stopPropagation();
    // Sepete ekleme mantığı
  }
}