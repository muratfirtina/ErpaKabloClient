import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { RouterModule } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { Feature } from 'src/app/contracts/feature/feature';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { FeaturevalueCreate } from 'src/app/contracts/featurevalue/featurevalue-create';
import { FeaturevalueUpdate } from 'src/app/contracts/featurevalue/featurevalue-update';
import { MatDialog } from '@angular/material/dialog';
import { FeaturevaluecreateconfrimDialogComponent } from 'src/app/dialogs/featurevalueDialogs/featurevaluecreateconfrim-dialog/featurevaluecreateconfrim-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-featurevalues',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    ReactiveFormsModule,
    DeleteDirectiveComponent,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './featurevalues.component.html',
  styleUrls: ['./featurevalues.component.scss']
})
export class FeaturevaluesComponent extends BaseComponent implements OnInit {
  // List variables
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listFeaturevalue: GetListResponse<Featurevalue> = { 
    index: 0, size: 0, count: 0, pages: 0, 
    hasPrevious: false, hasNext: false, items: [] 
  };
  pagedFeaturevalues: Featurevalue[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  displayedColumns: string[] = ['No', 'Featurevalue', 'Update', 'Delete'];
  searchForm: FormGroup;

  // Create/update variables
  formMode: 'create' | 'update' = 'create';
  featurevalueForm: FormGroup;
  features: Feature[] = [];
  filteredFeatures: Feature[] = [];
  searchTerm: string = '';
  selectedFeatureValueId: string | null = null;

  constructor(
    spinner: SpinnerService,
    private featurevalueService: FeaturevalueService,
    private featureService: FeatureService,
    private toastrService: CustomToastrService,
    private fb: FormBuilder,
    public dialog: MatDialog
  ) {
    super(spinner);

    // Initialize search form
    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

    // Initialize create/update form
    this.featurevalueForm = this.fb.group({
      name: ['', Validators.required],
      featureId: ['', Validators.required]
    });

    // Setup debounce search
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
    await this.loadFeatures();
  }

  // List methods
  async getFeaturevalues() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    const data: GetListResponse<Featurevalue> = await this.featurevalueService.list(
      { pageIndex: this.currentPageNo - 1, pageSize: this.pageSize },
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
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
  
    await this.featurevalueService.getFeaturevaluesByDynamicQuery(dynamicQuery, pageRequest)
      .then((response) => {
        this.pagedFeaturevalues = response.items;
        this.count = response.count;
        this.pages = response.pages;
        this.currentPageNo = 1;
      })
      .catch((error) => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      })
      .finally(() => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      });
  }
  
  removeFeaturevalueFromList(featurevalueId: string) {
    this.pagedFeaturevalues = this.pagedFeaturevalues.filter(
      featurevalue => featurevalue.id !== featurevalueId
    );
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    // If last item on page was deleted and there are other pages, go to previous page
    if (this.pagedFeaturevalues.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.getFeaturevalues();
    }

    // If currently editing this feature value, reset the form
    if (this.selectedFeatureValueId === featurevalueId) {
      this.resetForm();
    }
  }

  // Create/update methods
  loadFeatures() {
    return this.featureService.list({ pageIndex: -1, pageSize: -1 })
      .then(data => {
        this.features = data.items;
        this.filteredFeatures = [...this.features];
      })
      .catch(error => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      });
  }

  searchFeatures(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = value;
    this.filteredFeatures = this.features.filter(feature => 
      feature.name.toLowerCase().includes(value)
    );
  }

  // Load a feature value for editing
  loadFeaturevalue(featurevalue: Featurevalue) {
    this.formMode = 'update';
    this.selectedFeatureValueId = featurevalue.id;
    
    // Önce özellik değerinin detaylarını API'den alalım
    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.featurevalueService.getById(featurevalue.id)
      .then(data => {
        // Form'u özellik değerinin verileriyle dolduralım
        this.featurevalueForm.patchValue({
          name: data.name,
          featureId: data.featureId
        });
        
        // Özellik ID'sine göre filtrelenen özellikleri güncelleyelim
        // Eğer arama yapılmışsa ve seçili özellik filtrelenmişse, aramayı temizleyelim
        this.searchTerm = '';
        this.filteredFeatures = [...this.features];
      })
      .catch(error => {
        this.toastrService.message('Özellik değeri yüklenirken hata oluştu', 'Hata', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      })
      .finally(() => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        // Scroll to form
        document.getElementById('featurevalue-form')?.scrollIntoView({ behavior: 'smooth' });
      });
  }

  resetForm() {
    this.featurevalueForm.reset();
    this.formMode = 'create';
    this.selectedFeatureValueId = null;
  }

  onSubmit() {
    if (this.featurevalueForm.valid) {
      if (this.formMode === 'create') {
        this.openCreateDialog(
          this.featurevalueForm.value.name, 
          this.featurevalueForm.value.featureId
        );
      } else {
        this.updateFeatureValue(
          this.featurevalueForm.value.name, 
          this.featurevalueForm.value.featureId
        );
      }
    }
  }

  // Create dialog and functionality
  openCreateDialog(name: string, featureId: string): void {
    const dialogRef = this.dialog.open(FeaturevaluecreateconfrimDialogComponent, {
      width: '500px',
      data: { featurevalueName: name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createFeatureValue(name, featureId);
      }
    });
  }

  createFeatureValue(name: string, featureId: string) {
    const create_featurevalue: FeaturevalueCreate = {
      name,
      featureId
    };

    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.featurevalueService.create(create_featurevalue, () => {
      this.toastrService.message('Feature Value Created Successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      this.resetForm();
      this.getFeaturevalues(); // Refresh the list
    }, (errorMessage: string) => {
      this.toastrService.message(errorMessage, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }

  // Update functionality
  updateFeatureValue(name: string, featureId: string) {
    if (!this.selectedFeatureValueId) return;

    const update_featurevalue: FeaturevalueUpdate = {
      id: this.selectedFeatureValueId,
      name,
      featureId
    };

    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.featurevalueService.update(update_featurevalue, () => {
      this.toastrService.message('Feature Value Updated Successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      this.resetForm();
      this.getFeaturevalues(); // Refresh the list
    }, (errorMessage: string) => {
      this.toastrService.message(errorMessage, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }
}