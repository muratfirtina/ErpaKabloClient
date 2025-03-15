import { Component, OnInit, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from 'src/app/contracts/category/category';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { Product } from 'src/app/contracts/product/product';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Subject, async } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  FormGroup,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Brand } from 'src/app/contracts/brand/brand';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { Filter, DynamicQuery } from 'src/app/contracts/dynamic-query';
import { ProductFilterByDynamic } from 'src/app/contracts/product/productFilterByDynamic';
import { Router, RouterModule } from '@angular/router';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { SpinnerComponent } from 'src/app/base/spinner/spinner.component';

interface CategoryWithSubcategories extends Category {
  subcategories?: CategoryWithSubcategories[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SpinnerComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss', '../../../../styles.scss']
})
export class NavbarComponent extends BaseComponent implements OnInit {
  categories: CategoryWithSubcategories[] = [];
  topLevelCategories: CategoryWithSubcategories[] = [];
  selectedCategory: CategoryWithSubcategories | null = null;
  recommendedProducts: GetListResponse<Product>
  isAllProductsOpen: boolean = false;
  searchLoading: boolean = false;
  categoryLoading: boolean = false;
  subcategoryLoading: boolean = false;
  recommendedLoading: boolean = false;
  isCategoriesLoaded: boolean = false;
  
  private categorySubject = new Subject<string>();
  private categoryCache: Map<string, GetListResponse<Product>> = new Map();

  isMobileMenuOpen: boolean = false;

  isSearchFocused: boolean = false;
  recentSearches: string[] = [];
  searchResults: {
    products: Product[];
    categories: Category[];
    brands: Brand[];
  } = { products: [], categories: [], brands: [] };
  private searchSubject = new Subject<string>();
  searchForm: FormGroup;
  private searchCache: Product[] = [];
  private currentSearchTerm: string = '';

  searchTerm: string = '';

  @Input() showOnlyMainCategories: boolean = false;


  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private brandService: BrandService,
    spinner: SpinnerService,
    private router: Router,
    private fb: FormBuilder,
  ) {
    super(spinner);
    this.setupCategorySubject();
    this.setupSearchSubject();
    this.createSearchForm();
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
        this.router.navigate(['/search'], {
            queryParams: { term: this.searchTerm }
        });
    }
  }

  private setupCategorySubject() {
    this.categorySubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((categoryId) => {
        this.loadRecommendedProductsWithCache(categoryId);
      });
  }

  private createSearchForm() {
    this.searchForm = this.fb.group({
      searchTerm: [''],
    });

    this.searchForm
      .get('searchTerm')
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        if (value.length >= 2) {
          this.searchProducts(value);
        } else if (value.length === 0) {
          this.clearSearchResults();
        }
      });
  }

  private setupSearchSubject() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchProducts(searchTerm);
      });
  }

  onSearchSubmit(event: Event) {
    event.preventDefault();
    const searchTerm = this.searchForm.get('searchTerm')?.value?.trim();
    
    if (searchTerm) {
      this.router.navigate(['/search'], { 
        queryParams: { q: searchTerm } 
      }).then(() => {
        this.searchForm.reset();
        this.isSearchFocused = false;
      });
    }
  }

  onSearchFocus() {
    this.isSearchFocused = true;
    this.loadRecentSearches();
  }

  onSearchBlur() {
    setTimeout(() => {
      this.isSearchFocused = false;
    }, 200);
  }

  async searchProducts(searchTerm: string) {
    this.searchLoading = true;
    this.showSpinner(SpinnerType.SquareLoader);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      if (searchTerm.startsWith(this.currentSearchTerm) && this.searchCache.length > 0) {
        this.filterCachedResults(searchTerm);
      } else {
        await this.performNewSearch(searchTerm);
      }
    } finally {
      this.searchLoading = false;
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  private filterCachedResults(searchTerm: string) {
    this.searchResults.products = this.searchCache
      .filter((product) => this.productMatchesSearchTerm(product, searchTerm))
      .slice(0, 5); // Sadece ilk 3 sonucu göster
    this.saveRecentSearch(searchTerm);
  }

  clearSearchHistory() {
    this.recentSearches = [];
    localStorage.removeItem('recentSearches');
  }

  private async performNewSearch(searchTerm: string) {
    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 5 };

    try {
        // Tüm aramaları parallel olarak yapalım
        const [productResponse, directCategoryResponse, directBrandResponse] = await Promise.all([
            // 1. Ürün araması
            this.productService.getProductsByDynamicQuery(
                {
                    sort: [{ field: ProductFilterByDynamic.Name, dir: 'asc' }],
                    filter: {
                        logic: 'and',
                        filters: this.buildFilters(searchTerm)
                    }
                },
                pageRequest
            ),
            
            // 2. Doğrudan kategori araması
            this.categoryService.searchCategories(searchTerm),
            
            // 3. Doğrudan marka araması
            this.brandService.searchBrands(searchTerm)
        ]);

        // 4. Ürünlerin kategori ve markalarını al
        const productCategoryIds = productResponse.items.map(product => product.categoryId);
        const productBrandIds = productResponse.items.map(product => product.brandId);

        const [relatedCategories, relatedBrands] = await Promise.all([
            this.categoryService.getCategoriesByIds(productCategoryIds),
            this.brandService.getBrandsByIds(productBrandIds)
        ]);

        // Tüm sonuçları birleştir ve tekrarları kaldır
        const allCategories = [...directCategoryResponse.items, ...relatedCategories.items];
        const allBrands = [...directBrandResponse.items, ...relatedBrands.items];

        this.searchResults = {
            products: productResponse.items,
            categories: this.removeDuplicates(allCategories, 'id'),
            brands: this.removeDuplicates(allBrands, 'id')
        };
        
        this.searchCache = productResponse.items;
        this.currentSearchTerm = searchTerm;
        this.saveRecentSearch(searchTerm);
        
    } catch (error) {
        console.error('Search error:', error);
    }
  }

  // Yardımcı metod: Tekrarlanan sonuçları kaldır
  private removeDuplicates<T>(array: T[], key: keyof T): T[] {
      return Array.from(new Map(array.map(item => [item[key], item])).values());
  }

  private buildFilters(searchTerm: string): Filter[] {
    // Arama terimlerini küçük harfe çevirip boşluklara göre ayırıyoruz
    const terms = searchTerm.toLowerCase().split(' ').filter((term) => term.length > 0);

    const name = ProductFilterByDynamic.Name;
    const varyantGroupId = ProductFilterByDynamic.VaryantGroupID;
    const description = ProductFilterByDynamic.Description;
    const title = ProductFilterByDynamic.Title;
    const brandName = ProductFilterByDynamic.BrandName;
    const categoryName = ProductFilterByDynamic.CategoryName;

    const filters: Filter[] = terms.map((term) => ({
      field: name,
      operator: 'contains', // case-insensitive operatör
      value: term,
      logic: 'or',
      filters: [
        {
          field: brandName,
          operator: 'contains',
          value: term,
          logic: 'or',
          filters: [
            {
              field: description,
              operator: 'contains',
              value: term,
              logic: 'or',
              filters: [
                {
                  field: title,
                  operator: 'contains',
                  value: term,
                  logic: 'or',
                  filters: [
                    {
                      field: categoryName,
                      operator: 'contains',
                      value: term,
                    }
                  ]
                },
              ],
            },
          ],
        },
      ],
    }));

    return filters;
  }

  private productMatchesSearchTerm(product: Product, searchTerm: string): boolean {
    const terms = searchTerm.toLowerCase().split(' ').filter((term) => term.length > 0);
    
    const productFields = {
      name: product.name?.toLowerCase() || '',
      variantGroupId: product.varyantGroupID?.toLowerCase() || '',
      description: product.description?.toLowerCase() || '',
      title: product.title?.toLowerCase() || '',
      brandName: product.brandName?.toLowerCase() || '',
      categoryName: product.categoryName?.toLowerCase() || ''
    };

    return terms.every((term) =>
      Object.values(productFields).some(field => field.includes(term))
    );
  }

  clearSearchResults() {
    this.searchResults = { products: [], categories: [], brands: [] };
    this.searchCache = [];
    this.currentSearchTerm = '';
  }

  loadRecentSearches() {
    const searches = localStorage.getItem('recentSearches');
    if (searches) {
      this.recentSearches = JSON.parse(searches);
    }
  }
  
  // Recent search'e tıklandığında çağrılacak metod
  async onRecentSearchClick(searchTerm: string) {
    // Form'un değerini güncelle
    this.searchForm.get('searchTerm').setValue(searchTerm);
    
    // Arama sayfasına yönlendir
    this.router.navigate(['/search'], { 
      queryParams: { q: searchTerm } 
    }).then(() => {
      this.searchForm.reset();
      this.isSearchFocused = false;
    });
  }

  saveRecentSearch(query: string) {
    if (!this.recentSearches.includes(query)) {
      this.recentSearches.unshift(query);
      this.recentSearches = this.recentSearches.slice(0, 5);
      localStorage.setItem(
        'recentSearches',
        JSON.stringify(this.recentSearches)
      );
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const dropdownElement = document.querySelector('.dropdown-overlay');
    const allProductsButton = document.querySelector(
      '.all-products-dropdown button'
    );

    if (this.isAllProductsOpen && dropdownElement && allProductsButton) {
      if (
        !dropdownElement.contains(event.target as Node) &&
        !allProductsButton.contains(event.target as Node)
      ) {
        this.closeAllProducts();
      }
    }
  }

  ngOnInit(): void {
    // Remove loading categories on init
    // Now only setup other initialization tasks if needed
  }

  async loadCategories() {
    if (this.isCategoriesLoaded) {
      return; // Skip if categories are already loaded
    }
    
    this.categoryLoading = true;
    this.showSpinner(SpinnerType.SquareLoader);
    try {
      // Sadece ana kategorileri yükle
      const pageRequest: PageRequest = { pageIndex: -1, pageSize: -1 };
      const response = await this.categoryService.getMainCategories(pageRequest);
      this.topLevelCategories = response.items.map(category => ({
        ...category,
        subcategories: [] // Başlangıçta boş alt kategoriler
      }));
      this.isCategoriesLoaded = true;
    } catch (error) {
      console.error('Error loading main categories:', error);
    } finally {
      this.categoryLoading = false;
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  // Bu metod artık kullanılmıyor, ana kategoriler direkt olarak yükleniyor
  // ve alt kategoriler talep üzerine (hover) ayrı ayrı yükleniyor

  async selectCategory(category: CategoryWithSubcategories) {
    this.subcategoryLoading = true;
    this.selectedCategory = category;
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // Alt kategorileri sadece onları henüz yüklemediyse yükle
      if (!category.subcategories || category.subcategories.length === 0) {
        await this.loadSubcategories(category);
      }
      
      // Önerilen ürünleri yükle
      this.categorySubject.next(category.id);
    } finally {
      this.subcategoryLoading = false;
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }
  
  async loadSubcategories(category: CategoryWithSubcategories) {
    try {
      const response = await this.categoryService.getSubCategories(category.id);
      
      // Alt kategorileri set et
      category.subcategories = response.items.map(subCategory => ({
        ...subCategory,
        subcategories: [] // Başlangıçta boş alt-alt kategoriler
      }));
      
      // Her bir alt kategori için alt-alt kategorileri yüklemek istersen:
      // Bu özelliği aktif etmek için aşağıdaki kod bloğunu yorum satırından çıkar
      /*
      for (const subCategory of category.subcategories) {
        try {
          const nestedResponse = await this.categoryService.getSubCategories(subCategory.id);
          subCategory.subcategories = nestedResponse.items;
        } catch (error) {
          console.error(`Error loading nested subcategories for ${subCategory.name}:`, error);
        }
      }
      */
    } catch (error) {
      console.error(`Error loading subcategories for ${category.name}:`, error);
      category.subcategories = []; // Hata durumunda boş dizi
    }
  }

  async loadRecommendedProductsWithCache(categoryId: string) {
    this.recommendedLoading = true;
    this.showSpinner(SpinnerType.SquareLoader);
    try {
      const response = await this.productService.getRandomProductsByCategory(categoryId);
      this.categoryCache.set(categoryId, response);
      this.recommendedProducts = response;
    } catch (error) {
      console.error(`Error loading recommended products for category ${categoryId}:`, error);
      this.recommendedProducts = { items: [], index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false };
    } finally {
      this.recommendedLoading = false;
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  toggleAllProducts() {
    this.isAllProductsOpen = !this.isAllProductsOpen;
    
    if (this.isAllProductsOpen && !this.isCategoriesLoaded) {
      this.loadCategories();
    }
  }

  openAllProducts() {
    this.isAllProductsOpen = true;
    
    if (!this.isCategoriesLoaded) {
      this.loadCategories();
    }
  }

  public closeAllProducts() {
    this.isAllProductsOpen = false;
  }

  closeDropdownIfClickedOutside(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeAllProducts();
    }
  }

  navigateToSearchResult(id: string) {
    const url = `/${id}`;
    
    // Mevcut URL'yi kontrol et
    if (this.router.url !== url) {
      this.router.navigateByUrl(url).then(
        (success) => {
          console.log('Navigation result:', success);
          if (success) {
            // Navigasyon başarılı olduktan sonra sayfayı yenile
            window.location.reload();
          } else {
            window.location.href = url; // Fallback yöntemi
          }
        },
        (error) => console.error('Navigation error:', error)
      );
    } else {
      // Eğer aynı sayfadaysak, sadece sayfayı yenile
      window.location.reload();
    }
    
    this.isSearchFocused = false;
  }
  
  navigateToRecommendedProduct(productId: string) {
    this.router.navigate(['/'+productId]);
    this.closeAllProducts();
  }
  
  onProductClick(product: Product) {
    this.navigateToSearchResult(product.id);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (window.innerWidth > 768) {
      this.closeMobileMenu();
    }
  }

  // ESC tuşu ile menüyü kapatma
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeMobileMenu();
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.updateBodyScroll();
  }

  private updateBodyScroll() {
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  // Component destroy olduğunda scroll'u geri getir
  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  // Mevcut navigateToCategory metodunu güncelle
  navigateToCategory(categoryId: string) {
    this.router.navigate(['/'+ categoryId]);
    this.closeAllProducts();
    this.isMobileMenuOpen = false; // Mobile menüyü kapat
    document.body.style.overflow = 'auto';
  }
}