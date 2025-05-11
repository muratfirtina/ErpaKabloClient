import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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
import { PaginationComponent } from 'src/app/base/components/pagination/pagination.component';
import { Category } from 'src/app/contracts/category/category';
import { CategoryService } from 'src/app/services/common/models/category.service';

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
    FooterComponent,
    PaginationComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent extends BaseComponent implements OnInit {
  searchTerm: string = '';
  products: Product[] = [];
  availableFilters: FilterGroup[] = [];
  selectedFilters: { [key: string]: string[] } = {};
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 50 };
  totalItems: number = 0;
  noResults: boolean = false;
  sortOrder: string = '';
  isFiltersLoading: boolean = false;
  isProductsLoading: boolean = false;
  subCategories: Category[] = [];
  categoryImages: { [key: string]: any } = {};
  isMobile = false;

  @ViewChild('categoryGrid') categoryGrid!: ElementRef;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private breadcrumbService: BreadcrumbService,
    private productLikeService: ProductLikeService,
    private authService: AuthService,
    private categoryService: CategoryService,
    spinner: SpinnerService
  ) { 
    super(spinner);
  }

  ngOnInit() {
    this.checkScreenSize();
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
      // Arama terimiyle ilgili filtreleri getir
      const filters = await this.productService.getAvailableFilters(
        this.searchTerm,
        null,
        null
      );
      
      // Kategori filtresini al
      const categoryFilter = filters.find(f => f.key === 'Category');
      if (categoryFilter) {
        console.log(`Category filter found with ${categoryFilter.options.length} options`);
        
        // Ürünü olan tüm kategorileri al (kök ve alt)
        const allCategories = categoryFilter.options.filter(c => c.count > 0);
        
        if (allCategories.length > 0) {
          // Kategorileri ana ve alt olacak şekilde sırala
          const sortedCategories = this.sortCategories(allCategories);
          
          // Her bir kategori için resim bilgisini getir
          const categoryIds = sortedCategories.map(c => c.value);
          await this.loadCategoryImages(categoryIds);
          
          // Kategorileri güncelle
          this.subCategories = sortedCategories.map(c => ({
            id: c.value,
            name: c.displayValue,
            categoryImage: this.categoryImages[c.value] || { url: '/assets/images/placeholder.jpg' },
            // Alt kategori gösterimi için ekstra bilgi ekleyelim
            isSubcategory: !!c.parentId
          } as any)); // Category tipine isSubcategory ekliyoruz
        }
      }
      
      this.availableFilters = filters;
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      this.isFiltersLoading = false;
    }
  }
  
  // Kategorileri hiyerarşik olarak sıralayan metod (BrandPageComponent ile aynı)
  private sortCategories(categories: any[]): any[] {
    // Önce ana kategorileri, sonra alt kategorileri sırala
    return categories.sort((a, b) => {
      // Önce ana kategorileri göster
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      
      // Aynı seviyedeki kategorileri isimlerine göre sırala
      if ((!a.parentId && !b.parentId) || (a.parentId && b.parentId)) {
        return a.displayValue.localeCompare(b.displayValue);
      }
      
      return 0;
    });
  }
  
  // Kategori resimlerini getiren yeni bir metot ekleyelim
  async loadCategoryImages(categoryIds: string[]) {
    try {
      // Kategori detaylarını al
      const response = await this.categoryService.getCategoriesByIds(categoryIds);
      
      // Resimleri kategori ID'lerine göre düzenle
      response.items.forEach(category => {
        if (category.categoryImage && category.categoryImage.url) {
          this.categoryImages[category.id] = {
            url: category.categoryImage.url
          };
        }
      });
    } catch (error) {
      console.error('Error loading category images:', error);
    }
  }
  
  scrollLeft() {
    const grid = this.categoryGrid.nativeElement;
    grid.scrollBy({ left: -250, behavior: 'smooth' });
  }
  
  scrollRight() {
    const grid = this.categoryGrid.nativeElement;
    grid.scrollBy({ left: 250, behavior: 'smooth' });
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

  handlePageChange(updatedPageRequest: PageRequest): void {
    this.pageRequest = updatedPageRequest;
    this.searchProducts(); // Yeni sayfalama bilgilerine göre ürünleri yükle
  }

}