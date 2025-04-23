import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Product } from 'src/app/contracts/product/product';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { ProductService } from 'src/app/services/common/models/product.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { ProductFilterByDynamic } from 'src/app/contracts/product/productFilterByDynamic';
import { RouterModule } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    ReactiveFormsModule,
    DeleteDirectiveComponent
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent extends BaseComponent implements OnInit {
  // List variables
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listProduct: GetListResponse<Product> = { 
    index: 0, size: 0, count: 0, pages: 0, 
    hasPrevious: false, hasNext: false, items: [] 
  };
  pagedProducts: Product[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  searchForm: FormGroup;
  
  private searchCache: Product[] = []; // Search results cache
  private currentSearchTerm: string = ''; // Current search term

  constructor(
    spinner: SpinnerService,
    private productService: ProductService,
    private toastrService: CustomToastrService,
    private fb: FormBuilder
  ) {
    super(spinner);

    // Initialize search form
    this.searchForm = this.fb.group({
      nameSearch: ['']
    });

    // Setup debounce search
    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchProduct(value);
      } else if (value.length === 0) {
        this.getProducts();
        this.searchCache = []; // Clear cache
        this.currentSearchTerm = '';
      }
    });
  }

  async ngOnInit() {
    await this.getProducts();
  }

  // Product list methods
  async getProducts() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    // Important: Add a random query parameter to bypass cache
    const timestamp = new Date().getTime();
    const pageRequest = { 
      pageIndex: this.currentPageNo - 1, 
      pageSize: this.pageSize,
      timestamp: timestamp // This forces a new request each time
    };
  
    try {
      const data: GetListResponse<Product> = await this.productService.list(
        pageRequest as PageRequest,
        () => {},
        (error) => {
          this.toastrService.message(error, 'Error', { 
            toastrMessageType: ToastrMessageType.Error, 
            position: ToastrPosition.TopRight 
          });
        }
      );
  
      this.listProduct = data;
      this.pagedProducts = data.items;
      this.count = data.count;
      this.pages = Math.ceil(this.count / this.pageSize);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  onPageChange(page: number) {
    this.currentPageNo = page;
    this.pageRequest.pageIndex = page - 1;
    
    // If we're searching, use the search method with the current term
    if (this.currentSearchTerm.length >= 3) {
      this.searchProduct(this.currentSearchTerm);
    } else {
      this.getProducts();
    }
  }

  async searchProduct(searchTerm: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.currentSearchTerm = searchTerm;
  
    // If the current search term starts with the previous one and we have cached results
    if (searchTerm.startsWith(this.currentSearchTerm) && this.searchCache.length > 0) {
      // Filter on client side
      this.pagedProducts = this.searchCache.filter(product => 
        this.productMatchesSearchTerm(product, searchTerm)
      );
      this.count = this.pagedProducts.length;
      this.pages = Math.ceil(this.count / this.pageSize);
      this.currentPageNo = 1;
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    } else {
      // Send a new request to server
      const filters: Filter[] = this.buildFilters(searchTerm);
  
      const dynamicQuery: DynamicQuery = {
        sort: [{ field: 'Name', dir: 'asc' }],
        filter: filters.length > 0 ? {
          logic: 'and',
          filters: filters
        } : undefined
      };
  
      // Add timestamp to avoid caching
      const pageRequest: PageRequest = { 
        pageIndex: this.currentPageNo - 1, 
        pageSize: this.pageSize,
      };
  
      try {
        const response = await this.productService.getProductsByDynamicQuery(dynamicQuery, pageRequest);
        this.pagedProducts = response.items;
        this.count = response.count;
        this.pages = response.pages;
        
        // Update cache
        this.searchCache = response.items;
        this.currentSearchTerm = searchTerm;
      } catch (error) {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      } finally {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      }
    }
  }

  private buildFilters(searchTerm: string): Filter[] {
    const name = ProductFilterByDynamic.Name;
    const varyantGroupId = ProductFilterByDynamic.VaryantGroupID;
    const description = ProductFilterByDynamic.Description;
    const title = ProductFilterByDynamic.Title;
    
    const filter: Filter = {
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
    };
  
    return [filter];
  }

  private productMatchesSearchTerm(product: Product, searchTerm: string): boolean {
    const term = searchTerm.toLowerCase();
    const name = product.name?.toLowerCase() || '';
    const variantGroupId = product.varyantGroupID?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    const title = product.title?.toLowerCase() || '';
  
    return name.includes(term) || 
           variantGroupId.includes(term) || 
           description.includes(term) || 
           title.includes(term);
  }
  
  removeProductFromList(productId: string) {
    this.pagedProducts = this.pagedProducts.filter(product => product.id !== productId);
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    // If last item on page was deleted and there are other pages, go to previous page
    if (this.pagedProducts.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.getProducts();
    }
  }
}