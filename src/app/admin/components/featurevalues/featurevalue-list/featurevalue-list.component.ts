import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Featurevalue } from 'src/app/contracts/featurevalue/featurevalue';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { FeaturevalueFilterByDynamic } from 'src/app/contracts/featurevalue/featurevalueFilterByDynamic';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-featurevalue-list',
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
  templateUrl: './featurevalue-list.component.html',
  styleUrls: ['./featurevalue-list.component.scss', '../../../../../styles.scss']
})
export class FeaturevalueListComponent extends BaseComponent implements OnInit {

  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listFeaturevalue: GetListResponse<Featurevalue> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  pagedFeaturevalues: Featurevalue[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  displayedColumns: string[] = ['No', 'Featurevalue', 'Update', 'Delete'];
  searchForm: FormGroup;

  constructor(
    spinner: SpinnerService,
    private featurevalueService: FeaturevalueService,
    private toastrService: CustomToastrService,
    private fb: FormBuilder
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
        this.searchFeaturevalue();
      } else if (value.length === 0) {
        this.getFeaturevalues();
      }
    });
  }

  async ngOnInit() {
    await this.getFeaturevalues();
  }

  async getFeaturevalues() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    const data: GetListResponse<Featurevalue> = await this.featurevalueService.list(
      { pageIndex: this.currentPageNo - 1, pageSize: this.pageSize },
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      }
    );
  
    this.listFeaturevalue = data;
    this.pagedFeaturevalues = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getFeaturevalues();
  }

  async searchFeaturevalue() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formValue = this.searchForm.value;
    let filters: Filter[] = [];

    const name = FeaturevalueFilterByDynamic.Name;

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
  
    await this.featurevalueService.getFeaturevaluesByDynamicQuery(dynamicQuery, pageRequest).then((response) => {
      this.pagedFeaturevalues = response.items;
      this.count = response.count;
      this.pages = response.pages;
      this.currentPageNo = 1;
    }).catch((error) => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }
  
  removeFeaturevalueFromList(featurevalueId: string) {
    this.pagedFeaturevalues = this.pagedFeaturevalues.filter(featurevalue => featurevalue.id !== featurevalueId);
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    // Eğer sayfadaki son ürün silindiyse ve başka sayfalar varsa, önceki sayfaya git
    if (this.pagedFeaturevalues.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.getFeaturevalues();
    }
  }
  
}
