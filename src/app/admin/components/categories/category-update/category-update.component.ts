import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckbox, MatCheckboxModule} from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOption, MatOptionModule } from '@angular/material/core';
import { MatError, MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTreeFlattener, MatTreeFlatDataSource, MatTreeModule } from '@angular/material/tree';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, map, startWith } from 'rxjs';
import { BaseComponent } from 'src/app/base/base/base.component';
import { Category } from 'src/app/contracts/category/category';
import { CategoryUpdate } from 'src/app/contracts/category/category-update';
import { Feature } from 'src/app/contracts/feature/feature';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  id: string;
  checked?: boolean;
  parentCategoryId: string;
}

@Component({
  selector: 'app-category-update',
  standalone: true,
  imports: [CommonModule ,ReactiveFormsModule,FormsModule,MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule],
  templateUrl: './category-update.component.html',
  styleUrl: './category-update.component.scss'
})
export class CategoryUpdateComponent extends BaseComponent implements OnInit {

  categoryForm: FormGroup;
  categoryId: string;
  categories: Category[] = [];
  features: Feature[] = [];
  filteredCategories: Observable<Category[]>;
  treeControl: FlatTreeControl<FlatNode>;
  treeFlattener: MatTreeFlattener<Category, FlatNode>;
  dataSource: MatTreeFlatDataSource<Category, FlatNode>;

  constructor(
    spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private featureService: FeatureService,
    private route: ActivatedRoute,
    private toastrService: CustomToastrService
  ) {
    super(spinner);

    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      node => node.level,
      node => node.expandable,
      node => node.subCategories
    );

    this.treeControl = new FlatTreeControl<FlatNode>(
      node => node.level,
      node => node.expandable
    );

    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  transformer = (node: Category, level: number) => ({
    expandable: !!node.subCategories && node.subCategories.length > 0,
    name: node.name,
    level: level,
    id: node.id,
    checked: node.checked,
    parentCategoryId: node.parentCategoryId
  });

  ngOnInit() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      parentCategoryId: [''],
      subCategories: [[]],
      features: [[]]
    });

    this.categoryId = this.route.snapshot.paramMap.get('id')!;
    this.loadCategoryDetails();
    this.loadCategories();
    this.loadFeatures();
  }

  loadCategoryDetails() {
    this.categoryService.getById(this.categoryId).then(category => {
      this.categoryForm.patchValue({
        name: category.name,
        parentCategoryId: category.parentCategoryId,
        subCategories: category.subCategories.map(sub => sub.id),
        features: category.features.map(feat => feat.id)
      });
    });
  }

  loadCategories() {
    this.categoryService.list({ pageIndex: -1, pageSize: -1 }).then(data => {
      this.categories = data.items;
      this.dataSource.data = this.categories;
    });
  }

  loadFeatures() {
    this.featureService.list({ pageIndex: -1, pageSize: -1 }).then(data => {
      this.features = data.items;
    });
  }

  displayFn(category: Category): string {
    return category && category.name ? category.name : '';
  }

  hasChild = (_: number, node: FlatNode) => node.expandable;

  onSubmit() {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const updateCategory: CategoryUpdate = {
        id: this.categoryId,
        name: formValue.name,
        parentCategoryId: formValue.parentCategoryId,
        subCategories: formValue.subCategories.map(id => this.categories.find(cat => cat.id === id)),
        featurIds: formValue.features
      };
      
      this.categoryService.update(updateCategory).then(() => {
        this.toastrService.message('Category updated successfully', 'Success', { toastrMessageType: ToastrMessageType.Success, position: ToastrPosition.TopRight });
      }).catch(error => {
        this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      });
    }
  }

  toggleCategory(node: FlatNode, state: boolean) {
    node.checked = state;
    this.updateCheckedState(node.id, state);
    this.updateCategoryIds();
  }

  updateCheckedState(id: string, state: boolean) {
    const category = this.findCategoryById(this.categories, id);
    if (category) {
      category.checked = state;
      if (category.subCategories) {
        category.subCategories.forEach(subCategory => this.updateCheckedState(subCategory.id, state));
      }
    }
  }

  findCategoryById(categories: Category[], id: string): Category | undefined {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.subCategories) {
        const subCategory = this.findCategoryById(category.subCategories, id);
        if (subCategory) {
          return subCategory;
        }
      }
    }
    return undefined;
  }

  updateCategoryIds() {
    const selectedCategoryIds = this.collectSelectedCategoryIds(this.categories);
    this.categoryForm.patchValue({ subCategories: selectedCategoryIds });
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

  onFeatureToggle(featureId: string, checked: boolean) {
    let selectedFeatures = this.categoryForm.value.features || [];
    if (checked) {
      selectedFeatures.push(featureId);
    } else {
      selectedFeatures = selectedFeatures.filter(id => id !== featureId);
    }
    this.categoryForm.patchValue({ features: selectedFeatures });
  }
}