import { FlatTreeControl } from "@angular/cdk/tree";
import { CommonModule } from "@angular/common";
import { Component, OnChanges, Input, Output, EventEmitter, SimpleChanges } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatTreeModule, MatTreeFlattener, MatTreeFlatDataSource } from "@angular/material/tree";
import { FilterGroup, FilterType } from "src/app/contracts/product/filter/filters";
import { Router, ActivatedRoute } from "@angular/router";

interface CategoryNode {
  id: string;
  name: string;
  parentId: string;
  children: CategoryNode[];
  checked: boolean;
  expanded: boolean;
}


@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,MatTreeModule, MatIconModule, MatCheckboxModule, MatButtonModule],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnChanges {
  @Input() availableFilters: FilterGroup[] = [];
  @Input() selectedFilters: { [key: string]: string[] } = {};
  @Output() filterChange = new EventEmitter<{ [key: string]: string[] }>();

  FilterType = FilterType;
  filterForm: FormGroup;
  categoryTree: CategoryNode[] = [];
  customPriceRange: { min: string, max: string } = { min: '', max: '' };

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({});
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['availableFilters'] || changes['selectedFilters']) {
      this.initializeFilters();
      this.buildCategoryTree();
    }
  }

  initializeFilters() {
    this.filterForm = this.fb.group({});
    this.availableFilters.forEach(filter => {
      if (filter.key === 'Category') {
        // Category will be handled separately
        return;
      }
      if (filter.type === FilterType.Range) {
        this.filterForm.addControl(filter.key, this.fb.group({
          min: [''],
          max: ['']
        }));
      } else {
        const controlValue = this.selectedFilters[filter.key] || [];
        this.filterForm.addControl(filter.key, this.fb.control(controlValue));
      }
    });
  }

  buildCategoryTree() {
    const categoryFilter = this.availableFilters.find(filter => filter.key === 'Category');
    if (categoryFilter) {
      this.categoryTree = this.buildTree(categoryFilter.options);
      this.updateCategoryCheckState(this.categoryTree);
    }
  }

  buildTree(categories: any[]): CategoryNode[] {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    categories.forEach(category => {
      const node: CategoryNode = {
        id: category.value,
        name: category.displayValue.split(' > ').pop(),
        parentId: category.parentId,
        children: [],
        checked: this.isSelected('Category', category.value),
        expanded: false
      };
      map.set(category.value, node);

      if (category.parentId) {
        const parent = map.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  updateCategoryCheckState(nodes: CategoryNode[]) {
    nodes.forEach(node => {
      this.updateNodeCheckState(node);
      this.updateCategoryCheckState(node.children);
    });
  }

  updateNodeCheckState(node: CategoryNode) {
    if (node.children.length === 0) {
      node.checked = this.isSelected('Category', node.id);
      node.expanded = false;
    } else {
      const checkedChildren = node.children.filter(child => child.checked);
      const indeterminateChildren = node.children.filter(child => child.expanded);
      
      if (checkedChildren.length === node.children.length) {
        node.checked = true;
        node.expanded = false;
      } else if (checkedChildren.length > 0 || indeterminateChildren.length > 0) {
        node.checked = false;
        node.expanded = true;
      } else {
        node.checked = false;
        node.expanded = false;
      }
    }
  }

  toggleNode(node: CategoryNode) {
    node.expanded = !node.expanded;
  }

  toggleCategory(node: CategoryNode, event: Event) {
    event.stopPropagation();
    node.checked = !node.checked;
    this.updateSelectedFilters();
  }

  toggleFilter(key: string, value: string) {
    if (!this.selectedFilters[key]) {
      this.selectedFilters[key] = [];
    }

    const index = this.selectedFilters[key].indexOf(value);
    if (index > -1) {
      this.selectedFilters[key].splice(index, 1);
    } else {
      this.selectedFilters[key].push(value);
    }

    if (this.selectedFilters[key].length === 0) {
      delete this.selectedFilters[key];
    }

    this.emitFilterChange();
  }

  updateSelectedFilters() {
    const formValue = this.filterForm.value;
    const updatedFilters: { [key: string]: string[] } = {};

    Object.keys(formValue).forEach(key => {
      if (Array.isArray(formValue[key])) {
        updatedFilters[key] = formValue[key];
      } else if (typeof formValue[key] === 'object') {
        // Handle range filters
        const range = formValue[key];
        if (range.min || range.max) {
          updatedFilters[key] = [`${range.min || ''}-${range.max || ''}`];
        }
      }
    });

    // Handle categories separately
    updatedFilters['Category'] = this.getSelectedCategoryIds(this.categoryTree);

    this.filterChange.emit(updatedFilters);
  }

  getSelectedCategoryIds(nodes: CategoryNode[]): string[] {
    let selectedIds: string[] = [];
    nodes.forEach(node => {
      if (node.checked) {
        selectedIds.push(node.id);
      }
      selectedIds = selectedIds.concat(this.getSelectedCategoryIds(node.children));
    });
    return selectedIds;
  }

  isSelected(key: string, value: string): boolean {
    return this.selectedFilters[key]?.includes(value) || false;
  }

  onFilterChange() {
    this.updateSelectedFilters();
  }

  emitFilterChange() {
    this.filterChange.emit(this.selectedFilters);
  }

  applyCustomPriceRange() {
    const priceFilter = this.availableFilters.find(f => f.key === 'Price');
    if (priceFilter) {
      const priceControl = this.filterForm.get('Price') as FormGroup;
      if (priceControl) {
        priceControl.patchValue(this.customPriceRange);
        this.emitFilterChange();
      }
    }
  }
}