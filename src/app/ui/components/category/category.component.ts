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
import { PaginationComponent } from 'src/app/base/components/pagination/pagination.component';


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
    PaginationComponent
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
  allCategoryIds: string[] = []; // Store all category IDs including subcategories
    // Component sınıfı içinde bir property ekleyin:
  parsedCategories: { title: string; items: string[] }[] = [];
  isFormattedContent: boolean = false;
  isLoading: boolean = false;
  loadingProgress: number = 0;

  @ViewChild('categoryGrid') categoryGrid!: ElementRef;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private productService: ProductService,
    private breadcrumbService: BreadcrumbService,
    private productLikeService: ProductLikeService,
    private authService: AuthService,
    spinner: SpinnerService,
  ) {
    super(spinner);
  }

  ngOnInit() {
    if (this.categoryId) {
      this.loadData();
      this.checkScreenSize();
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // Sadece categoryId değiştiğinde ve gerçekten yeni bir değere sahip olduğunda yükle
    if (changes['categoryId'] && 
        !changes['categoryId'].firstChange && 
        this.categoryId && 
        changes['categoryId'].previousValue !== this.categoryId) {
      this.loadData();
    }
  }
  
  private loadData() {
    // Halihazırda yükleme yapılıyorsa çık
    if (this.isLoading) return;
    
    // Durumu sıfırla
    this.products = [];
    this.subCategories = [];
    this.selectedFilters = {};
    this.pageRequest.pageIndex = 0;
    this.allCategoryIds = [this.categoryId];
    
    // Yükleme bayraklarını ayarla
    this.isLoading = true;
    
    // Ana kategoriyi yükle ve ardından sadece bir seviye alt kategorileri getir
    this.loadCategory()
      .then(() => this.loadAllSubCategories()) // collectAndLoadAllSubCategories() yerine
      .then(() => this.loadAvailableFilters())
      .then(() => this.loadProducts())
      .finally(() => {
        this.isLoading = false;
      });
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
      this.parseCategory(); // Kategori bilgilerini ayrıştır
      this.updateBreadcrumbs();
    } catch (error) {
      console.error('Error loading category:', error);
      this.router.navigate(['/']);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }



private async loadAllSubCategories() {
  this.isFiltersLoading = true;
  try {
    // İlk olarak birinci seviye alt kategorileri yükle
    const directResponse = await this.categoryService.getSubCategories(this.categoryId);
    const directSubcategories = directResponse.items;
    
    // Tüm kategori ID'lerini toplamak için
    const allIds = [this.categoryId];
    const allSubcategories = [...directSubcategories];
    
    // Her alt kategori için, onun alt kategorilerini de yükle
    for (const subCategory of directSubcategories) {
      allIds.push(subCategory.id);
      
      // Alt kategori için alt kategorileri al
      try {
        const nestedResponse = await this.categoryService.getSubCategories(subCategory.id);
        if (nestedResponse.items && nestedResponse.items.length > 0) {
          allSubcategories.push(...nestedResponse.items);
          nestedResponse.items.forEach(nestedCat => allIds.push(nestedCat.id));
        }
      } catch (error) {
        console.error(`Alt kategori yüklenemedi: ${subCategory.id}`, error);
      }
    }
    
    // Tüm alt kategorileri kaydet
    this.subCategories = directSubcategories; // Sadece direkt alt kategorileri görüntüle
    this.allCategoryIds = [...new Set(allIds)]; // Tüm kategori ID'lerini sakla
    
    // Ürünleri yükle
    this.loadProducts();
  } catch (error) {
    console.error('Error loading subcategories:', error);
    this.loadProducts();
  } finally {
    this.isFiltersLoading = false;
  }
  
  return this.subCategories;
}
async loadAvailableFilters() {
  this.isFiltersLoading = true;
  try {
    // Sadece bir API çağrısı ile hiyerarşik kategori yapısını getir
    const filters = await this.productService.getAvailableFilters(
      '', // SearchTerm boş string olarak gönder
      [this.categoryId], // Sadece mevcut kategori ID'sini gönder
      null // Brand filtresi yok
    );
    
    this.availableFilters = filters;
    
    // FilterComponent zaten parent-child ilişkisini işleyecek
  } catch (error) {
    console.error('Error loading filters:', error);
  } finally {
    this.isFiltersLoading = false;
  }
}
  
  async loadProducts() {
    if (!this.categoryId) return;
    
    this.isProductsLoading = true;
    this.products = []; // Mevcut ürünleri temizle
    
    try {
      // Tüm kategori ID'lerini kullan (ana + alt kategoriler)
      if (!this.selectedFilters['Category'] || this.selectedFilters['Category'].length === 0) {
        // Eğer Category filtresi yoksa veya boşsa, tüm kategori ID'lerini ekle
        this.selectedFilters['Category'] = [...this.allCategoryIds];
      }      
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
        if (productIds.length > 0) {
          const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
          this.products.forEach(product => {
            product.isLiked = likedProductIds?.includes(product.id) || false;
          });
        }
      }
     } catch (error) {
      console.error('Error loading products:', error);
      this.noResults = true;
    } finally {
      this.isProductsLoading = false;
    }
  }

  onFilterChange(filters: { [key: string]: string[] }) {
    // Eğer kategori filtresinde bir şey yoksa tüm kategorileri kullan
    if (!filters['Category'] || filters['Category'].length === 0) {
      filters['Category'] = [...this.allCategoryIds];
    }
    
    // Kategori filtresini uygula
    this.selectedFilters = { ...filters };
    this.pageRequest.pageIndex = 0;
    
    // Ürünleri yeniden yükle
    this.loadProducts();
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
            url: `/${cat.id}` // Dynamic router'a yönlendirme
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

  parseCategory() {
    // Category yüklü değilse, işlem yapma
    if (!this.category?.title) {
      this.parsedCategories = [];
      this.isFormattedContent = false;
      return;
    }
    
    // Eğer başlık '|' ve ':' karakterlerini içermiyorsa, format edilmiş içerik değil
    if (!this.category.title.includes('|') || !this.category.title.includes(':')) {
      this.isFormattedContent = false;
      return;
    }
    
    const result: { title: string; items: string[] }[] = [];
    
    // '|' işaretiyle ayrılmış bölümleri ayır
    const sections = this.category.title.split('|');
    
    for (const section of sections) {
      const parts = section.split(':');
      if (parts.length < 2) continue;
      
      const title = parts[0].trim();
      const itemsText = parts.slice(1).join(':').trim();
      const items = itemsText.split(',').map(item => item.trim());
      
      result.push({ title, items });
    }
    
    // Eğer en az bir bölüm ayrıştırıldıysa, format edilmiş içerik
    this.isFormattedContent = result.length > 0;
    this.parsedCategories = result;
  }
  handlePageChange(updatedPageRequest: PageRequest): void {
    this.pageRequest = updatedPageRequest;
    this.loadProducts(); // Yeni sayfalama bilgilerine göre ürünleri yükle
  }
}