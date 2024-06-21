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

interface CategoryNode {
  name: string;
  id: string;
  checked?: boolean;
  expanded?: boolean;
  children?: CategoryNode[];
}

interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  id: string;
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
    MatChipsModule
  ],
  templateUrl: './feature-create.component.html',
  styleUrls: ['./feature-create.component.scss']
})
export class FeatureCreateComponent extends BaseComponent implements OnInit {
  featureForm: FormGroup;
  categories: CategoryNode[] = [];
  filteredCategories: Observable<CategoryNode[]>;
  categoryFilterCtrl: FormControl = new FormControl();
  selectedCategories: CategoryNode[] = [];

  private transformer = (node: CategoryNode, level: number) => ({
    expandable: !!node.children,
    name: node.name,
    level: level,
    id: node.id,
    checked: node.checked,
  });

  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this.transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
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
  }

  loadCategories() {
    this.categoryService.list({ pageIndex: -1, pageSize: -1 }).then(data => {
      this.categories = data.items.map(item => this.transformCategory(item));
      this.dataSource.data = this.categories;
      this.categoryFilterCtrl.setValue('');
    }).catch(error => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    });
  }

  transformCategory(category: any): CategoryNode {
    return {
      name: category.name,
      id: category.id,
      children: category.subCategories ? category.subCategories.map(sub => this.transformCategory(sub)) : [],
      checked: false,
      expanded: false
    };
  }

  filterCategories(value: string): CategoryNode[] {
    const filterValue = value.toLowerCase();
    const matchedCategories: CategoryNode[] = [];

    for (const category of this.categories) {
      const matched = this.filterCategory(category, filterValue);
      matchedCategories.push(...matched);
    }
    return matchedCategories;
  }

  filterCategory(category: CategoryNode, filterValue: string): CategoryNode[] {
    const matchedCategories: CategoryNode[] = [];
    const match = category.name.toLowerCase().includes(filterValue);

    if (match) {
      category.expanded = false;
      matchedCategories.push(category);
    } else if (category.children) {
      category.expanded = false;
      const subMatchedCategories = category.children.flatMap(subCategory => this.filterCategory(subCategory, filterValue)).filter(c => c !== undefined);
      matchedCategories.push(...subMatchedCategories);
    }

    return matchedCategories;
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
    this.treeControl.dataNodes.forEach(node => this.toggleCategory(node, state));
    this.updateCategoryIds();
  }

  toggleCategory(category: CategoryNode, state: boolean) {
    category.checked = state;
    if (category.children) {
      category.children.forEach(child => this.toggleCategory(child, state));
    }
    this.updateCategoryIds();
  }

  expandAll() {
    this.treeControl.dataNodes.forEach(node => this.treeControl.expand(node));
  }

  collapseAll() {
    this.treeControl.dataNodes.forEach(node => this.treeControl.collapse(node));
  }

  expandCategory(category: CategoryNode, state: boolean) {
    category.expanded = state;
    if (category.children) {
      category.children.forEach(child => this.expandCategory(child, state));
    }
  }

  updateCategoryIds() {
    const selectedCategoryIds = this.collectSelectedCategoryIds(this.categories);
    this.featureForm.patchValue({ categoryIds: selectedCategoryIds });
    this.updateSelectedCategories();
  }

  collectSelectedCategoryIds(categories: CategoryNode[]): string[] {
    let selectedIds: string[] = [];
    this.treeControl.dataNodes.forEach(category => {
      if (category.checked) {
        selectedIds.push(category.id);
      }
      
    });
    return selectedIds;
  }

  updateSelectedCategories() {
    this.selectedCategories = this.collectSelectedCategories(this.categories);
  }

  collectSelectedCategories(categories: CategoryNode[]): CategoryNode[] {
    let selected: CategoryNode[] = [];
    this.treeControl.dataNodes.forEach(category => {
      if (category.checked) {
        selected.push(category);
      }
      
    });
    return selected;
  }

  removeCategory(category: CategoryNode) {
    category.checked = false;
    if (category.children) {
      category.children.forEach(subCategory => this.toggleCategory(subCategory, false));
    }
    this.updateCategoryIds();
  }

  hasChild = (_: number, node: FlatNode) => node.expandable;
}
