import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Category } from 'src/app/contracts/category/category';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { debounceTime, distinctUntilChanged, Observable, map, startWith, switchMap } from 'rxjs';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { CategoryFilterByDynamic } from 'src/app/contracts/category/categoryFilterByDynamic';
import { RouterModule } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { Feature } from 'src/app/contracts/feature/feature';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { MatDialog } from '@angular/material/dialog';
import { CategorycreateconfrimDialogComponent } from 'src/app/dialogs/categoryDialogs/categorycreateconfrim-dialog/categorycreateconfrim-dialog.component';
import { FileUploadDialogComponent } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';
import { CategoryGetById } from 'src/app/contracts/category/category-getbyid';
import { CategoryImageFile } from 'src/app/contracts/category/categoryImageFile';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    ReactiveFormsModule,
    DeleteDirectiveComponent
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent extends BaseComponent implements OnInit {
  // Form mode (create or update)
  formMode: 'create' | 'update' = 'create';
  
  // List variables
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listCategory: GetListResponse<Category> = { 
    index: 0, size: 0, count: 0, pages: 0, 
    hasPrevious: false, hasNext: false, items: [] 
  };
  pagedCategories: Category[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  displayedColumns: string[] = ['No', 'Image', 'Category', 'Update', 'Delete'];
  searchForm: FormGroup;

  // Create/update variables
  categoryForm: FormGroup;
  parentCategoryIdControl: FormControl = new FormControl('');
  filteredParentCategories: Observable<Category[]>;
  features: Feature[] = [];
  selectedCategoryId: string | null = null;
  
  // Image variables
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;
  selectedImageUrl: string | ArrayBuffer | null = null;
  removeExistingImage: boolean = false;
  
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(
    spinner: SpinnerService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastrService: CustomToastrService,
    private featureService: FeatureService
  ) {
    super(spinner);

    // Initialize search form
    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

    // Initialize create/update form
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      title: [''],
      parentCategoryId: [''],
      featureIds: [[]]
    });

    // Setup debounce search
    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchCategory();
      } else if (value.length === 0) {
        this.getCategories();
      }
    });
  }

  async ngOnInit() {
    await this.getCategories();
    await this.loadFeatures();

    this.filteredParentCategories = this.parentCategoryIdControl.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.name),
      switchMap(name => this.searchParentCategory(name))
    );
  }

  // List methods
  async getCategories() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const data: GetListResponse<Category> = await this.categoryService.list(
      { pageIndex: this.currentPageNo - 1, pageSize: this.pageSize },
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      }
    );

    this.listCategory = data;
    this.pagedCategories = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);

    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getCategories();
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

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: this.pageSize };
  
    await this.categoryService.getCategoriesByDynamicQuery(dynamicQuery, pageRequest)
      .then((response) => {
        this.pagedCategories = response.items;
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
  
  removeCategoryFromList(categoryId: string) {
    this.pagedCategories = this.pagedCategories.filter(
      category => category.id !== categoryId
    );
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    // If last item on page was deleted and there are other pages, go to previous page
    if (this.pagedCategories.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.getCategories();
    }

    // If currently editing this category, reset the form
    if (this.selectedCategoryId === categoryId) {
      this.resetForm();
    }
  }

  // Create/update methods
  async loadFeatures() {
    return this.featureService.list({ pageIndex: -1, pageSize: -1 })
      .then(data => {
        this.features = data.items;
      })
      .catch(error => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      });
  }

  // Load a category for editing
  async loadCategory(category: Category) {
    // Önce kategori ID'sini kaydet
    this.selectedCategoryId = category.id;
    console.log('Selected category ID set to:', this.selectedCategoryId);
    
    this.formMode = 'update';
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      const categoryDetails = await this.categoryService.getById(category.id);
      
      // Reset form values
      this.resetForm(false); // Don't change form mode or selectedCategoryId
      
      // Set form values from fetched data
      this.categoryForm.patchValue({
        name: categoryDetails.name,
        title: categoryDetails.title,
        parentCategoryId: categoryDetails.parentCategoryId,
        featureIds: categoryDetails.features?.map(f => f.id) || []
      });
      
      // Set parent category display
      if (categoryDetails.parentCategoryId) {
        const parentCategory = await this.categoryService.getById(categoryDetails.parentCategoryId);
        if (parentCategory) {
          this.parentCategoryIdControl.setValue(parentCategory.name);
        }
      } else {
        this.parentCategoryIdControl.setValue('');
      }
      
      // Handle image
      if (categoryDetails.categoryImage) {
        this.currentImageUrl = categoryDetails.categoryImage.url;
      } else {
        this.currentImageUrl = null;
      }
      this.selectedFile = null;
      this.selectedImageUrl = null;
      this.removeExistingImage = false;
      
      // Tekrar kategori ID'sini kontrol et
      console.log('After loading details, selected category ID is:', this.selectedCategoryId);
      
    } catch (error) {
      this.toastrService.message('Error loading category details', 'Error', { 
        toastrMessageType: ToastrMessageType.Error, 
        position: ToastrPosition.TopRight 
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      // Scroll to form
      document.getElementById('category-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  resetForm(changeMode: boolean = true) {
    if (changeMode) {
      this.formMode = 'create';
      this.selectedCategoryId = null;
    }
    // Eğer changeMode false ise, sadece form değerlerini sıfırla ama mode ve ID'yi değiştirme
    
    this.categoryForm.reset({
      featureIds: []
    });
    this.parentCategoryIdControl.setValue('');
    
    if (changeMode) {
      // Sadece tam reset durumunda görsel değerlerini sıfırla
      this.currentImageUrl = null;
      this.selectedImageUrl = null;
      this.selectedFile = null;
      this.removeExistingImage = false;
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  selectParentCategory(category: Category) {
    this.categoryForm.patchValue({ parentCategoryId: category.id });
  }

  onFeatureToggle(featureId: string, event: any) {
    const checked = event.target ? event.target.checked : event;
    let selectedFeatures = this.categoryForm.value.featureIds || [];
    if (checked) {
      selectedFeatures.push(featureId);
    } else {
      selectedFeatures = selectedFeatures.filter(id => id !== featureId);
    }
    this.categoryForm.patchValue({ featureIds: selectedFeatures });
  }

  onSubmit() {
    console.log('Form submitted', {
      formMode: this.formMode,
      selectedCategoryId: this.selectedCategoryId,
      formValues: this.categoryForm.value,
      formValid: this.categoryForm.valid
    });
    
    if (this.categoryForm.valid) {
      if (this.formMode === 'create') {
        this.openCreateDialog(this.categoryForm.value);
      } else {
        console.log('Updating category with ID:', this.selectedCategoryId);
        this.updateCategory();
      }
    }
  }

  // File handling
  openFileUploadDialog(): void {
    const dialogRef = this.dialog.open(FileUploadDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.length > 0) {
        this.selectedFile = result[0];
        this.removeExistingImage = true;
        
        // Preview image
        const reader = new FileReader();
        reader.onload = e => this.selectedImageUrl = reader.result;
        reader.readAsDataURL(this.selectedFile);
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.removeExistingImage = true;

      const reader = new FileReader();
      reader.onload = e => this.selectedImageUrl = reader.result;
      reader.readAsDataURL(file);
    }
  }

  // Create dialog and functionality
  openCreateDialog(formValue: any): void {
    const dialogRef = this.dialog.open(CategorycreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createCategory();
      }
    });
  }

  createCategory() {
    const formValue = this.categoryForm.value;
    const formData = new FormData();
    
    formData.append('name', formValue.name);
    formData.append('title', formValue.title || '');
    
    if (formValue.parentCategoryId) {
      formData.append('parentCategoryId', formValue.parentCategoryId);
    }
    
    if (formValue.featureIds && formValue.featureIds.length > 0) {
      formValue.featureIds.forEach((featureId: string, index: number) => {
        formData.append(`featureIds[${index}]`, featureId);
      });
    }
    
    if (this.selectedFile) {
      formData.append('CategoryImage', this.selectedFile, this.selectedFile.name);
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.categoryService.create(formData, () => {
      this.toastrService.message('Category created successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      this.resetForm();
      this.getCategories(); // Refresh the list
    }, (errorMessage: string) => {
      this.toastrService.message(errorMessage, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }

  // Update functionality
  updateCategory() {
    if (!this.selectedCategoryId) {
      console.error('No category ID selected for update');
      this.toastrService.message('Kategori güncellenemiyor: ID bulunamadı', 'Hata', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return;
    }

    console.log('Updating category, preparing form data...');
    const formValue = this.categoryForm.value;
    const formData = new FormData();
    
    formData.append('id', this.selectedCategoryId);
    formData.append('name', formValue.name);
    formData.append('title', formValue.title || '');
    
    if (formValue.parentCategoryId) {
      formData.append('parentCategoryId', formValue.parentCategoryId);
    }
    
    if (formValue.featureIds && formValue.featureIds.length > 0) {
      formValue.featureIds.forEach((featureId: string) => {
        formData.append('featureIds', featureId);
      });
    }
    
    formData.append('removeExistingImage', this.removeExistingImage.toString());
    
    if (this.selectedFile) {
      formData.append('newCategoryImage', this.selectedFile, this.selectedFile.name);
    }

    // Debug log
    console.log('Form data prepared, sending update request for ID:', this.selectedCategoryId);
    
    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.categoryService.update(formData).then(
      (response) => {
        console.log('Update successful:', response);
        this.toastrService.message('Category updated successfully', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        this.resetForm();
        this.getCategories(); // Refresh the list
      },
      (error) => {
        console.error('Update failed:', error);
        this.toastrService.message('Failed to update category', 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    ).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }

  // Parent category search
  async searchParentCategory(name: string): Promise<Category[]> {
    if (!name || name.length < 3) {
      return [];
    }

    const filters: Filter[] = [{
      field: CategoryFilterByDynamic.Name,
      operator: "contains",
      value: name,
      logic: "",
      filters: [],
    }];

    const dynamicFilter: Filter = {
      field: "",
      operator: "",
      logic: "and",
      filters: filters
    };

    const dynamicQuery: DynamicQuery = {
      sort: [{ field: CategoryFilterByDynamic.Name, dir: "asc" }],
      filter: dynamicFilter
    };

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };

    try {
      const response = await this.categoryService.getCategoriesByDynamicQuery(dynamicQuery, pageRequest);
      return response.items;
    } catch (error) {
      this.toastrService.message(error, 'Error', { 
        toastrMessageType: ToastrMessageType.Error, 
        position: ToastrPosition.TopRight 
      });
      return [];
    }
  }
}