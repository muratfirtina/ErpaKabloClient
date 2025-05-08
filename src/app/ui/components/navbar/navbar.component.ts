import { Component, OnInit, HostListener, Input, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from 'src/app/contracts/category/category';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { Product } from 'src/app/contracts/product/product';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Brand } from 'src/app/contracts/brand/brand';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { Filter } from 'src/app/contracts/dynamic-query';
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
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  // Properties
  categories: CategoryWithSubcategories[] = [];
  topLevelCategories: CategoryWithSubcategories[] = [];
  selectedCategory: CategoryWithSubcategories | null = null;
  currentRecommendedCategory: CategoryWithSubcategories | null = null;
  recommendedProducts: GetListResponse<Product>;
  
  // States
  isAllProductsOpen: boolean = false;
  isMobileMenuOpen: boolean = false;
  isSearchFocused: boolean = false;
  
  // Loading states
  searchLoading: boolean = false;
  categoryLoading: boolean = false;
  subcategoryLoading: boolean = false;
  recommendedLoading: boolean = false;
  isCategoriesLoaded: boolean = false;
  
  // Search related
  recentSearches: string[] = [];
  searchResults: { products: Product[]; categories: Category[]; brands: Brand[]; } = { 
    products: [], categories: [], brands: [] 
  };
  searchForm: FormGroup;
  searchTerm: string = '';
  
  // Cache
  private categoryCache: Map<string, CategoryWithSubcategories[]> = new Map();
  private productCache: Map<string, GetListResponse<Product>> = new Map();
  private searchCache: Product[] = [];
  
  // RxJS subjects
  private destroy$ = new Subject<void>();
  private categorySubject = new Subject<string>();
  private searchSubject = new Subject<string>();
  private searchTimeoutId: any;
  private currentSearchTerm: string = '';
  
  // Refs
  @ViewChild('categoryDropdown') categoryDropdown: ElementRef;
  
  // Inputs
  @Input() showOnlyMainCategories: boolean = false;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private brandService: BrandService,
    private spinnerService: SpinnerService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    super(spinnerService);
    this.setupCategorySubject();
    this.setupSearchSubject();
    this.createSearchForm();
  }

  ngOnInit(): void {
    // Only initializes event listeners, doesn't load data
    this.loadRecentSearches();
  }
  
  ngAfterViewInit(): void {
    // Set up intersection observer for performance optimization
    this.setupIntersectionObserver();
  }
  
  // Setup methods
  private setupCategorySubject() {
    this.categorySubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((categoryId) => {
        this.loadRecommendedProductsWithCache(categoryId);
      });
  }

  private setupSearchSubject() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.searchProducts(searchTerm);
      });
  }

  private createSearchForm() {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.searchForm.get('searchTerm').valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this.debounceSearch(value);
      });
  }
  
  // Optimize search with debouncing
  private debounceSearch(searchTerm: string) {
    if (this.searchTimeoutId) {
      clearTimeout(this.searchTimeoutId);
    }
    
    this.searchTimeoutId = setTimeout(() => {
      if (searchTerm && searchTerm.length >= 2) {
        this.searchProducts(searchTerm);
      } else if (searchTerm.length === 0) {
        this.clearSearchResults();
      }
    }, 300);
  }
  
  // Setup intersection observer for lazy loading elements
  private setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const categoryId = entry.target.getAttribute('data-category-id');
          if (categoryId) {
            this.loadRecommendedProductsWithCache(categoryId);
            observer.unobserve(entry.target);
          }
        }
      });
    }, options);
    
    // Observe category elements when they're in the DOM
    setTimeout(() => {
      document.querySelectorAll('[data-category-id]').forEach(element => {
        observer.observe(element);
      });
    }, 1000);
  }

  // Search methods
  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { term: this.searchTerm }
      });
    }
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
      
      this.saveRecentSearch(searchTerm);
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
    if (!searchTerm || searchTerm.length < 2) return;
    
    this.searchLoading = true;
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // Use cache if possible for similar searches
      if (searchTerm.startsWith(this.currentSearchTerm) && this.searchCache.length > 0) {
        this.filterCachedResults(searchTerm);
      } else {
        await this.performNewSearch(searchTerm);
      }
      
      this.saveRecentSearch(searchTerm);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      this.searchLoading = false;
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  private filterCachedResults(searchTerm: string) {
    this.searchResults.products = this.searchCache
      .filter((product) => this.productMatchesSearchTerm(product, searchTerm))
      .slice(0, 5);
  }

  private async performNewSearch(searchTerm: string) {
    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 5 };
  
    try {
      // 1. Önce ürün araması yapalım
      const productResponse = await this.productService.getProductsByDynamicQuery(
        {
          sort: [{ field: ProductFilterByDynamic.Name, dir: 'asc' }],
          filter: {
            logic: 'and',
            filters: this.buildFilters(searchTerm)
          }
        },
        pageRequest
      );
      
      // 2. Doğrudan kategori ve marka araması da yapalım
      const [directCategoryResponse, directBrandResponse] = await Promise.all([
        this.categoryService.searchCategories(searchTerm),
        this.brandService.searchBrands(searchTerm)
      ]);
      
      // 3. Bulunan ürünlerin kategori ve marka ID'lerini toplayalım
      const categoryIds = new Set<string>();
      const brandIds = new Set<string>();
      
      productResponse.items.forEach(product => {
        if (product.categoryId) categoryIds.add(product.categoryId);
        if (product.brandId) brandIds.add(product.brandId);
      });
      
      // 4. Ürünlerden gelen kategori ve markaları getirelim
      const [relatedCategories, relatedBrands] = await Promise.all([
        this.categoryService.getCategoriesByIds(Array.from(categoryIds)),
        this.brandService.getBrandsByIds(Array.from(brandIds))
      ]);
      
      // 5. Tüm kategori ve markaları birleştirip, tekrarları kaldıralım
      const allCategories = [...directCategoryResponse.items, ...relatedCategories.items];
      const allBrands = [...directBrandResponse.items, ...relatedBrands.items];
      
      // 6. Tekrarları kaldır
      const uniqueCategories = this.removeDuplicateItems(allCategories, 'id');
      const uniqueBrands = this.removeDuplicateItems(allBrands, 'id');
      
      // 7. Sonuçları atayalım
      this.searchResults = {
        products: productResponse.items,
        categories: uniqueCategories,
        brands: uniqueBrands
      };
      
      // 8. Önbelleğe alalım
      this.searchCache = productResponse.items;
      this.currentSearchTerm = searchTerm;
      this.saveRecentSearch(searchTerm);
    } catch (error) {
      console.error('Search error:', error);
      this.searchResults = { products: [], categories: [], brands: [] };
    }
  }
  
  // Yardımcı metod: Nesneler listesinde belirli bir özelliğe göre tekrarları kaldır
  private removeDuplicateItems<T>(items: T[], key: keyof T): T[] {
    const seenKeys = new Set();
    return items.filter(item => {
      const itemKey = item[key];
      if (seenKeys.has(itemKey)) {
        return false;
      }
      seenKeys.add(itemKey);
      return true;
    });
  }

  private buildFilters(searchTerm: string): Filter[] {
    const terms = searchTerm.toLowerCase().split(' ').filter((term) => term.length > 0);

    // Simplified but effective filter
    return terms.map((term) => ({
      field: ProductFilterByDynamic.Name,
      operator: 'contains',
      value: term,
      logic: 'or',
      filters: [
        { field: ProductFilterByDynamic.BrandName, operator: 'contains', value: term },
        { field: ProductFilterByDynamic.Description, operator: 'contains', value: term },
        { field: ProductFilterByDynamic.Title, operator: 'contains', value: term },
        { field: ProductFilterByDynamic.CategoryName, operator: 'contains', value: term }
      ]
    }));
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
  
  clearSearchHistory() {
    this.recentSearches = [];
    localStorage.removeItem('recentSearches');
  }
  
  onRecentSearchClick(searchTerm: string) {
    this.searchForm.get('searchTerm').setValue(searchTerm);
    
    this.router.navigate(['/search'], { 
      queryParams: { q: searchTerm } 
    }).then(() => {
      this.searchForm.reset();
      this.isSearchFocused = false;
    });
  }

  saveRecentSearch(query: string) {
    if (!query || this.recentSearches.includes(query)) return;
    
    this.recentSearches.unshift(query);
    this.recentSearches = this.recentSearches.slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  // Category methods
  async loadCategories() {
    if (this.isCategoriesLoaded) return;
    
    this.categoryLoading = true;
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      const pageRequest: PageRequest = { pageIndex: -1, pageSize: -1 };
      const response = await this.categoryService.getMainCategories(pageRequest);
      
      this.topLevelCategories = response.items.map(category => ({
        ...category,
        subcategories: []
      }));
      
      this.isCategoriesLoaded = true;
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      this.categoryLoading = false;
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  async selectCategory(category: CategoryWithSubcategories) {
    this.subcategoryLoading = true;
    this.selectedCategory = category;
    this.currentRecommendedCategory = category;
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // Load subcategories if not already loaded
      if (!category.subcategories || category.subcategories.length === 0) {
        await this.loadSubcategories(category);
      }
      
      // Load recommended products
      this.categorySubject.next(category.id);
    } finally {
      this.subcategoryLoading = false;
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  loadRecommendedForSubcategory(category: CategoryWithSubcategories) {
    this.currentRecommendedCategory = category;
    this.recommendedLoading = true;
    this.categorySubject.next(category.id);
  }
  
  async loadSubcategories(category: CategoryWithSubcategories) {
    // Use cache if available
    const cacheKey = `subcategories_${category.id}`;
    if (this.categoryCache.has(cacheKey)) {
      category.subcategories = this.categoryCache.get(cacheKey);
      return;
    }
    
    try {
      const response = await this.categoryService.getSubCategories(category.id);
      const subcategories = response.items.map(subCategory => ({
        ...subCategory,
        subcategories: []
      }));
      
      // Cache the results
      this.categoryCache.set(cacheKey, subcategories);
      category.subcategories = subcategories;
    } catch (error) {
      console.error(`Error loading subcategories:`, error);
      category.subcategories = [];
    }
  }

  async loadRecommendedProductsWithCache(categoryId: string) {
    this.recommendedLoading = true;
    
    try {
      // Check cache first
      if (this.productCache.has(categoryId)) {
        this.recommendedProducts = this.productCache.get(categoryId);
        return;
      }
      
      // Otherwise load from API
      const response = await this.productService.getRandomProductsByCategory(categoryId);
      this.productCache.set(categoryId, response);
      this.recommendedProducts = response;
    } catch (error) {
      console.error(`Error loading products:`, error);
      this.recommendedProducts = { 
        items: [], index: 0, size: 0, count: 0, 
        pages: 0, hasPrevious: false, hasNext: false 
      };
    } finally {
      this.recommendedLoading = false;
    }
  }

  // UI interaction methods
  toggleAllProducts(): void {
    this.isAllProductsOpen = !this.isAllProductsOpen;
    
    // Değişiklikleri hemen uygula
    this.cdr.detectChanges();
    
    if (this.isAllProductsOpen && !this.isCategoriesLoaded) {
      this.loadCategories();
    }
    
    // Dropdown açıldığında sayfa kaydırmayı engelle
    if (this.isAllProductsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  openAllProducts() {
    this.isAllProductsOpen = true;
    
    if (!this.isCategoriesLoaded) {
      this.loadCategories();
    }
  }

  closeAllProducts() {
    this.isAllProductsOpen = false;
  }

  closeDropdownIfClickedOutside(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeAllProducts();
    }
  }

  // Navigation methods
  navigateToSearchResult(id: string) {
    const url = `/${id}`;
    
    if (this.router.url !== url) {
      this.router.navigateByUrl(url);
    } else {
      window.location.reload();
    }
    
    this.isSearchFocused = false;
  }
  
  navigateToRecommendedProduct(productId: string) {
    this.router.navigate(['/' + productId]);
    this.closeAllProducts();
  }
  
  onProductClick(product: Product) {
    this.navigateToSearchResult(product.id);
  }

  navigateToCategory(categoryId: string) {
    this.router.navigate(['/' + categoryId]);
    this.closeAllProducts();
    this.isMobileMenuOpen = false;
    document.body.style.overflow = 'auto';
  }

  // Mobile menu methods
  @HostListener('window:resize', ['$event'])
  onResize() {
    if (window.innerWidth > 768) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeMobileMenu();
      this.closeAllProducts();
    }
  }

  @HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  // Dropdown açıksa ve tıklanan element dropdown toggle butonu değilse kapat
  const dropdownToggle = document.querySelector('.dropdown-toggle1');
  const dropdownOverlay = document.querySelector('.dropdown-overlay');
  
  if (this.isAllProductsOpen) {
    // Tıklanan elementin dropdown toggle butonu veya dropdown overlay içinde olup olmadığını kontrol et
    const clickedOnToggle = dropdownToggle && dropdownToggle.contains(event.target as Node);
    const clickedOnOverlay = dropdownOverlay && dropdownOverlay.contains(event.target as Node);
    
    // Eğer toggle butonuna veya overlay içinde bir yere tıklanmadıysa dropdown'u kapat
    if (!clickedOnToggle && !clickedOnOverlay) {
      this.closeAllProducts();
    }
  }
}

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = 'auto';
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto'; // Bileşen yok edildiğinde scroll'u geri getir
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.searchTimeoutId) {
      clearTimeout(this.searchTimeoutId);
    }
  }
}