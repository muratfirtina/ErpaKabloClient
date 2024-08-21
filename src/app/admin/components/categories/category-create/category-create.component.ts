import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { CategorycreateconfrimDialogComponent } from 'src/app/dialogs/categoryDialogs/categorycreateconfrim-dialog/categorycreateconfrim-dialog.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { CategoryCreate } from 'src/app/contracts/category/category-create';
import { Category } from 'src/app/contracts/category/category';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { Feature } from 'src/app/contracts/feature/feature';
import { Filter, DynamicQuery } from 'src/app/contracts/dynamic-query';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { FileUploadDialogComponent } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, 
    MatButtonModule, ReactiveFormsModule, MatDialogModule, MatAutocompleteModule, MatCheckboxModule
  ],
  templateUrl: './category-create.component.html',
  styleUrls: ['./category-create.component.scss','../../../../../styles.scss']
})
export class CategoryCreateComponent extends BaseComponent implements OnInit {
  categoryForm: FormGroup;
  parentCategoryIdControl: FormControl = new FormControl('');
  filteredParentCategories: Observable<Category[]>;
  categories: Category[] = [];
  features: Feature[] = [];
  selectedFile: File | null = null;

  constructor(
    spinner: NgxSpinnerService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastrService: CustomToastrService,
    private featureService: FeatureService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      parentCategoryId: [''],
      title: [''],
      featureIds: [[]]
    });

    this.loadFeatures();

    this.filteredParentCategories = this.parentCategoryIdControl.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.name),
      switchMap(name => this.searchCategory(name))
    );
  }

  async loadFeatures() {
    const data = await this.featureService.list({ pageIndex: -1, pageSize: -1 });
    this.features = data.items;
  }

  displayCategoryName(category?: Category): string | undefined {
    return category ? category.name : undefined;
  }

  async searchCategory(name: string): Promise<Category[]> {
    if (!name || name.length < 3) {
      return [];
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);

    const filters: Filter[] = [{
      field: 'name', // Assuming CategoryFilterByDynamic.Name is 'name'
      operator: "contains",
      value: name,
      logic: "",
      filters: [],
    }];

    const dynamicFilter: Filter = {
      field: "",
      operator: "",
      logic: "and",
      filters: filters
    };

    const dynamicQuery: DynamicQuery = {
      sort: [{ field: 'name', dir: "asc" }],
      filter: dynamicFilter
    };

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };

    try {
      const response = await this.categoryService.getCategoriesByDynamicQuery(dynamicQuery, pageRequest);
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      return response.items;
    } catch (error) {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      return [];
    }
  }

  selectParentCategory(category: Category) {
    this.categoryForm.patchValue({ parentCategoryId: category.id });
    this.parentCategoryIdControl.setValue(category.name);
  }

  onFeatureToggle(featureId: string, checked: boolean) {
    let selectedFeatures = this.categoryForm.value.featureIds || [];
    if (checked) {
      selectedFeatures.push(featureId);
    } else {
      selectedFeatures = selectedFeatures.filter(id => id !== featureId);
    }
    this.categoryForm.patchValue({ featureIds: selectedFeatures });
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.openDialog(this.categoryForm.value);
    }
  }

  openDialog(formValue: any): void {
    const dialogRef = this.dialog.open(CategorycreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createCategory(formValue);
      }
    });
  }

  openFileUploadDialog(): void {
    const dialogRef = this.dialog.open(FileUploadDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.length > 0) {
        this.selectedFile = result[0];
      }
    });
  }

  createCategory(formValue: any) {
    const formData = new FormData();
    formData.append('name', formValue.name);
    formData.append('title', formValue.title);
    if (formValue.parentCategoryId) {
      formData.append('parentCategoryId', formValue.parentCategoryId);
    }
    if (formValue.featureIds && formValue.featureIds.length > 0) {
      formValue.featureIds.forEach((featureId: string, index: number) => {
        formData.append(`featureIds[${index}]`, featureId);
      });
    }
    if (this.selectedFile) {
      formData.append('CategoryImage', this.selectedFile, this.selectedFile.name);
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.categoryService.create(formData, () => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.toastrService.message('Category created successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
    }, (error) => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.toastrService.message(error, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    });
  }
}
