import { Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { FilterGroup } from 'src/app/contracts/product/filter/filters';
import { Product } from 'src/app/contracts/product/product';
import { ProductService } from 'src/app/services/common/models/product.service';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { Breadcrumb, BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { Brand } from 'src/app/contracts/brand/brand';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { Category } from 'src/app/contracts/category/category';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { FilterComponent } from '../../filter/filter.component';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { DownbarComponent } from '../../downbar/downbar.component';
import { FooterComponent } from '../../footer/footer.component';
import { UiProductListComponent } from '../../product/ui-product-list/ui-product-list.component';
import { DefaultImages } from 'src/app/contracts/defaultImages';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from 'src/app/base/components/pagination/pagination.component';

@Component({
  selector: 'app-brand-page',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MainHeaderComponent,
    NavbarComponent, 
    MatPaginatorModule, 
    FilterComponent,
    RouterModule,
    BreadcrumbComponent,
    UiProductListComponent,
    DownbarComponent,
    FooterComponent,
    PaginationComponent
  ],
  templateUrl: './brand-page.component.html',
  styleUrl: './brand-page.component.scss'
})
export class BrandPageComponent extends BaseComponent implements OnInit,OnChanges {
  @Input() brandId: string;
  @Input() key: number;

  brand: Brand;
  defaultBrandImageUrl: string = DefaultImages.defaultBrandImage;
  subCategories: Category[] = [];
  products: Product[] = [];
  availableFilters: FilterGroup[] = [];
  selectedFilters: { [key: string]: string[] } = {};
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 50 };
  totalItems: number = 0;
  noResults: boolean = false;
  sortOrder: string = '';
  isMobile: boolean = false;
  isFiltersLoading: boolean = false;
  isProductsLoading: boolean = false;
  pageList: number[] = [];
  Math = Math; // Template'de Math fonksiyonlarını kullanabilmek için

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
    spinner: SpinnerService
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

    this.showSpinner(SpinnerType.SquareLoader);
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
      this.hideSpinner(SpinnerType.SquareLoader);
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

  categoryImages: { [key: string]: any } = {};

  async loadAvailableFilters() {
    this.isFiltersLoading = true;
    try {
      // Marka ID'sine göre filtreleme yap
      const filters = await this.productService.getAvailableFilters(
        '', 
        null, 
        [this.brandId]
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

  async loadProducts() {
    this.isProductsLoading = true;
    //2 saniye delay yap ve spinner göster
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      this.selectedFilters['Brand'] = [this.brandId];
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
      console.error('Error fetching products:', error);
      this.noResults = true;
    } finally {
      this.isProductsLoading = false;
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  onFilterChange(filters: { [key: string]: string[] }) {
    // Brand filtresini korumak için
    if (!filters['Brand'] || !filters['Brand'].includes(this.brandId)) {
      filters['Brand'] = [this.brandId];
    }
    
    this.selectedFilters = { ...filters };
    this.pageRequest.pageIndex = 0;
    this.loadProducts();
  }


  onSortChange(event: Event) {
    this.sortOrder = (event.target as HTMLSelectElement).value;
    this.loadProducts();
  }

  updateBreadcrumbs() {
    if (this.brand) {
      const breadcrumbs: Breadcrumb[] = [
        { label: 'Brands', url: '/brand' }, // Bu düz sayfa olarak kalabilir
        { label: this.brand.name, url: `/${this.brand.id}` } // '/brand/' öneki olmadan
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

  handlePageChange(updatedPageRequest: PageRequest): void {
    this.pageRequest = updatedPageRequest;
    this.loadProducts(); // Yeni sayfalama bilgilerine göre ürünleri yükle
  }
}