import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
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

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, 
    ReactiveFormsModule, 
    MatPaginatorModule, 
    MatTableModule, 
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    DeleteDirectiveComponent,],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss', '../../../../../styles.scss']
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
  displayedColumns: string[] = ['No', 'Image', 'Feature', 'Product', 'CategoryName', 'VariantID' ,'Update','Delete'];
  searchForm: FormGroup;
  private searchCache: Product[] = []; // Arama sonuçları önbelleği
  private currentSearchTerm: string = ''; // Mevcut arama terimi

  constructor(
    spinner: SpinnerService,
    private productService: ProductService,
    private toastrService: CustomToastrService,
    private dialogService: DialogService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder
  ) {
    super(spinner);

    this.searchForm = this.fb.group({
      nameSearch: [''],
      varyantGroupIdSearch: [''],
      featureValueNameSearch: [''],
    });

    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchProduct(value);
      } else if (value.length === 0) {
        this.getProducts();
        this.searchCache = []; // Önbelleği temizle
        this.currentSearchTerm = '';
      }
    });
  }

  async ngOnInit() {
    await this.getProducts();
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

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getProducts();
  }

  async searchProduct(searchTerm: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    // Eğer mevcut arama terimi, yeni arama teriminin başında yer alıyorsa (örn. "Kahverengi" -> "Kahverengi ar")
    if (searchTerm.startsWith(this.currentSearchTerm) && this.searchCache.length > 0) {
      // İstemci tarafında filtreleme yap
      this.pagedProducts = this.searchCache.filter(product => 
        this.productMatchesSearchTerm(product, searchTerm)
      );
      this.count = this.pagedProducts.length;
      this.pages = Math.ceil(this.count / this.pageSize);
      this.currentPageNo = 1;
    } else {
      // Sunucuya yeni bir istek at
      const filters: Filter[] = this.buildFilters(searchTerm);
  
      const dynamicQuery: DynamicQuery = {
        sort: [{ field: 'Name', dir: 'asc' }], // 'Name' alanını güncellediğinizden emin olun
        filter: filters.length > 0 ? {
          logic: 'and',
          filters: filters
        } : undefined
      };
  
      const pageRequest: PageRequest = { pageIndex: 0, pageSize: this.pageSize };
  
      await this.productService.getProductsByDynamicQuery(dynamicQuery, pageRequest).then((response) => {
        this.pagedProducts = response.items;
        this.count = response.count;
        this.pages = response.pages;
        this.currentPageNo = 1;
  
        // Önbelleği güncelle
        this.searchCache = response.items;
        this.currentSearchTerm = searchTerm;
      }).catch((error) => {
        this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      }).finally(() => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      });
    }
  }
  

  private buildFilters(searchTerm: string): Filter[] {
    const terms = searchTerm.split(' ').filter(term => term.length > 0);
  
    const name = ProductFilterByDynamic.Name;
    const varyantGroupId = ProductFilterByDynamic.VaryantGroupID;
    const description = ProductFilterByDynamic.Description;
    const title = ProductFilterByDynamic.Title;
    const filters: Filter[] = terms.map(term => ({
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
  
    return filters;
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
      this.getProducts();
    }
  }
  
}