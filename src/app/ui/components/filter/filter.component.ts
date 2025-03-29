import { CommonModule } from "@angular/common";
import { Component, OnChanges, Input, Output, EventEmitter, SimpleChanges, PipeTransform, Pipe, AfterViewInit } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Offcanvas } from 'bootstrap';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnChanges, AfterViewInit {
  @Input() availableFilters: FilterGroup[] = [];
  @Input() selectedFilters: { [key: string]: string[] } = {};
  @Input() isLoading: boolean = true;
  @Output() filterChange = new EventEmitter<{ [key: string]: string[] }>();

  FilterType = FilterType;
  filterForm: FormGroup;
  categoryTree: CategoryNode[] = [];
  customPriceRange: { min: string, max: string } = { min: '', max: '' };
  collapsedState: { [key: string]: boolean } = {};
  private offcanvasInstance: Offcanvas | null = null;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({});
  }

  ngAfterViewInit() {
    // Initialize the offcanvas instance after view init
    this.initializeOffcanvas();
  }

  initializeOffcanvas() {
    const offcanvasElement = document.getElementById('filterOffcanvas');
    if (offcanvasElement) {
      this.offcanvasInstance = new Offcanvas(offcanvasElement, {
        backdrop: true,
        keyboard: true,
        scroll: false
      });

      // Listen for the offcanvas hidden event to ensure body classes are removed
      offcanvasElement.addEventListener('hidden.bs.offcanvas', () => {
        document.body.classList.remove('modal-open');
        const backdrops = document.getElementsByClassName('offcanvas-backdrop');
        if (backdrops.length > 0) {
          for (let i = 0; i < backdrops.length; i++) {
            backdrops[i].remove();
          }
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['availableFilters'] || changes['selectedFilters']) {
      this.initializeFilters();
      this.buildCategoryTree();
      this.availableFilters.forEach(filter => {
        this.collapsedState[filter.key] = false;
      });
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
      // Önce tüm kategorileri düzenli hale getir
      const categories = [...categoryFilter.options].sort((a, b) => {
        // Tip güvenliği için parentId kontrolü
        const aParentId = (a as any).parentId;
        const bParentId = (b as any).parentId;
        
        // Önce üst kategorileri göster
        if (!aParentId && bParentId) return -1;
        if (aParentId && !bParentId) return 1;
        
        // Sonra aynı seviyedeki kategorileri alfabetik olarak sırala
        return a.displayValue.localeCompare(b.displayValue);
      });
      
      this.categoryTree = this.buildTree(categories);
      this.updateCategorySelectState(this.categoryTree);
    }
  }

  buildTree(categories: any[]): CategoryNode[] {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Önce tüm kategori düğümlerini oluştur
    categories.forEach(category => {
      const node: CategoryNode = {
        id: category.value,
        name: category.displayValue.includes(' > ') 
          ? category.displayValue.split(' > ').pop() 
          : category.displayValue,
        parentId: (category as any).parentId, // Tip güvenli erişim
        children: [],
        expanded: false,
        selected: this.isSelected('Category', category.value)
      };
      map.set(category.value, node);
    });

    // Şimdi parent-child ilişkilerini kur
    categories.forEach(category => {
      const node = map.get(category.value);
      if (node) {
        // Tip güvenli parentId erişimi
        const parentId = (category as any).parentId;
        
        if (parentId && map.has(parentId)) {
          const parent = map.get(parentId);
          parent?.children.push(node);
          // Çocuk seçiliyse, ebeveyni genişlet
          if (node.selected) {
            parent!.expanded = true;
          }
        } else {
          roots.push(node);
        }
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

  selectPriceRange(value: string | null) {
    if (value === null) {
      delete this.selectedFilters['Price'];
    } else {
      this.selectedFilters['Price'] = [value];
    }
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

  closeOffcanvas() {
    // First try to close via Bootstrap's API
    if (this.offcanvasInstance) {
      this.offcanvasInstance.hide();
    } else {
      const offcanvasElement = document.getElementById('filterOffcanvas');
      if (offcanvasElement) {
        const bsInstance = Offcanvas.getInstance(offcanvasElement);
        if (bsInstance) {
          bsInstance.hide();
        }
      }
    }
    
    // Force cleanup of all backdrop elements and modal classes
    this.forceCleanBackdrops();
  }
  
  forceCleanBackdrops() {
    // Set multiple timeouts to ensure cleanup happens
    setTimeout(() => this.cleanupDomElements(), 100);
    setTimeout(() => this.cleanupDomElements(), 300);
    setTimeout(() => this.cleanupDomElements(), 500);
  }
  
  cleanupDomElements() {
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    
    // Remove all backdrop elements
    const backdrops = document.querySelectorAll('.offcanvas-backdrop, .modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Remove inline styles added by Bootstrap
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    
    // Make the offcanvas itself invisible if it's still visible
    const offcanvasElement = document.getElementById('filterOffcanvas');
    if (offcanvasElement) {
      offcanvasElement.classList.remove('show');
      offcanvasElement.style.visibility = 'hidden';
      setTimeout(() => {
        offcanvasElement.style.removeProperty('visibility');
      }, 500);
    }
  }

  // Filtre değişikliklerinde offcanvas'ı kapatma
  emitFilterChange() {
    this.filterChange.emit(this.selectedFilters);
    if (window.innerWidth < 768) { // md breakpoint
      this.closeOffcanvas();
      
      // Extra safety: force document body to normal state
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('overflow-hidden');
      document.body.style.overflow = 'auto';
      
      // Force backdrop cleanup again after a slight delay
      setTimeout(() => {
        this.forceCleanBackdrops();
      }, 100);
    }
  }

  toggleCollapse(filterKey: string) {
    this.collapsedState[filterKey] = !this.collapsedState[filterKey];
  }

  // Collapse durumunu kontrol eden metod
  isCollapsed(filterKey: string): boolean {
    return this.collapsedState[filterKey];
  }
}