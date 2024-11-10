import { Component, OnInit, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from 'src/app/contracts/category/category';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { Product } from 'src/app/contracts/product/product';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
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

interface CategoryWithSubcategories extends Category {
  subcategories?: CategoryWithSubcategories[];
  
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss', '../../../../styles.scss']
})
export class NavbarComponent extends BaseComponent implements OnInit {
  categories: CategoryWithSubcategories[] = [];
  topLevelCategories: CategoryWithSubcategories[] = [];
  selectedCategory: CategoryWithSubcategories | null = null;
  recommendedProducts: GetListResponse<Product>
  isAllProductsOpen: boolean = false;
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

  @Input() showOnlyMainCategories: boolean = false;


  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private brandService: BrandService,
    spinner: NgxSpinnerService,
    private router: Router,
    private fb: FormBuilder,
  ) {
    super(spinner);
    this.setupCategorySubject();
    this.setupSearchSubject();
    this.createSearchForm();
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
        if (value.length >= 3) {
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
    this.showSpinner(SpinnerType.BallSpinClockwise);

    if (
      searchTerm.startsWith(this.currentSearchTerm) &&
      this.searchCache.length > 0
    ) {
      this.filterCachedResults(searchTerm);
    } else {
      await this.performNewSearch(searchTerm);
    }

    this.hideSpinner(SpinnerType.BallSpinClockwise);
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
    const filters: Filter[] = this.buildFilters(searchTerm);

    const dynamicQuery: DynamicQuery = {
      sort: [{ field: ProductFilterByDynamic.Name, dir: 'asc' }],
      filter:
        filters.length > 0
          ? {
              logic: 'and',
              filters: filters,
            }
          : undefined,
    };

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 5 };

    try {
      const productResponse =
        await this.productService.getProductsByDynamicQuery(
          dynamicQuery,
          pageRequest
        );
      this.searchResults.products = productResponse.items;
      this.searchCache = productResponse.items;
      this.currentSearchTerm = searchTerm;

      const categoryIds = this.searchResults.products.map(product => product.categoryId);
      const categoriesOfProducts = await this.categoryService.getCategoriesByIds(categoryIds);
      this.searchResults.categories = categoriesOfProducts.items;

      const brandIds = this.searchResults.products.map(product => product.brandId);
      const brandsOfProducts = await this.brandService.getBrandsByIds(brandIds);
      this.searchResults.brands = brandsOfProducts.items;

      this.saveRecentSearch(searchTerm);
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  private buildFilters(searchTerm: string): Filter[] {
    const terms = searchTerm.split(' ').filter((term) => term.length > 0);

    const name = ProductFilterByDynamic.Name;
    const varyantGroupId = ProductFilterByDynamic.VaryantGroupID;
    const description = ProductFilterByDynamic.Description;
    const title = ProductFilterByDynamic.Title;
    const brandName = ProductFilterByDynamic.BrandName;
    const categoryName = ProductFilterByDynamic.CategoryName

    const filters: Filter[] = terms.map((term) => ({
      field: name,
      operator: 'contains',
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

  private productMatchesSearchTerm(
    product: Product,
    searchTerm: string
  ): boolean {
    const terms = searchTerm
      .toLowerCase()
      .split(' ')
      .filter((term) => term.length > 0);
    const name = product.name.toLowerCase();
    const variantGroupId = product.varyantGroupID?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    const title = product.title?.toLowerCase() || '';

    return terms.every(
      (term) =>
        name.includes(term) ||
        variantGroupId.includes(term) ||
        description.includes(term) ||
        title.includes(term)
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
    this.loadCategories();
  }

  async loadCategories() {
    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 1000 };
    try {
      const response = await this.categoryService.getCategories(pageRequest);
      this.categories = response.items;
      this.organizeCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  organizeCategories() {
    const categoryMap = new Map<string, CategoryWithSubcategories>();

    this.categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, subcategories: [] });
    });

    this.categories.forEach((category) => {
      if (category.parentCategoryId) {
        const parentCategory = categoryMap.get(category.parentCategoryId);
        if (parentCategory) {
          parentCategory.subcategories?.push(categoryMap.get(category.id)!);
        }
      }
    });

    this.topLevelCategories = Array.from(categoryMap.values()).filter(
      (category) => !category.parentCategoryId
    );

    if (this.showOnlyMainCategories) {
      this.topLevelCategories.forEach(category => {
        category.subcategories = [];
      });
    }
  }

  selectCategory(category: CategoryWithSubcategories) {
    this.selectedCategory = category;
    this.categorySubject.next(category.id);
  }

  async loadRecommendedProductsWithCache(categoryId: string) {
    if (this.categoryCache.has(categoryId)) {
      this.recommendedProducts = this.categoryCache.get(categoryId)!;
    } else {
      this.showSpinner(SpinnerType.BallSpinClockwise);
      try {
        const response = await this.productService.getRandomProductsByCategory(categoryId);
        this.categoryCache.set(categoryId, response);
        this.recommendedProducts = response;
      } catch (error) {
        console.error(
          `Error loading recommended products for category ${categoryId}:`,
          error
        );
        this.recommendedProducts = { items: [], index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false };
      } finally {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      }
    }
  }

  toggleAllProducts() {
    this.isAllProductsOpen = !this.isAllProductsOpen;
  }

  openAllProducts() {
    this.isAllProductsOpen = true;
  }

  public closeAllProducts() {
    this.isAllProductsOpen = false;
  }

  closeDropdownIfClickedOutside(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeAllProducts();
    }
  }


  navigateToSearchResult(type: string, id: string) {
    const url = `/${type}/${id}`;
    
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
    this.router.navigate(['/product', productId]);
    this.closeAllProducts();
  }
  
  /* navigateToCategory(categoryId: string) {
    this.router.navigate(['/category', categoryId]);
    this.closeAllProducts();
  } */
  onProductClick(product: Product) {
    console.log('Product clicked:', product);
    this.navigateToSearchResult('product', product.id);
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

  /* toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.updateBodyScroll();
  } */

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
    this.router.navigate(['/category', categoryId]);
    this.closeAllProducts();
    this.isMobileMenuOpen = false; // Mobile menüyü kapat
    document.body.style.overflow = 'auto';
  }
}
