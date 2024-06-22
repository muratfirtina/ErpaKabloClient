import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FeaturecreateconfrimDialogComponent } from 'src/app/dialogs/featureDialogs/featurecreateconfrim-dialog/featurecreateconfrim-dialog.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeatureCreate } from 'src/app/contracts/feature/feature-create';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { Category } from 'src/app/contracts/category/category';

interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  id: string;
  checked?: boolean;
  parentCategoryId: string;
}

@Component({
  selector: 'app-feature-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatListModule,
    MatCheckboxModule,
    MatIconModule,
    MatTreeModule,
    MatChipsModule
  ],
  templateUrl: './feature-create.component.html',
  styleUrls: ['./feature-create.component.scss']
})
export class FeatureCreateComponent extends BaseComponent implements OnInit {
  featureForm: FormGroup;
  categories: Category[] = [];
  filteredCategories: Observable<Category[]>;
  categoryFilterCtrl: FormControl = new FormControl();
  selectedCategories: Category[] = [];

  private transformer = (node: Category, level: number) => ({
    expandable: !!node.subCategories && node.subCategories.length > 0,
    name: node.name,
    level: level,
    id: node.id,
    checked: node.checked,
    parentCategoryId: node.parentCategoryId
  });

  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this.transformer,
    node => node.level,
    node => node.expandable,
    node => node.subCategories
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

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

    this.filteredCategories = this.categoryFilterCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCategories(value))
    );

    this.categoryFilterCtrl.valueChanges.subscribe(value => {
      const filteredCategories = this.filterCategories(value);
      this.dataSource.data = this.buildTreeFromFlatList(filteredCategories);
      this.restoreCheckedState();
    });
  }

  private buildTreeFromFlatList(flatList: Category[]): Category[] {
    const map = new Map<string, Category>();
    const tree: Category[] = [];

    flatList.forEach(item => {
      map.set(item.id, { ...item, subCategories: [] });
    });

    flatList.forEach(item => {
      if (item.parentCategoryId) {
        const parent = map.get(item.parentCategoryId);
        if (parent) {
          parent.subCategories.push(map.get(item.id));
        } else {
          tree.push(map.get(item.id));
        }
      } else {
        tree.push(map.get(item.id));
      }
    });

    return tree;
  }

  loadCategories() {
    this.categoryService.list({ pageIndex: -1, pageSize: -1 }).then(data => {
      this.categories = this.createHierarchy(data.items);
      this.dataSource.data = this.categories.filter(category => !category.parentCategoryId);
      this.categoryFilterCtrl.setValue('');
      this.restoreCheckedState();
    }).catch(error => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    });
  }

  filterCategories(value: string): Category[] {
    const filterValue = value.toLowerCase();
    return this.flattenCategories(this.categories).filter(category =>
      category.name.toLowerCase().includes(filterValue)
    );
  }

  private flattenCategories(categories: Category[]): Category[] {
    let flattened: Category[] = [];
    categories.forEach(category => {
      flattened.push(category);
      if (category.subCategories) {
        flattened = flattened.concat(this.flattenCategories(category.subCategories));
      }
    });
    return flattened;
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

  restoreCheckedState() {
    this.treeControl.dataNodes.forEach(node => {
      const category = this.findCategoryById(this.categories, node.id);
      if (category) {
        node.checked = category.checked;
      }
    });
  }

  toggleAll(state: boolean) {
    this.treeControl.dataNodes.forEach(node => this.toggleCategory(node, state));
    this.updateCategoryIds();
  }

  expandAll() {
    this.treeControl.dataNodes.forEach(node => this.treeControl.expand(node));
  }

  collapseAll() {
    this.treeControl.dataNodes.forEach(node => this.treeControl.collapse(node));
  }

  updateCategoryIds() {
    const selectedCategoryIds = this.collectSelectedCategoryIds(this.categories);
    this.featureForm.patchValue({ categoryIds: selectedCategoryIds });
    this.updateSelectedCategories();
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

  updateSelectedCategories() {
    this.selectedCategories = this.collectSelectedCategories(this.categories);
  }

  collectSelectedCategories(categories: Category[]): Category[] {
    let selected: Category[] = [];
    categories.forEach(category => {
      if (category.checked) {
        selected.push(category);
      }
      if (category.subCategories) {
        selected = selected.concat(this.collectSelectedCategories(category.subCategories));
      }
    });
    return selected;
  }

  removeCategory(category: Category) {
    this.updateCheckedState(category.id, false);
    this.updateCategoryIds();
    this.restoreCheckedState();
  }

  onSubmit(event: Event) {
    event.preventDefault(); // Formun otomatik submit olmasını engeller
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

  hasChild = (_: number, node: FlatNode) => node.expandable;

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
