import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Brand } from 'src/app/contracts/brand/brand';
import { BrandFilterByDynamic } from 'src/app/contracts/brand/brandFilterByDynamic';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatPaginatorModule, MatTableModule, FormsModule, ReactiveFormsModule],
  templateUrl: './brand-list.component.html',
  styleUrl: './brand-list.component.scss'
})
export class BrandListComponent extends BaseComponent implements OnInit {

  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listBrand: GetListResponse<Brand> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  pagedBrands: Brand[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  pageList: number[] = [];
  displayedColumns: string[] = ['No', 'Marka'];
  searchForm: FormGroup;

  constructor(
    spinner: NgxSpinnerService,
    private brandService: BrandService,
    private toastrService: CustomToastrService,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder
  ) {
    super(spinner);

    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

    // Form control value changes subscription
    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchBrand();
      } else if (value.length === 0) {
        this.getBrands();
      }
    });
  }

  async ngOnInit() {
    await this.getBrands();
  }

  async getBrands() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const data: GetListResponse<Brand> = await this.brandService.list(
      this.pageRequest,
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      }
    );

    this.listBrand = data;
    this.pagedBrands = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);

    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.getBrands();
  }

  async searchBrand() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formValue = this.searchForm.value;
    let filters: Filter[] = [];

    const name = BrandFilterByDynamic.Name;

    if (formValue.nameSearch) {
      const nameFilter: Filter = {
        field: name,
        operator: "startswith",
        value: formValue.nameSearch,
        logic: "",
        filters: [],
      };

      filters.push(nameFilter);
    }

    let dynamicFilter: Filter | undefined;
    if (filters.length > 0) {
      dynamicFilter = filters[0];
    }
    
    const dynamicQuery: DynamicQuery = {
      sort: [{ field: name, dir: "asc" }],
      filter: dynamicFilter
    };

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: this.pageSize };
  
    await this.brandService.getBrandsByDynamicQuery(dynamicQuery, pageRequest).then((response) => {
      this.pagedBrands = response.items;
      this.count = response.count;
      this.pages = response.pages;
      this.currentPageNo = 1;
    }).catch((error) => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }
}
