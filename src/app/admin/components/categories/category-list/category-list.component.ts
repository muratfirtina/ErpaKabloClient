import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Category } from 'src/app/contracts/category/category';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { CategoryFilterByDynamic } from 'src/app/contracts/category/categoryFilterByDynamic';
import { Router, RouterModule } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    FormsModule, 
    ReactiveFormsModule, 
    MatPaginatorModule, 
    MatTableModule, 
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    DeleteDirectiveComponent, 
    RouterModule
  ],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss','../../../../../styles.scss']
})
export class CategoryListComponent extends BaseComponent implements OnInit {

  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listCategory: GetListResponse<Category> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  pagedCategories: Category[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  displayedColumns: string[] = ['No', 'Image' ,'Category', 'Update' , 'Delete'];
  searchForm: FormGroup;

  constructor(
    spinner: SpinnerService,
    private categoryService: CategoryService,
    private toastrService: CustomToastrService,
    private fb: FormBuilder,
    private router: Router
  ) {
    super(spinner);

    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchCategory();
      } else if (value.length === 0) {
        this.getCategories();
      }
    });
  }

  async ngOnInit() {
    await this.getCategories();
  }

  async getCategories() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const data: GetListResponse<Category> = await this.categoryService.list(
      this.pageRequest,
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      }
    );

    this.listCategory = data;
    this.pagedCategories = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);

    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getCategories();
  }

  async searchCategory() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formValue = this.searchForm.value;
    let filters: Filter[] = [];

    const name = CategoryFilterByDynamic.Name;

    if (formValue.nameSearch) {
      const nameFilter: Filter = {
        field: name,
        operator: "contains",
        value: formValue.nameSearch,
        logic: "",
        filters: [],
      };

      filters.push(nameFilter);
    }

    let dynamicFilter: Filter | undefined;
    if (filters.length > 0) {
      dynamicFilter = filters.length === 1 ? filters[0] : {
        field: "",
        operator: "",
        logic: "and",
        filters: filters
      };
    }
    
    const dynamicQuery: DynamicQuery = {
      sort: [{ field: name, dir: "asc" }],
      filter: dynamicFilter
    };

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: this.pageSize };
  
    await this.categoryService.getCategoriesByDynamicQuery(dynamicQuery, pageRequest).then((response) => {
      this.pagedCategories = response.items;
      this.count = response.count;
      this.pages = response.pages;
      this.currentPageNo = 1;
    }).catch((error) => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }

  navigateToUpdate(categoryId: string) {
    this.router.navigate(['admin/categories/category-update', categoryId]);
  }
  
}
