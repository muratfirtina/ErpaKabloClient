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
      // Sayfa durumunu sıfırla
      this.products = [];
      this.subCategories = [];
      this.selectedFilters = {};
      this.pageRequest.pageIndex = 0;
      this.allCategoryIds = [this.categoryId]; // Kategori ID'lerini sıfırla
      this.parsedCategories = []; // Ayrıştırılmış kategorileri sıfırla
      
      // Yeni veri yükle
      this.loadCategory();
      
      // Önce alt kategorileri ve filtreleri yükle, sonra ürünleri yükle (sıralı işlem)
      this.loadSubCategories().then(() => {
        this.loadAvailableFilters();
      });
      
      // Sayfanın başına kaydır
      window.scrollTo(0, 0);
    }
  }

  ngOnInit() {
    if (this.categoryId) {
      this.allCategoryIds = [this.categoryId]; // İlk durum olarak mevcut kategoriyi başlat
      
      // Ana kategoriyi yükle
      this.loadCategory();
      
      // Önce alt kategorileri yükle, sonra ürünleri ve filtreleri yükle
      this.loadSubCategories().then(() => {
        this.loadAvailableFilters();
      });
      
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
      this.parseCategory(); // Kategori bilgilerini ayrıştır
      this.updateBreadcrumbs();
    } catch (error) {
      console.error('Error loading category:', error);
      this.router.navigate(['/']);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  async loadSubCategories() {
    this.isFiltersLoading = true;
    try {
      // Ana kategorinin alt kategorilerini yükle
      const response = await this.categoryService.getSubCategories(this.categoryId);
      this.subCategories = response.items;
      
      // Tüm alt kategorileri toplayacak rekursif bir fonksiyon
      const collectAllSubcategoryIds = async (categoryId: string): Promise<string[]> => {
        try {
          // Bu kategorinin alt kategorilerini al
          const response = await this.categoryService.getSubCategories(categoryId);
          const subcategories = response.items;
          
          if (!subcategories || subcategories.length === 0) {
            return []; // Alt kategori yoksa boş dizi döndür
          }
          
          // Tüm doğrudan alt kategori ID'lerini topla
          const directSubcategoryIds = subcategories.map(c => c.id);
          
          // Her bir alt kategori için, onun alt kategorilerini rekursif olarak topla
          const allNestedIds: string[] = [];
          
          // Alt kategorilerin her biri için rekursif olarak alt kategorileri getir
          const nestedPromises = directSubcategoryIds.map(async (subCatId) => {
            const nestedIds = await collectAllSubcategoryIds(subCatId);
            return nestedIds;
          });
          
          // Tüm alt kategorilerin işlemlerini tamamla ve sonuçları birleştir
          const nestedResults = await Promise.all(nestedPromises);
          nestedResults.forEach(nestedIds => {
            allNestedIds.push(...nestedIds);
          });
          
          // Doğrudan alt kategoriler + onların alt kategorileri
          return [...directSubcategoryIds, ...allNestedIds];
        } catch (error) {
          console.error(`Error collecting subcategories for ${categoryId}:`, error);
          return [];
        }
      };
      
      // Ana kategorinin tüm alt kategorilerini topla
      const allSubcategoryIds = await collectAllSubcategoryIds(this.categoryId);
      
      // Benzersiz kategori ID'lerini ekle (mükerrer olmaması için)
      this.allCategoryIds = [this.categoryId, ...new Set(allSubcategoryIds)];
      
      
      // Şimdi tüm kategorilerin ürünlerini yükle
      this.loadProducts();
    } catch (error) {
      console.error('Error loading subcategories:', error);
      this.loadProducts(); // Sadece ana kategori ürünlerini yüklemeyi dene
    } finally {
      this.isFiltersLoading = false;
    }
    
    return this.subCategories;
  }
  
  async loadAvailableFilters() {
    this.isFiltersLoading = true;
    try {
        // Önce alt kategorilerin yüklenmesini bekle
        if (this.allCategoryIds.length <= 1) {
            await this.loadSubCategories();
        }
      
      
        // Boş string olarak searchTerm gönderme
        const filters = await this.productService.getAvailableFilters(
            '', // MUTLAKA boş string olarak gönder (null yerine)
            this.allCategoryIds,
            null
        );
      
        // Category filtresi için özel işlem
        const categoryFilter = filters.find(f => f.key === 'Category');
        if (categoryFilter) {
            categoryFilter.options.forEach(option => {
                (option as any).selected = this.allCategoryIds.includes(option.value);
            });
        }
      
        this.availableFilters = filters;
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
    // Kategori seçiminin değişip değişmediğini kontrol et
    let hasChangedCategory = false;
    
    if (filters['Category'] && filters['Category'].length === 1) {
      const selectedCategoryId = filters['Category'][0];
      // Eğer seçilen kategori mevcut kategori değilse ve alt kategorilerden biri değilse
      hasChangedCategory = selectedCategoryId !== this.categoryId && 
                          !this.allCategoryIds.slice(1).includes(selectedCategoryId);
    }
    
    if (hasChangedCategory && filters['Category'] && filters['Category'].length === 1) {
      // Kategori tamamen değişti, yeni kategori sayfasına yönlendir
      this.router.navigate(['/category', filters['Category'][0]]);
    } else {
      // Mevcut kategori içindeki filtre değişikliklerini uygula
      
      // Kategori filtrelemesi
      if (!filters['Category'] || filters['Category'].length === 0) {
        // Kategori filtresi yoksa, tüm kategorileri kullan
        filters['Category'] = [...this.allCategoryIds];
      } else if (filters['Category'].length === 1 && this.allCategoryIds.includes(filters['Category'][0])) {
        // Tek bir kategori seçiliyse ve bu bizim kategorilerimizden biriyse
        
        // Eğer ana kategori seçildiyse, tüm alt kategorileri dahil et
        if (filters['Category'][0] === this.categoryId) {
          filters['Category'] = [...this.allCategoryIds];
        }
        // Alt kategori seçildiyse, sadece onu kullan (kodda değişiklik yok)
      }
      
      this.selectedFilters = { ...filters };
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
  formatCategoryTitle(title: string): string {
    if (!title) return '';
    
    // Eğer başlık zaten HTML formatında ise, doğrudan döndür
    if (title.includes('</')) return title;
    
    // Veritabanındaki metni yapılandırılmış bir şekilde ayrıştır
    // Örnek format: "Types: Standard, Low Pressure... | Materials: PP, PA... | Standards: TS EN ISO..."
    const sections = title.split('|');
    
    let html = '<div class="category-columns">';
    
    sections.forEach(section => {
      const parts = section.split(':');
      if (parts.length < 2) return; // Atlama durumunu kontrol et
      
      const header = parts[0].trim();
      const itemsText = parts.slice(1).join(':').trim();
      const itemsList = itemsText.split(',');
      
      html += `
        <div class="category-column">
          <h2>${header}</h2>
          <ul>
            ${itemsList.map(item => `<li>${item.trim()}</li>`).join('')}
          </ul>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
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