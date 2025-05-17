import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { PaginationComponent } from 'src/app/base/components/pagination/pagination.component';
import { Filter, DynamicQuery } from 'src/app/contracts/dynamic-query';
import { Product } from 'src/app/contracts/product/product';
import { ProductFilterByDynamic } from 'src/app/contracts/product/productFilterByDynamic';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { Category } from 'src/app/contracts/category/category';

// Kategori ağacı için node yapısı
interface CategoryTreeNode {
  category: any; // Category türünde
  children: CategoryTreeNode[];
  level: number;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    ReactiveFormsModule, 
    DeleteDirectiveComponent,
    PaginationComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent extends BaseComponent implements OnInit {

  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listProduct: GetListResponse<Product> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  pagedProducts: Product[] = [];
  selectedProducts: Product[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  pageList: number[] = [];
  searchForm: FormGroup;
  private searchCache: Product[] = []; // Search results cache
  private currentSearchTerm: string = ''; // Current search term
  isMobile: boolean = false; // Track screen size
  
  // Kategori yapısıyla ilgili değişkenler
  categories: Category[] = []; // Tüm kategoriler
  categoriesMap: Map<string, Category> = new Map(); // ID'ye göre hızlı erişim
  mainCategories: Category[] = []; // Ana kategoriler
  categoryHierarchy: CategoryTreeNode[] = []; // Hiyerarşik kategori ağacı
  loadingCategories: boolean = false;

  // Kategori genişletme durumunu izlemek için harita
  expandedCategories: Map<string, boolean> = new Map();
  selectedCategoryId: string = '';
  showCategorySelector: boolean = false;

  constructor(
    spinner: SpinnerService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastrService: CustomToastrService,
    private dialogService: DialogService,
    private fb: FormBuilder
  ) {
    super(spinner);

    this.searchForm = this.fb.group({
      nameSearch: [''],
      categoryFilter: [''],
      varyantGroupIdSearch: [''],
      featureValueNameSearch: [''],
    });

    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3 || value.length === 0) {
        this.applyFilters();
      }
    });

    // Check screen size on init
    this.checkScreenSize();
    // Add resize listener
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  async ngOnInit() {
    await this.getCategories();
    await this.getProducts();
    this.initializeCategoryTree();
    
    // Kategori seçici dışında bir yere tıklandığında kapat
    document.addEventListener('click', this.closeCategorySelector.bind(this));
  }

  ngOnDestroy() {
    // Tüm event listener'ları temizle
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
    document.removeEventListener('click', this.closeCategorySelector.bind(this));
  }

  async getCategories() {
    this.loadingCategories = true;
    try {
      // Kategorileri getirmek için mevcut servis metodunu kullanıyoruz
      // Tüm kategorileri almak için büyük bir pageSize değeri kullanıyoruz
      const categoryPageRequest: PageRequest = { pageIndex: 0, pageSize: 1000 };
      const categoriesResponse = await this.categoryService.getCategories(categoryPageRequest);
      this.categories = categoriesResponse.items;
      
      // Kategorileri ID'ye göre hızlı erişim için mapliyoruz
      this.categoriesMap.clear();
      this.categories.forEach(category => {
        this.categoriesMap.set(category.id, category);
      });
      
      // Ana kategorileri buluyoruz (parentId olmayan veya boş olanlar)
      this.mainCategories = this.categories.filter(c => !c.parentCategoryId);
      
      // Kategori hiyerarşisini oluşturuyoruz
      await this.buildCategoryHierarchy();
    } catch (error) {
      this.toastrService.message('Kategoriler yüklenemedi', 'Hata', 
        { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    } finally {
      this.loadingCategories = false;
    }
  }
  
  // Kategori ağacını oluşturma
  async buildCategoryHierarchy() {
    this.categoryHierarchy = [];
    
    // Ana kategorileri ekle
    for (const mainCategory of this.mainCategories) {
      const node: CategoryTreeNode = {
        category: mainCategory,
        children: [],
        level: 0
      };
      
      // Alt kategorileri bul
      await this.loadChildCategories(node);
      
      this.categoryHierarchy.push(node);
    }
  }
  
  // Bir kategori node'u için alt kategorileri yükle
  async loadChildCategories(node: CategoryTreeNode) {
    try {
      // Alt kategorileri al
      const subCategoriesResponse = await this.categoryService.getSubCategories(node.category.id);
      const subCategories = subCategoriesResponse.items;
      
      // Alt kategorileri bu node'a ekle
      for (const subCategory of subCategories) {
        const childNode: CategoryTreeNode = {
          category: subCategory,
          children: [],
          level: node.level + 1
        };
        
        // Rekürsif olarak alt kategorilerin alt kategorilerini yükle
        await this.loadChildCategories(childNode);
        
        node.children.push(childNode);
      }
    } catch (error) {
      console.error(`Alt kategoriler yüklenemedi: ${node.category.name}`, error);
    }
  }
  
  // Hiyerarşik kategorileri düz bir liste olarak getir (select için)
  getFlattenedCategories(): {id: string, name: string, level: number}[] {
    const result: {id: string, name: string, level: number}[] = [];
    
    const addCategoryNode = (node: CategoryTreeNode) => {
      // Ana kategori ekle
      result.push({
        id: node.category.id,
        name: node.category.name,
        level: node.level
      });
      
      // Alt kategorileri ekle
      node.children.forEach(childNode => {
        addCategoryNode(childNode);
      });
    };
    
    // Tüm ağacı dolaş
    this.categoryHierarchy.forEach(node => {
      addCategoryNode(node);
    });
    
    return result;
  }

  async getProducts() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    const data: GetListResponse<Product> = await this.productService.list(
      { pageIndex: this.currentPageNo - 1, pageSize: this.pageSize },
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      }
    );
  
    this.listProduct = data;
    this.pagedProducts = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onPageChange(event: PageRequest) {
    this.pageRequest = event;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  resetFilters() {
    this.searchForm.reset({
      nameSearch: '',
      categoryFilter: ''
    });
    this.searchCache = [];
    this.currentSearchTerm = '';
    this.currentPageNo = 1;
    this.selectedCategoryId = '';
    this.getProducts();
  }

  applyFilters() {
    const searchTerm = this.searchForm.get('nameSearch')?.value || '';
    const categoryId = this.searchForm.get('categoryFilter')?.value || '';
    
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    // Build the filters
    const filters: Filter[] = [];
    
    // Add name search filters if search term exists
    if (searchTerm.length >= 3) {
      filters.push(...this.buildNameSearchFilters(searchTerm));
    }
    
    // Add category filter if selected
    if (categoryId) {
      filters.push({
        field: 'CategoryId',
        operator: 'eq',
        value: categoryId
      });
    }
    
    // If no filters, just get all products
    if (filters.length === 0 && searchTerm.length === 0) {
      this.getProducts();
      return;
    }
    
    // Create dynamic query
    const dynamicQuery: DynamicQuery = {
      sort: [{ field: 'Name', dir: 'asc' }],
      filter: {
        logic: 'and',
        filters: filters
      }
    };
    
    const pageRequest: PageRequest = { 
      pageIndex: this.currentPageNo - 1, 
      pageSize: this.pageSize 
    };
    
    // Execute query
    this.productService.getProductsByDynamicQuery(dynamicQuery, pageRequest)
      .then((response) => {
        this.pagedProducts = response.items;
        this.count = response.count;
        this.pages = response.pages;
        
        // Update cache if it's a name search
        if (searchTerm.length >= 3) {
          this.searchCache = response.items;
          this.currentSearchTerm = searchTerm;
        }
      })
      .catch((error) => {
        this.toastrService.message(error, 'Error', 
          { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      })
      .finally(() => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      });
  }

  private buildNameSearchFilters(searchTerm: string): Filter[] {
    const terms = searchTerm.split(' ').filter(term => term.length > 0);
  
    const name = ProductFilterByDynamic.Name;
    const varyantGroupId = ProductFilterByDynamic.VaryantGroupID;
    const description = ProductFilterByDynamic.Description;
    const title = ProductFilterByDynamic.Title;
    
    return terms.map(term => ({
      field: name,
      operator: "contains",
      value: searchTerm,
      logic: "or",
      filters: [
        {
          field: varyantGroupId,
          operator: "contains",
          value: searchTerm,
          logic: "or",
          filters: [
            {
              field: description,
              operator: "contains",
              value: searchTerm,
              logic: "or",
              filters: [
                {
                  field: title,
                  operator: "contains",
                  value: searchTerm,
                }
              ],
            },
          ],
        },
      ],
    }));
  }

  private productMatchesSearchTerm(product: Product, searchTerm: string): boolean {
    const terms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
    const name = product.name.toLowerCase();
    const variantGroupId = product.varyantGroupID?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    const title = product.title?.toLowerCase() || '';
  
    return terms.every(term => 
      name.includes(term) || variantGroupId.includes(term) || description.includes(term) || title.includes(term)
    );
  }

  removeProductFromList(productId: string) {
    this.pagedProducts = this.pagedProducts.filter(product => product.id !== productId);
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    if (this.pagedProducts.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.applyFilters();
    }
  }
  
  // Kategori ID'sine göre kategori adını getir
  getCategoryName(categoryId: string): string {
    const category = this.categoriesMap.get(categoryId);
    return category ? category.name : 'Kategori';
  }
  
  // Bir kategori için girinti seviyesine göre metin oluştur
  getCategoryIndentedName(category: {id: string, name: string, level: number}): string {
    const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(category.level); // non-breaking spaces
    const prefix = category.level > 0 ? '↳ ' : '';
    return `${indent}${prefix}${category.name}`;
  }
  
  // Bir node'daki kategori gösterilmeli mi?
  isCategoryNodeVisible(node: CategoryTreeNode): boolean {
    // Ana kategoriler her zaman görünür
    if (node.level === 0) return true;
    
    // Üst kategorinin genişletilmiş olup olmadığını kontrol et
    const parentCategory = this.findParentCategory(node.category.id);
    
    if (!parentCategory) return false;
    
    const isParentExpanded = this.expandedCategories.get(parentCategory.id) || false;
    
    // Eğer üst kategori genişletilmişse ve görünürse, bu da görünür
    return isParentExpanded && this.isCategoryNodeVisible(this.findCategoryNodeById(parentCategory.id));
  }
  
  // ID'ye göre kategori node'unu bul
  findCategoryNodeById(categoryId: string, nodeList: CategoryTreeNode[] = this.categoryHierarchy): CategoryTreeNode | null {
    for (const node of nodeList) {
      if (node.category.id === categoryId) return node;
      
      // Alt kategorilerde ara
      if (node.children && node.children.length > 0) {
        const foundInChildren = this.findCategoryNodeById(categoryId, node.children);
        if (foundInChildren) return foundInChildren;
      }
    }
    
    return null;
  }
  
  // Bir kategorinin üst kategorisini bul
  findParentCategory(categoryId: string): any | null {
    const category = this.categoriesMap.get(categoryId);
    if (!category || !category.parentCategoryId) return null;
    
    return this.categoriesMap.get(category.parentCategoryId) || null;
  }
  
  // Bir kategoriyi genişlet/daralt
  toggleCategory(categoryId: string, event: Event) {
    event.stopPropagation(); // Kategori seçimini engellemek için event'i durdur
    
    const currentState = this.expandedCategories.get(categoryId) || false;
    this.expandedCategories.set(categoryId, !currentState);
  }
  
  // Kategori seçimi
  selectCategory(categoryId: string) {
    this.selectedCategoryId = categoryId;
    this.searchForm.get('categoryFilter')?.setValue(categoryId);
    this.showCategorySelector = false; // Seçimden sonra kategori seçiciyi kapat
    this.applyFilters();
  }
  
  // Tüm kategorileri kapat
  collapseAllCategories() {
    this.expandedCategories.clear();
  }
  
  // Kategori seçicisini aç/kapat
  toggleCategorySelector() {
    this.showCategorySelector = !this.showCategorySelector;
  }
  
  // Kategori seçici dışında bir yere tıklandığında kapat
  closeCategorySelector(event: Event) {
    if (!(event.target as HTMLElement).closest('.category-selector-container')) {
      this.showCategorySelector = false;
    }
  }
  
  // Kategori ağacını ilk açılışta oluştur
  initializeCategoryTree() {
    // Ana kategorileri genişlet
    this.mainCategories.forEach(category => {
      this.expandedCategories.set(category.id, true);
    });
  }
}