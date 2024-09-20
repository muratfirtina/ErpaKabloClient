import { CommonModule } from "@angular/common";
import { Component, OnChanges, Input, Output, EventEmitter, SimpleChanges, PipeTransform, Pipe } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FilterGroup, FilterType } from "src/app/contracts/product/filter/filters";

@Pipe({
  name: 'filterByKey',
  standalone: true
})
export class FilterByKeyPipe implements PipeTransform {
  transform(filters: FilterGroup[], key: string): FilterGroup | undefined {
    return filters.find(filter => filter.key === key);
  }
}

interface CategoryNode {
  id: string;
  name: string;
  parentId: string;
  children: CategoryNode[];
  expanded: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule,FilterByKeyPipe],
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
        this.selectedFilters['Category'] = this.selectedFilters['Category'] || [];
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
      this.updateCategorySelectState(this.categoryTree);
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
        expanded: false,
        selected: this.isSelected('Category', category.value)
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

  updateCategorySelectState(nodes: CategoryNode[]) {
    nodes.forEach(node => {
      this.updateNodeSelectState(node);
      this.updateCategorySelectState(node.children);
    });
  }

  updateNodeSelectState(node: CategoryNode) {
    node.selected = this.isSelected('Category', node.id);
    node.expanded = node.children.some(child => child.selected || child.expanded);
  }

  toggleNode(node: CategoryNode) {
    node.expanded = !node.expanded;
  }

  selectCategory(node: CategoryNode, event: Event) {
    event.stopPropagation();
    this.clearCategorySelection(this.categoryTree);
    node.selected = true;
    this.updateSelectedFilters();
  }

  clearCategorySelection(nodes: CategoryNode[]) {
    nodes.forEach(node => {
      node.selected = false;
      this.clearCategorySelection(node.children);
    });
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

  selectPriceRange(value: string) {
    this.selectedFilters['Price'] = [value];
    this.emitFilterChange();
  }

  updateSelectedFilters() {
    const formValue = this.filterForm.value;
    const updatedFilters: { [key: string]: string[] } = {};

    Object.keys(formValue).forEach(key => {
      if (Array.isArray(formValue[key])) {
        updatedFilters[key] = formValue[key];
      }
    });

    // Kategori filtresi için özel işlem
    updatedFilters['Category'] = this.getSelectedCategoryIds(this.categoryTree);

    // Fiyat filtresi için özel işlem
    if (this.selectedFilters['Price']) {
      updatedFilters['Price'] = this.selectedFilters['Price'];
    }

    this.filterChange.emit(updatedFilters);
  }

  getSelectedCategoryIds(nodes: CategoryNode[]): string[] {
    let selectedIds: string[] = [];
    nodes.forEach(node => {
      if (node.selected) {
        selectedIds.push(node.id);
      } else {
        selectedIds = selectedIds.concat(this.getSelectedCategoryIds(node.children));
      }
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
        const min = priceControl.get('min')?.value;
        const max = priceControl.get('max')?.value;
        if (min || max) {
          this.selectedFilters['Price'] = [`${min || ''}-${max || ''}`];
        } else {
          delete this.selectedFilters['Price'];
        }
        this.emitFilterChange();
      }
    }
  }
}