import { CommonModule } from "@angular/common";
import { Component, OnChanges, Input, Output, EventEmitter, SimpleChanges, PipeTransform, Pipe, AfterViewInit, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Offcanvas } from 'bootstrap';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
export class FilterComponent implements OnChanges, AfterViewInit, OnInit {
  @Input() availableFilters: FilterGroup[] = [];
  @Input() selectedFilters: { [key: string]: string[] } = {};
  @Input() isLoading: boolean = true;
  @Output() filterChange = new EventEmitter<{ [key: string]: string[] }>();

  FilterType = FilterType;
  filterForm: FormGroup;
  categoryTree: CategoryNode[] = [];
  collapsedState: { [key: string]: boolean } = {};
  searchControls: { [key: string]: FormControl } = {};
  filteredOptions: { [key: string]: any[] } = {};
  private offcanvasInstance: Offcanvas | null = null;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({});
  }

  ngOnInit() {
    // Initialize empty form
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
      
      // Initialize collapsed state and search controls for each filter
      this.availableFilters.forEach(filter => {
        if (filter.key !== 'Category' && filter.type === FilterType.Checkbox) {
          // Initialize search control if it doesn't exist
          if (!this.searchControls[filter.key]) {
            const control = new FormControl('');
            // Subscribe to changes for filtering
            control.valueChanges
              .pipe(
                debounceTime(300),
                distinctUntilChanged()
              )
              .subscribe(value => {
                this.updateFilteredOptions(filter.key, value);
              });
            
            this.searchControls[filter.key] = control;
          }
          
          // Initialize filtered options
          this.updateFilteredOptions(filter.key, '');
        }
        
        // Set default collapsed state (open for the first 3 filters)
        if (!(filter.key in this.collapsedState)) {
          // Default to open for important filters
          const isImportantFilter = filter.key === 'Category' || filter.key === 'Brand';
          this.collapsedState[filter.key] = !isImportantFilter;
        }
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
    console.log("Building category tree from availableFilters:", this.availableFilters);
    
    const categoryFilter = this.availableFilters.find(filter => filter.key === 'Category');
    console.log("Category filter found:", categoryFilter);
    
    if (categoryFilter) {
      // Kategorileri sırala
      const categories = [...categoryFilter.options].sort((a, b) => {
        const aParentId = a.parentId;
        const bParentId = b.parentId;
        
        // Önce kök kategoriler
        if (!aParentId && bParentId) return -1;
        if (aParentId && !bParentId) return 1;
        
        // Sonra alfabetik sıralama
        return a.displayValue.localeCompare(b.displayValue);
      });
      
      console.log("Sorted categories:", categories);
      
      // Ağaç yapısını oluştur
      this.categoryTree = this.buildTree(categories);
      console.log("Built category tree:", this.categoryTree);
      
      // Seçili kategorileri güncelle
      this.updateCategorySelectState(this.categoryTree);
    } else {
      console.warn("No category filter found in available filters");
      this.categoryTree = [];
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
    
    // Seçimi değiştir (toggle)
    node.selected = !node.selected;
    
    if (node.selected) {
      // Kategori seçildiyse, üst seviye kategorilerdeki seçimi kaldır 
      // böylece sadece bu kategorinin ürünleri gösterilir
      this.clearParentSelection(this.categoryTree, node);
    } else {
      // Seçim kaldırıldıysa, hiçbir alt kategori de seçilmemeli
      this.clearChildrenSelection(node);
    }
    
    this.updateSelectedFilters();
  }
  
  // Üst seviye kategorilerden seçimi kaldır
  private clearParentSelection(nodes: CategoryNode[], selectedNode: CategoryNode) {
    for (const node of nodes) {
      // Bu düğüm seçilen düğümün üst seviyesi ise ve seçiliyse, seçimi kaldır
      if (this.isParentOf(node, selectedNode) && node.selected) {
        node.selected = false;
      }
      
      // Alt kategorilerde arama yap
      if (node.children && node.children.length > 0) {
        this.clearParentSelection(node.children, selectedNode);
      }
    }
  }
  
  // Bir düğümün diğer düğümün üst seviyesi olup olmadığını kontrol et
  private isParentOf(potentialParent: CategoryNode, child: CategoryNode): boolean {
    if (!potentialParent.children) return false;
    
    // Doğrudan alt kategori mi?
    if (potentialParent.children.some(c => c.id === child.id)) {
      return true;
    }
    
    // Alt kategorilerde kontrol et
    for (const subChild of potentialParent.children) {
      if (this.isParentOf(subChild, child)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Alt kategorileri temizle
  private clearChildrenSelection(node: CategoryNode) {
    if (node.children) {
      for (const child of node.children) {
        child.selected = false;
        this.clearChildrenSelection(child);
      }
    }
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

    this.filterChange.emit(updatedFilters);
  }

  getSelectedCategoryIds(nodes: CategoryNode[]): string[] {
    let selectedIds: string[] = [];
    nodes.forEach(node => {
      if (node.selected) {
        selectedIds.push(node.id);
      }
      // Alt kategorilerde seçilenleri de ekle
      if (node.children && node.children.length > 0) {
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

  isCollapsed(filterKey: string): boolean {
    return this.collapsedState[filterKey];
  }
  
  // Yeni Metodlar
  
  // Toplam seçilen filtre sayısını hesaplama
  getTotalSelectedFilters(): number {
    let count = 0;
    
    for (const key in this.selectedFilters) {
      if (this.selectedFilters.hasOwnProperty(key)) {
        count += this.selectedFilters[key].length;
      }
    }
    
    return count;
  }
  
  // Belirli bir filtredeki seçili öğe sayısını hesaplama
  getSelectedFilterCount(key: string): number {
    return this.selectedFilters[key]?.length || 0;
  }
  
  // Tüm filtreleri temizle
  clearAllFilters() {
    this.selectedFilters = {};
    this.clearCategorySelection(this.categoryTree);
    this.updateSelectedFilters();
  }
  
  // Arama kontrolünü getir
  getSearchControl(key: string): FormControl {
    if (!this.searchControls[key]) {
      this.searchControls[key] = new FormControl('');
    }
    return this.searchControls[key];
  }
  
  // Filtrelenmiş seçenekleri güncelle
  updateFilteredOptions(key: string, searchTerm: string) {
    const filter = this.availableFilters.find(f => f.key === key);
    if (!filter) return;
    
    const options = filter.options;
    
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredOptions[key] = options;
    } else {
      const term = searchTerm.toLowerCase().trim();
      this.filteredOptions[key] = options.filter(option => 
        option.displayValue.toLowerCase().includes(term)
      );
    }
  }
  
  // Filtrelenmiş seçenekleri getir
  getFilteredOptions(filter: FilterGroup): any[] {
    if (!this.filteredOptions[filter.key]) {
      this.filteredOptions[filter.key] = filter.options;
    }
    return this.filteredOptions[filter.key];
  }
}