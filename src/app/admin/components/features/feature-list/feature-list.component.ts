import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Feature } from 'src/app/contracts/feature/feature';
import { FeatureFilterByDynamic } from 'src/app/contracts/feature/featureFilterByDynamic';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { DeleteDialogComponent, DeleteDialogState } from 'src/app/dialogs/delete-dialog/delete-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-feature-list',
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
  templateUrl: './feature-list.component.html',
  styleUrls: ['./feature-list.component.scss', '../../../../../styles.scss']
})
export class FeatureListComponent extends BaseComponent implements OnInit {

  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listFeature: GetListResponse<Feature> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  pagedFeatures: Feature[] = [];
  selectedFeatures: Feature[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  pageList: number[] = [];
  displayedColumns: string[] = ['No', 'Feature', 'Update','Delete'];
  searchForm: FormGroup;

  constructor(
    spinner: SpinnerService,
    private featureService: FeatureService,
    private toastrService: CustomToastrService,
    private dialogService: DialogService,
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
        this.searchFeature();
      } else if (value.length === 0) {
        this.getFeatures();
      }
    });
  }

  async ngOnInit() {
    await this.getFeatures();
  }

  async getFeatures() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const data: GetListResponse<Feature> = await this.featureService.list(
      this.pageRequest,
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      }
    );

    this.listFeature = data;
    this.pagedFeatures = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);

    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getFeatures();
  }

  async searchFeature() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formValue = this.searchForm.value;
    let filters: Filter[] = [];

    const name = FeatureFilterByDynamic.Name;

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
  
    await this.featureService.getFeaturesByDynamicQuery(dynamicQuery, pageRequest).then((response) => {
      this.pagedFeatures = response.items;
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
