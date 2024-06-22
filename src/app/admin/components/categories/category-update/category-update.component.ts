import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Category } from 'src/app/contracts/category/category';
import { CategoryUpdate } from 'src/app/contracts/category/category-update';
import { CategoryFilterByDynamic } from 'src/app/contracts/category/categoryFilterByDynamic';
import { Filter, DynamicQuery } from 'src/app/contracts/dynamic-query';
import { Feature } from 'src/app/contracts/feature/feature';
import { PageRequest } from 'src/app/contracts/pageRequest';
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
  filteredParentCategories: Observable<Category[]>;
  parentCategoryIdControl: FormControl;
  pagedCategories: Category[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = -1;
  pageIndex: number = -1;
  count: number = 0;
  pages: number = 0;
  searchForm: FormGroup;

  constructor(
    spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private featureService: FeatureService,
    private route: ActivatedRoute,
    private toastrService: CustomToastrService
  ) {
    super(spinner);

    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

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

    this.filteredParentCategories = this.categoryForm.get('parentCategoryId').valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.name),
      map(name => name ? this._filterCategories(name) : this.categories.slice())
    );

    this.parentCategoryIdControl = this.categoryForm.get('parentCategoryId') as FormControl;
  }

  private _filterCategories(name: string): Category[] {
    const filterValue = name.toLowerCase();
    return this.categories.filter(category => category.name.toLowerCase().includes(filterValue));
  }
  
  selectParentCategory(category: Category) {
    this.categoryForm.patchValue({ parentCategoryId: category.id });
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
      this.categories = this.createHierarchy(data.items);
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
      if (category.subCategories && category.subCategories.length > 0) {
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

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  
    await this.categoryService.getCategoriesByDynamicQuery(dynamicQuery, pageRequest).then((response) => {
      this.pagedCategories = response.items;
      this.count = response.count;
      this.pages = response.pages;
      this.currentPageNo = 1;
      this.dataSource.data = this.pagedCategories;
    }).catch((error) => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }

  createHierarchy(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];
  
    // Tüm kategorileri bir Map'e ekleyin
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, subCategories: [] });
    });
  
    // Kategorileri hiyerarşik yapıya yerleştirin
    categoryMap.forEach(category => {
      if (category.parentCategoryId) {
        const parent = categoryMap.get(category.parentCategoryId);
        if (parent) {
          parent.subCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });
  
    return rootCategories;
  }

}