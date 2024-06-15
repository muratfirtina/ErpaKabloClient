import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FeaturecreateconfrimDialogComponent } from 'src/app/dialogs/featureDialogs/featurecreateconfrim-dialog/featurecreateconfrim-dialog.component';
import { AlertifyService, MessageType, Position } from 'src/app/services/admin/alertify.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeatureCreate } from 'src/app/contracts/feature/feature-create';
import { MatSelectModule } from '@angular/material/select';
import { Category } from 'src/app/contracts/category/category';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-feature-create',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatListModule,
    MatCheckboxModule
  ],
  templateUrl: './feature-create.component.html',
  styleUrls: ['./feature-create.component.scss']
})
export class FeatureCreateComponent extends BaseComponent implements OnInit {
  featureForm: FormGroup;
  categories: Category[] = [];
  filteredCategories: Observable<Category[]>;
  categoryFilterCtrl: FormControl = new FormControl();

  constructor(
    spinner: NgxSpinnerService,
    private featureService: FeatureService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private categoryService: CategoryService,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.featureForm = this.fb.group({
      name: ['', Validators.required],
      categoryIds: [[], Validators.required]
    });

    this.loadCategories();

    // Set up category filter
    this.filteredCategories = this.categoryFilterCtrl.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? this.filterCategories(value) : this.categories)
    );
  }

  loadCategories() {
    this.categoryService.list({ pageIndex: -1, pageSize: -1 }).then(data => {
      this.categories = data.items;
      this.categoryFilterCtrl.setValue('');
    }).catch(error => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    });
  }

  filterCategories(value: string): Category[] {
    const filterValue = value.toLowerCase();
    return this.categories.filter(category => category.name.toLowerCase().includes(filterValue));
  }

  onSubmit() {
    if (this.featureForm.valid) {
      this.openDialog(this.featureForm.value);
    }
  }

  openDialog(formValue: any): void {
    const dialogRef = this.dialog.open(FeaturecreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createFeature(formValue);
      }
    });
  }

  createFeature(formValue: any) {
    const create_feature: FeatureCreate = {
      name: formValue.name,
      categoryIds: formValue.categoryIds ? formValue.categoryIds : [],
    };

    this.featureService.create(create_feature, () => {
      this.toastrService.message('Feature created successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
    }, (error) => {
      this.toastrService.message(error, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    });
  }

  toggleAll(state: boolean) {
    this.categories.forEach(category => this.toggleCategory(category, state));
    this.updateCategoryIds();
  }

  toggleCategory(category: Category, state: boolean) {
    category.checked = state;
    if (category.subCategories) {
      category.subCategories.forEach(child => this.toggleCategory(child, state));
    }
    this.updateCategoryIds();
  }

  expandAll() {
    this.categories.forEach(category => this.expandCategory(category, true));
  }

  collapseAll() {
    this.categories.forEach(category => this.expandCategory(category, false));
  }

  expandCategory(category: Category, state: boolean) {
    category.expanded = state;
    if (category.subCategories) {
      category.subCategories.forEach(child => this.expandCategory(child, state));
    }
  }

  updateCategoryIds() {
    const selectedCategoryIds = this.collectSelectedCategoryIds(this.categories);
    this.featureForm.patchValue({ categoryIds: selectedCategoryIds });
  }

  collectSelectedCategoryIds(categories: Category[]): string[] {
    let selectedIds: string[] = [];
    categories.forEach(category => {
      if (category.checked) {
        selectedIds.push(category.id);
      }
      if (category.subCategories) {
        selectedIds = selectedIds.concat(this.collectSelectedCategoryIds(category.subCategories));
      }
    });
    return selectedIds;
  }
}
