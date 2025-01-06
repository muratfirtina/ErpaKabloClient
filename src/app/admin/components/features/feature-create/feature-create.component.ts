import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from 'src/app/base/base/base.component';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, FormArray } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FeaturecreateconfrimDialogComponent } from 'src/app/dialogs/featureDialogs/featurecreateconfrim-dialog/featurecreateconfrim-dialog.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeatureCreate } from 'src/app/contracts/feature/feature-create';
import { FeaturevalueCreate } from 'src/app/contracts/featurevalue/featurevalue-create';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { SelectionModel } from '@angular/cdk/collections';
import { Category } from 'src/app/contracts/category/category';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';

interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  id: string;
  parentCategoryId: string;
  checked?: boolean;
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
    MatChipsModule,
    MatFormField,
    MatLabel
  ],
  templateUrl: './feature-create.component.html',
  styleUrls: ['./feature-create.component.scss','../../../../../styles.scss']
})
export class FeatureCreateComponent extends BaseComponent implements OnInit {
  featureForm: FormGroup;
  categories: Category[] = [];
  filteredCategories: Observable<Category[]>;
  categoryFilterCtrl: FormControl = new FormControl();
  selectedCategories: Category[] = [];
  checklistSelection = new SelectionModel<FlatNode>(true /* multiple */);

  private transformer = (node: Category, level: number) => ({
    expandable: !!node.subCategories && node.subCategories.length > 0,
    name: node.name,
    level: level,
    id: node.id,
    parentCategoryId: node.parentCategoryId,
    checked: node.checked
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
    spinner: SpinnerService,
    private featureService: FeatureService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private categoryService: CategoryService,
    private toastrService: CustomToastrService,
    private featurevalueService: FeaturevalueService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.featureForm = this.fb.group({
      name: ['', Validators.required],
      categoryIds: [[]],
      featureValues: this.fb.array([this.createFeatureValueControl()])
    });

    this.loadCategories();
    this.dataSource.data = [];

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

  get featureValues(): FormArray {
    return this.featureForm.get('featureValues') as FormArray;
  }

  createFeatureValueControl(): FormControl {
    return this.fb.control('');
  }

  addFeatureValueControl() {
    this.featureValues.push(this.createFeatureValueControl());
  }

  removeFeatureValueControl(index: number) {
    if (this.featureValues.length > 1) {
      this.featureValues.removeAt(index);
    }
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

  todoItemSelectionToggle(node: FlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
  
    this.updateCategoryState(node, this.checklistSelection.isSelected(node));
  
    descendants.forEach(child => 
      this.updateCategoryState(child, this.checklistSelection.isSelected(node))
    );
  
    this.checkAllParentsSelection(node);
    this.updateSelectedCategories();
  }
  
  todoLeafItemSelectionToggle(node: FlatNode): void {
    this.checklistSelection.toggle(node);
    this.updateCategoryState(node, this.checklistSelection.isSelected(node));
    this.checkAllParentsSelection(node);
    this.updateSelectedCategories();
  }

  checkAllParentsSelection(node: FlatNode): void {
    let parent: FlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  checkRootNodeSelection(node: FlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  getParentNode(node: FlatNode): FlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  getLevel = (node: FlatNode) => node.level;

  hasChild = (_: number, node: FlatNode) => node.expandable;

  descendantsAllSelected(node: FlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    return descAllSelected;
  }

  descendantsPartiallySelected(node: FlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  restoreCheckedState() {
    this.treeControl.dataNodes.forEach(node => {
      const category = this.findCategoryById(this.categories, node.id);
      if (category && category.checked) {
        this.checklistSelection.select(node);
      }
    });
  }

  updateCategoryState(node: FlatNode, state: boolean) {
    const category = this.findCategoryById(this.categories, node.id);
    if (category) {
      category.checked = state;
      this.updateCategoryIds();
    }
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

  collectSelectedCategories(categories: Category[]): Category[] {
    let selected: Category[] = [];
    categories.forEach(category => {
      if (category.checked) {
        selected.push(category);
        // Alt kategorileri de ekle
        if (category.subCategories) {
          selected = selected.concat(this.collectSelectedCategories(category.subCategories));
        }
      } else if (category.subCategories) {
        // Eğer üst kategori seçili değilse, alt kategorileri kontrol et
        selected = selected.concat(this.collectSelectedCategories(category.subCategories));
      }
    });
    return selected;
  }
  
  updateSelectedCategories() {
    this.selectedCategories = this.collectSelectedCategories(this.categories);
    // Seçilen kategorileri güncelle
    const selectedCategoryIds = this.selectedCategories.map(cat => cat.id);
    this.featureForm.patchValue({ categoryIds: selectedCategoryIds });
  }

  removeCategory(category: Category) {
    this.updateCheckedState(category.id, false);
    this.checklistSelection.deselect(...this.treeControl.dataNodes.filter(node => node.id === category.id));
    this.updateCategoryIds();
    this.updateSelectedCategories();
    this.restoreCheckedState();
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
        this.createFeatureWithFeatureValues(formValue);
      }
    });
  }

  async createFeatureWithFeatureValues(formValue: any) {
    try {
      const featureValues = formValue.featureValues.map(value => ({
        name: value
      }));
  
      const create_feature: FeatureCreate = {
        id: '',
        name: formValue.name,
        categoryIds: formValue.categoryIds ? formValue.categoryIds : [],
        featureValues: featureValues
      };
  
      const createdFeature = await this.featureService.create(create_feature);
  
      // Reset the form
      this.featureForm.reset();
      this.selectedCategories = [];
      this.checklistSelection.clear();
  
      // Recursive olarak tüm kategorilerin checked durumunu sıfırla
      const resetCategoryChecks = (categories: Category[]) => {
        categories.forEach(category => {
          category.checked = false;
          if (category.subCategories && category.subCategories.length > 0) {
            resetCategoryChecks(category.subCategories);
          }
        });
      };
  
      // Ana kategori listesindeki tüm checked durumlarını sıfırla
      resetCategoryChecks(this.categories);
      
      // Tree view'ı güncelle
      this.dataSource.data = [...this.categories];
  
      // Reset the feature values to have one empty control
      while (this.featureValues.length > 0) {
        this.featureValues.removeAt(0);
      }
      this.featureValues.push(this.createFeatureValueControl());
  
      this.toastrService.message('Feature and Feature Values created successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
    } catch (error) {
      this.toastrService.message(error, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
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

  createHierarchy(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, subCategories: [] });
    });

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
