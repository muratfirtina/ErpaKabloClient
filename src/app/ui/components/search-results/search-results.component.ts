import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule,MatPaginatorModule,NavbarComponent,MainHeaderComponent,FilterComponent,BreadcrumbComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent extends BaseComponent implements OnInit {
  searchTerm: string;
  products: Product[] = [];
  noResults: boolean = false;
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  totalItems: number = 0;
  availableFilters: { [key: string]: string[] } = {};

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private breadcrumbService: BreadcrumbService,
    spinner: NgxSpinnerService
  ) { 
    super(spinner);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['q'];
      this.searchProducts();
      this.updateBreadcrumbs();
      this.loadAvailableFilters();
    });
  }

  onFilterChange(selectedFilters: { [key: string]: string[] }) {
    const filters: Filter[] = this.buildFilters(this.searchTerm);
    
    for (const [key, values] of Object.entries(selectedFilters)) {
      if (values.length > 0) {
        switch(key) {
          case 'Marka':
            filters.push({
              field: ProductFilterByDynamic.BrandName,
              operator: 'in',
              value: values.join(',')
            });
            break;
          case 'Fiyat Aralığı':
            const priceFilters = values.map(range => {
              const [min, max] = range.split(' - ').map(v => parseInt(v));
              return {
                field: ProductFilterByDynamic.Price,
                operator: 'between',
                value: [min, max || Number.MAX_SAFE_INTEGER]
              };
            });
            filters.push({
              logic: 'or',
              filters: priceFilters.push.apply(priceFilters)
            });
            break;
          default:
            // Diğer tüm özellikler için
            filters.push({
              field: 'ProductFeatureValues',
              operator: 'any',
              value: `FeatureName == "${key}" && FeatureValueName in (${values.map(v => `"${v}"`).join(',')})`
            });
            break;
        }
      }
    }
  
    const dynamicQuery: DynamicQuery = {
      sort: [{ field: ProductFilterByDynamic.Name, dir: 'asc' }],
      filter: {
        logic: 'and',
        filters: filters
      }
    };
  
    this.searchProducts(dynamicQuery);
  }

  async searchProducts(dynamicQuery?: DynamicQuery) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      if (!dynamicQuery) {
        const filters: Filter[] = this.buildFilters(this.searchTerm);
        dynamicQuery = {
          sort: [{ field: ProductFilterByDynamic.Name, dir: 'asc' }],
          filter: filters.length > 0 ? {
            logic: 'and',
            filters: filters
          } : undefined
        };
      }

      const result: GetListResponse<Product> = await this.productService.getProductsByDynamicQuery(dynamicQuery, this.pageRequest);
      this.products = result.items;
      this.totalItems = result.count;
      this.noResults = this.products.length === 0;
    } catch (error) {
      console.error('Error searching products:', error);
      this.noResults = true;
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  private buildFilters(searchTerm: string): Filter[] {
    const terms = searchTerm.split(' ').filter(term => term.length > 0);
  
    const name = ProductFilterByDynamic.Name;
    const description = ProductFilterByDynamic.Description;
    const title = ProductFilterByDynamic.Title;
    const brandName = ProductFilterByDynamic.BrandName;
    const categoryName = ProductFilterByDynamic.CategoryName;

    const filters: Filter[] = terms.map(term => ({
      field: name,
      operator: "contains",
      value: term,
      logic: "or",
      filters: [
        {
          field: description,
          operator: "contains",
          value: term,
          logic: "or",
          filters: [
            {
              field: title,
              operator: "contains",
              value: term,
              logic: "or",
              filters: [
                {
                  field: brandName,
                  operator: "contains",
                  value: term,
                  logic: "or",
                  filters: [
                    {
                      field: categoryName,
                      operator: "contains",
                      value: term
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }));
  
    return filters;
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.searchProducts();
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

  async loadAvailableFilters() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      // Mevcut arama terimiyle tüm ürünleri getir
      const filters: Filter[] = this.buildFilters(this.searchTerm);
      const dynamicQuery: DynamicQuery = {
        sort: [{ field: ProductFilterByDynamic.Name, dir: 'asc' }],
        filter: filters.length > 0 ? {
          logic: 'and',
          filters: filters
        } : undefined
      };
  
      const largePageRequest: PageRequest = { pageIndex: 0, pageSize: 1000 };
      const result: GetListResponse<Product> = await this.productService.getProductsByDynamicQuery(dynamicQuery, largePageRequest);
  
      // Filtreleri hazırla
      const brands = new Set<string>();
      const features: { [key: string]: Set<string> } = {};
      const priceRanges = new Set<string>();
  
      result.items.forEach(product => {
        // Marka
        if (product.brandName) brands.add(product.brandName);
  
        // Özellikler ve değerler
        product.productFeatureValues?.forEach(feature => {
          if (!features[feature.featureName]) {
            features[feature.featureName] = new Set<string>();
          }
          features[feature.featureName].add(feature.featureValueName);
        });
  
        // Fiyat aralığı
        const priceRange = this.getPriceRange(product.price);
        if (priceRange) priceRanges.add(priceRange);
      });
  
      // Filtreleri set et
      this.availableFilters = {
        'Marka': Array.from(brands),
        'Fiyat Aralığı': Array.from(priceRanges),
        ...Object.fromEntries(
          Object.entries(features).map(([key, value]) => [key, Array.from(value)])
        )
      };
  
    } catch (error) {
      console.error('Error loading available filters:', error);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
  
  private getPriceRange(price: number): string | null {
    if (price < 100) return '0 - 100 TL';
    else if (price < 250) return '100 - 250 TL';
    else if (price < 500) return '250 - 500 TL';
    else if (price < 1000) return '500 - 1000 TL';
    else return '1000 TL ve üzeri';
  }
}