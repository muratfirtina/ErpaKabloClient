import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, FormArray } from '@angular/forms';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Feature } from 'src/app/contracts/feature/feature';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { FeatureFilterByDynamic } from 'src/app/contracts/feature/featureFilterByDynamic';
import { RouterModule } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { Category } from 'src/app/contracts/category/category';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { MatDialog } from '@angular/material/dialog';
import { FeaturecreateconfrimDialogComponent } from 'src/app/dialogs/featureDialogs/featurecreateconfrim-dialog/featurecreateconfrim-dialog.component';
import { FeatureCreate } from 'src/app/contracts/feature/feature-create';
import { FeatureUpdate } from 'src/app/contracts/feature/feature-update';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import { Featurevalue } from 'src/app/contracts/featurevalue/featurevalue';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    DeleteDirectiveComponent
  ],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent extends BaseComponent implements OnInit {
  // Form mode (create or update)
  formMode: 'create' | 'update' = 'create';
  
  // List variables
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listFeature: GetListResponse<Feature> = { 
    index: 0, size: 0, count: 0, pages: 0, 
    hasPrevious: false, hasNext: false, items: [] 
  };
  pagedFeatures: Feature[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  displayedColumns: string[] = ['No', 'Feature', 'Update', 'Delete'];
  searchForm: FormGroup;

  // Create/update variables
  featureForm: FormGroup;
  categories: Category[] = [];
  filteredCategories: Observable<Category[]>;
  categoryFilterCtrl: FormControl = new FormControl();
  selectedCategories: Category[] = [];
  expandedCategories: Set<string> = new Set();
  dataSource = { data: [] as Category[] };
  selectedFeatureId: string | null = null;
  
  // Feature value variables
  allFeatureValues: Featurevalue[] = [];

  constructor(
    spinner: SpinnerService,
    private featureService: FeatureService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastrService: CustomToastrService,
    private categoryService: CategoryService,
    private featurevalueService: FeaturevalueService
  ) {
    super(spinner);

    // Initialize search form
    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

    // Initialize feature form
    this.featureForm = this.fb.group({
      name: ['', Validators.required],
      categoryIds: [[]],
      featureValues: this.fb.array([this.createFeatureValueControl()])
    });

    // Setup debounce search
    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchFeature();
      } else if (value.length === 0) {
        this.getFeatures();
      }
    });
  }

  async ngOnInit() {
    await this.getFeatures();
    await this.loadCategories();
    await this.loadFeatureValues();
    this.setupCategoryFilter();
  }

  // Feature values form array manipulation
  get featureValues(): FormArray {
    return this.featureForm.get('featureValues') as FormArray;
  }

  createFeatureValueControl(): FormControl {
    return this.fb.control('', Validators.required);
  }

  addFeatureValueControl() {
    this.featureValues.push(this.createFeatureValueControl());
  }

  // For existing feature values in update mode
  addExistingFeatureValueControl(value: any = { id: '' }): void {
    this.featureValues.push(
      this.fb.group({
        id: [value.id, Validators.required],
      })
    );
  }

  isStringControl(index: number): boolean {
    return this.featureValues.at(index) instanceof FormControl;
  }

  removeFeatureValueControl(index: number) {
    if (this.featureValues.length > 1) {
      this.featureValues.removeAt(index);
    } else {
      this.toastrService.message('En az bir özellik değeri olmalıdır', 'Uyarı', {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
    }
  }

  // List methods
  async getFeatures() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    const data: GetListResponse<Feature> = await this.featureService.list(
      { pageIndex: this.currentPageNo - 1, pageSize: this.pageSize },
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      }
    );
  
    this.listFeature = data;
    this.pagedFeatures = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getFeatures();
  }

  async searchFeature() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formValue = this.searchForm.value;
    let filters: Filter[] = [];

    const name = FeatureFilterByDynamic.Name;

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

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: this.pageSize };
  
    await this.featureService.getFeaturesByDynamicQuery(dynamicQuery, pageRequest)
      .then((response) => {
        this.pagedFeatures = response.items;
        this.count = response.count;
        this.pages = response.pages;
        this.currentPageNo = 1;
      })
      .catch((error) => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      })
      .finally(() => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      });
  }
  
  removeFeatureFromList(featureId: string) {
    this.pagedFeatures = this.pagedFeatures.filter(
      feature => feature.id !== featureId
    );
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    // If last item on page was deleted and there are other pages, go to previous page
    if (this.pagedFeatures.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.getFeatures();
    }

    // If currently editing this feature, reset the form
    if (this.selectedFeatureId === featureId) {
      this.resetForm();
    }
  }

  // Category and feature values loading
  async loadCategories() {
    return this.categoryService.list({ pageIndex: -1, pageSize: -1 })
      .then(data => {
        this.categories = this.createHierarchy(data.items);
        this.dataSource.data = this.categories;
      })
      .catch(error => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      });
  }

  async loadFeatureValues() {
    return this.featurevalueService.list({ pageIndex: -1, pageSize: -1 })
      .then(data => {
        this.allFeatureValues = data.items;
      })
      .catch(error => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      });
  }

  // Load feature for editing
  async loadFeature(feature: Feature) {
    this.formMode = 'update';
    this.selectedFeatureId = feature.id;
    console.log('Selected feature ID set to:', this.selectedFeatureId);
    
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      const featureDetails = await this.featureService.getById(feature.id);
      
      // Reset form values without changing the mode or selected ID
      this.resetForm(false);
      
      // Clear feature values form array
      while (this.featureValues.length > 0) {
        this.featureValues.removeAt(0);
      }
      
      // Set form values from fetched data
      this.featureForm.patchValue({
        name: featureDetails.name
      });
      
      // Add feature values to form
      if (featureDetails.featureValues && featureDetails.featureValues.length) {
        featureDetails.featureValues.forEach(value => {
          this.addExistingFeatureValueControl(value);
        });
      } else {
        this.addFeatureValueControl(); // Add at least one empty control
      }
      
      // Reset selected categories
      this.selectedCategories = [];
      
      // Reset all category checked states
      const resetCategoryChecks = (categories: Category[]) => {
        categories.forEach(category => {
          category.checked = false;
          if (category.subCategories && category.subCategories.length > 0) {
            resetCategoryChecks(category.subCategories);
          }
        });
      };
      resetCategoryChecks(this.categories);
      
      // Mark selected categories
      if (featureDetails.categories && featureDetails.categories.length > 0) {
        this.selectedCategories = [...featureDetails.categories];
        
        featureDetails.categories.forEach(category => {
          this.markCategoryAsSelected(category.id);
          
          // Expand parent categories
          let parentCategory = this.findCategoryParent(this.categories, category.id);
          while (parentCategory) {
            this.expandedCategories.add(parentCategory.id);
            parentCategory = this.findCategoryParent(this.categories, parentCategory.id);
          }
        });
        
        // Update form value
        this.featureForm.patchValue({
          categoryIds: this.selectedCategories.map(cat => cat.id)
        });
      }
      
      // Check that the ID is still set
      console.log('After loading details, selected feature ID is:', this.selectedFeatureId);
      
    } catch (error) {
      this.toastrService.message('Error loading feature details', 'Error', { 
        toastrMessageType: ToastrMessageType.Error, 
        position: ToastrPosition.TopRight 
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      // Scroll to form
      document.getElementById('feature-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  resetForm(changeMode: boolean = true) {
    if (changeMode) {
      this.formMode = 'create';
      this.selectedFeatureId = null;
    }
    
    this.featureForm.patchValue({
      name: '',
      categoryIds: []
    });
    
    // Reset feature values
    while (this.featureValues.length > 0) {
      this.featureValues.removeAt(0);
    }
    this.featureValues.push(this.createFeatureValueControl());
    
    if (changeMode) {
      // Reset categories only on full reset
      this.selectedCategories = [];
      
      const resetCategoryChecks = (categories: Category[]) => {
        categories.forEach(category => {
          category.checked = false;
          if (category.subCategories && category.subCategories.length > 0) {
            resetCategoryChecks(category.subCategories);
          }
        });
      };
      
      resetCategoryChecks(this.categories);
      this.dataSource.data = [...this.categories];
    }
  }

  // Category tree handling
  setupCategoryFilter() {
    this.filteredCategories = this.categoryFilterCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCategories(value || ''))
    );

    // Apply filtered categories to dataSource
    this.categoryFilterCtrl.valueChanges.subscribe(value => {
      const searchTerm = value ? value.toLowerCase().trim() : '';

      if (searchTerm === '') {
        // No search term, show all categories
        this.dataSource.data = [...this.categories];
      } else {
        // Filter the tree
        const filteredTree = this.getFilteredCategoryTree(this.categories, searchTerm);
        this.dataSource.data = filteredTree;
        
        // Expand all categories in filtered result
        this.expandAllFilteredCategories(this.dataSource.data);
      }
      
      // Keep selected categories marked
      this.restoreCheckedState();
    });
  }

  getFilteredCategoryTree(categories: Category[], searchTerm: string): Category[] {
    // Deep clone the categories
    const clonedCategories = JSON.parse(JSON.stringify(categories)) as Category[];
    
    const shouldIncludeCategory = (category: Category, term: string): boolean => {
      // Include if category name matches search term
      if (category.name.toLowerCase().includes(term)) {
        return true;
      }
      
      // Check subcategories
      if (category.subCategories && category.subCategories.length > 0) {
        const filteredSubCategories = category.subCategories.filter(subCat => 
          shouldIncludeCategory(subCat, term)
        );
        
        category.subCategories = filteredSubCategories;
        
        return filteredSubCategories.length > 0;
      }
      
      return false;
    };
    
    // Filter root categories
    return clonedCategories.filter(category => 
      shouldIncludeCategory(category, searchTerm)
    );
  }

  expandAllFilteredCategories(categories: Category[]): void {
    categories.forEach(category => {
      this.expandedCategories.add(category.id);
      
      if (category.subCategories && category.subCategories.length > 0) {
        this.expandAllFilteredCategories(category.subCategories);
      }
    });
  }

  restoreCheckedState(): void {
    const restoreChecks = (categories: Category[]): void => {
      categories.forEach(category => {
        const isSelected = this.selectedCategories.some(sc => sc.id === category.id);
        if (isSelected) {
          category.checked = true;
        }
        
        if (category.subCategories && category.subCategories.length > 0) {
          restoreChecks(category.subCategories);
        }
      });
    };
    
    restoreChecks(this.dataSource.data);
  }

  filterCategories(value: string): Category[] {
    if (!value) return this.flattenCategories(this.categories);
    
    const filterValue = value.toLowerCase().trim();
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

  // Category selection and expansion
  isExpanded(category: Category): boolean {
    return this.expandedCategories.has(category.id);
  }

  isCategorySelected(category: Category): boolean {
    return category.checked || false;
  }

  toggleCategoryExpansion(category: Category, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    
    if (this.expandedCategories.has(category.id)) {
      this.expandedCategories.delete(category.id);
    } else {
      this.expandedCategories.add(category.id);
    }
  }

  toggleCategory(category: Category, event: any): void {
    const isChecked = event.target ? event.target.checked : event;
    this.updateCategoryAndDescendants(category, isChecked);
    this.updateSelectedCategories();
  }

  updateCategoryAndDescendants(category: Category, checked: boolean): void {
    category.checked = checked;
    
    if (category.subCategories) {
      category.subCategories.forEach(subCategory => {
        this.updateCategoryAndDescendants(subCategory, checked);
      });
    }
  }

  updateSelectedCategories(): void {
    this.selectedCategories = this.collectSelectedCategories(this.categories);
    
    // Update form value
    this.featureForm.patchValue({
      categoryIds: this.selectedCategories.map(cat => cat.id)
    });
  }

  collectSelectedCategories(categories: Category[]): Category[] {
    let selected: Category[] = [];
    categories.forEach(category => {
      if (category.checked) {
        selected.push(category);
      }
      
      if (category.subCategories && category.subCategories.length > 0) {
        selected = selected.concat(this.collectSelectedCategories(category.subCategories));
      }
    });
    return selected;
  }

  removeCategory(category: Category): void {
    this.updateCategoryAndDescendants(category, false);
    this.updateSelectedCategories();
  }

  // Helper methods for categories
  markCategoryAsSelected(categoryId: string): void {
    const category = this.findCategoryById(this.categories, categoryId);
    if (category) {
      category.checked = true;
    }
  }

  findCategoryParent(categories: Category[], childId: string): Category | null {
    for (const category of categories) {
      if (category.subCategories) {
        if (category.subCategories.some(sub => sub.id === childId)) {
          return category;
        }

        const foundInSub = this.findCategoryParent(category.subCategories, childId);
        if (foundInSub) {
          return foundInSub;
        }
      }
    }
    return null;
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

  // Form submission
  onSubmit(event: Event) {
    event.preventDefault();
    console.log('Form submitted', {
      formMode: this.formMode,
      selectedFeatureId: this.selectedFeatureId,
      formValues: this.featureForm.value,
      formValid: this.featureForm.valid
    });
    
    if (this.featureForm.valid) {
      if (this.formMode === 'create') {
        this.openDialog(this.featureForm.value);
      } else {
        console.log('Updating feature with ID:', this.selectedFeatureId);
        this.updateFeature(this.featureForm.value);
      }
    }
  }

  // Create feature
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
      this.showSpinner(SpinnerType.BallSpinClockwise);
      
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
  
      this.toastrService.message('Feature and Feature Values created successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      
      // Reset form and refresh list
      this.resetForm();
      this.getFeatures();
      
    } catch (error) {
      this.toastrService.message(error, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  // Update feature
  async updateFeature(formValue: any) {
    if (!this.selectedFeatureId) {
      console.error('No feature ID selected for update');
      this.toastrService.message('Feature cannot be updated: ID not found', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return;
    }

    try {
      this.showSpinner(SpinnerType.BallSpinClockwise);
      
      // Prepare feature values
      const featureValues = [];
      const featureValueIds = [];

      this.featureValues.controls.forEach(control => {
        if (control instanceof FormControl) {
          // New value
          const valueText = control.value.trim();
          if (valueText) {
            featureValues.push({ name: valueText });
          }
        } else if (control instanceof FormGroup) {
          // Existing value
          const id = control.get('id').value;
          if (id) {
            featureValueIds.push(id);
          }
        }
      });

      // Prepare update object
      const update_feature: FeatureUpdate = {
        id: this.selectedFeatureId,
        name: formValue.name,
        categoryIds: formValue.categoryIds ? formValue.categoryIds : [],
        featureValueIds: featureValueIds,
        featureValues: featureValues
      };

      console.log('Updating feature with:', update_feature);
      
      // Update feature
      await this.featureService.update(update_feature);

      this.toastrService.message('Feature updated successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      
      // Reset form and refresh
      this.resetForm();
      await this.loadFeatureValues(); // Reload feature values
      this.getFeatures(); // Refresh list
      
    } catch (error) {
      console.error('Update failed:', error);
      this.toastrService.message('Failed to update feature', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
}