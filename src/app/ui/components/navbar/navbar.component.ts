import { Component, OnInit, HostListener } from '@angular/core';
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

interface CategoryWithSubcategories extends Category {
  subcategories?: CategoryWithSubcategories[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent extends BaseComponent implements OnInit {
  categories: CategoryWithSubcategories[] = [];
  topLevelCategories: CategoryWithSubcategories[] = [];
  selectedCategory: CategoryWithSubcategories | null = null;
  recommendedProducts: Product[] = [];
  isAllProductsOpen: boolean = false;
  private categorySubject = new Subject<string>();
  private categoryCache: Map<string, Product[]> = new Map();

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

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private brandService: BrandService,
    spinner: NgxSpinnerService,
    private fb: FormBuilder
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
      .slice(0, 3); // Sadece ilk 3 sonucu göster
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

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 3 };

    try {
      const productResponse =
        await this.productService.getProductsByDynamicQuery(
          dynamicQuery,
          pageRequest
        );
      this.searchResults.products = productResponse.items;
      this.searchCache = productResponse.items;
      this.currentSearchTerm = searchTerm;

      // Kategori ve marka aramaları için benzer bir yaklaşım kullanabilirsiniz
      const categoryResponse =
        await this.categoryService.getCategoriesByDynamicQuery(
          {
            filter: { field: 'name', operator: 'contains', value: searchTerm },
          },
          pageRequest
        );
      this.searchResults.categories = categoryResponse.items;

      const brandResponse = await this.brandService.getBrandsByDynamicQuery(
        { filter: { field: 'name', operator: 'contains', value: searchTerm } },
        pageRequest
      );
      this.searchResults.brands = brandResponse.items;

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

    const filters: Filter[] = terms.map((term) => ({
      field: name,
      operator: 'contains',
      value: term,
      logic: 'or',
      filters: [
        {
          field: varyantGroupId,
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
      this.recentSearches = this.recentSearches.slice(0, 3);
      localStorage.setItem(
        'recentSearches',
        JSON.stringify(this.recentSearches)
      );
    }
  }

  navigateToSearchResult(type: string, id: string) {
    // Implement navigation logic
    console.log(`Navigating to ${type} with id ${id}`);
    this.isSearchFocused = false;
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
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 1000 };
    try {
      const response = await this.categoryService.list(pageRequest);
      this.categories = response.items;
      this.organizeCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
    this.hideSpinner(SpinnerType.BallSpinClockwise);
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
        const products = await this.productService.getRandomProductsByCategory(
          categoryId
        );
        this.categoryCache.set(categoryId, products);
        this.recommendedProducts = products;
      } catch (error) {
        console.error(
          `Error loading recommended products for category ${categoryId}:`,
          error
        );
        this.recommendedProducts = [];
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
}
