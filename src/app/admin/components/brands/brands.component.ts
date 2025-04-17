import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Brand } from 'src/app/contracts/brand/brand';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { BrandFilterByDynamic } from 'src/app/contracts/brand/brandFilterByDynamic';
import { RouterModule } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { MatDialog } from '@angular/material/dialog';
import { BrandcreateconfrimDialogComponent } from 'src/app/dialogs/brandDialogs/brandcreateconfrim-dialog/brandcreateconfrim-dialog.component';
import { FileUploadDialogComponent } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    DeleteDirectiveComponent
  ],
  templateUrl: './brands.component.html',
  styleUrls: ['./brands.component.scss']
})
export class BrandsComponent extends BaseComponent implements OnInit {
  // Form mode (create or update)
  formMode: 'create' | 'update' = 'create';
  
  // List variables
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listBrand: GetListResponse<Brand> = { 
    index: 0, size: 0, count: 0, pages: 0, 
    hasPrevious: false, hasNext: false, items: [] 
  };
  pagedBrands: Brand[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  displayedColumns: string[] = ['No', 'Image', 'Brand', 'Update', 'Delete'];
  searchForm: FormGroup;

  // Create/update variables
  brandForm: FormGroup;
  selectedBrandId: string | null = null;
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;
  selectedImageUrl: string | ArrayBuffer | null = null;
  isSubmitting: boolean = false;
  currentBrand: Brand | null = null;
  
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(
    spinner: SpinnerService,
    private brandService: BrandService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastrService: CustomToastrService
  ) {
    super(spinner);

    // Initialize search form
    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

    // Initialize brand form
    this.brandForm = this.fb.group({
      name: ['', Validators.required]
    });

    // Setup debounce search
    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchBrand();
      } else if (value.length === 0) {
        this.getBrands();
      }
    });
  }

  async ngOnInit() {
    await this.getBrands();
  }

  // List methods
  async getBrands() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    const data: GetListResponse<Brand> = await this.brandService.list(
      { pageIndex: this.currentPageNo - 1, pageSize: this.pageSize },
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { 
          toastrMessageType: ToastrMessageType.Error, 
          position: ToastrPosition.TopRight 
        });
      }
    );
  
    this.listBrand = data;
    this.pagedBrands = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getBrands();
  }

  async searchBrand() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formValue = this.searchForm.value;
    let filters: Filter[] = [];

    const name = BrandFilterByDynamic.Name;

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
  
    await this.brandService.getBrandsByDynamicQuery(dynamicQuery, pageRequest)
      .then((response) => {
        this.pagedBrands = response.items;
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
  
  removeBrandFromList(brandId: string) {
    this.pagedBrands = this.pagedBrands.filter(
      brand => brand.id !== brandId
    );
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    // If last item on page was deleted and there are other pages, go to previous page
    if (this.pagedBrands.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.getBrands();
    }

    // If currently editing this brand, reset the form
    if (this.selectedBrandId === brandId) {
      this.resetForm();
    }
  }

  // Load brand for editing
  async loadBrand(brand: Brand) {
    this.formMode = 'update';
    this.selectedBrandId = brand.id;
    this.currentBrand = brand;
    
    console.log('Selected brand ID set to:', this.selectedBrandId);
    
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      const brandDetails = await this.brandService.getById(brand.id);
      
      // Reset form but preserve mode and selected ID
      this.resetForm(false);
      
      // Set form values
      this.brandForm.patchValue({
        name: brandDetails.name
      });
      
      // Handle image
      if (brandDetails.brandImage) {
        this.currentImageUrl = brandDetails.brandImage.url;
      } else {
        this.currentImageUrl = null;
      }
      this.selectedFile = null;
      this.selectedImageUrl = null;
      
    } catch (error) {
      this.toastrService.message('Error loading brand details', 'Error', { 
        toastrMessageType: ToastrMessageType.Error, 
        position: ToastrPosition.TopRight 
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      // Scroll to form
      document.getElementById('brand-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  resetForm(changeMode: boolean = true) {
    if (changeMode) {
      this.formMode = 'create';
      this.selectedBrandId = null;
      this.currentBrand = null;
    }
    
    this.brandForm.reset();
    this.currentImageUrl = null;
    this.selectedImageUrl = null;
    this.selectedFile = null;
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
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

      const reader = new FileReader();
      reader.onload = e => this.selectedImageUrl = reader.result;
      reader.readAsDataURL(file);
    }
  }

  // Form submission
  async onSubmit() {
    console.log('Form submitted', {
      formMode: this.formMode,
      selectedBrandId: this.selectedBrandId,
      formValues: this.brandForm.value,
      formValid: this.brandForm.valid
    });
    
    if (this.brandForm.valid && !this.isSubmitting) {
      if (this.formMode === 'create') {
        this.openDialog(this.brandForm.value.name);
      } else {
        console.log('Updating brand with ID:', this.selectedBrandId);
        this.updateBrand();
      }
    }
  }

  // Create brand
  async openDialog(formValue: string): Promise<void> {
    const dialogRef = this.dialog.open(BrandcreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.createBrand(formValue);
      }
    });
  }

  async createBrand(name: string) {
    // Prevent multiple submissions
    this.isSubmitting = true;
    this.brandForm.disable();
   
    // Show spinner
    this.showSpinner(SpinnerType.BallSpinClockwise);
   
    const formData = new FormData();
    formData.append('name', name);
    if (this.selectedFile) {
      formData.append('BrandImage', this.selectedFile, this.selectedFile.name);
    }
   
    try {
      await this.brandService.create(formData, 
        () => {
          // Success callback
          this.toastrService.message(
            `Marka Başarıyla Oluşturuldu`,
            `${name}`,
            {
              toastrMessageType: ToastrMessageType.Success,
              position: ToastrPosition.TopRight
            }
          );
          
          // Reset form and refresh list
          this.resetForm();
          this.getBrands();
        },
        errorMessage => {
          // Error callback
          this.toastrService.message(
            'Marka oluşturulurken bir hata oluştu',
            'Hata',
            {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight
            }
          );
        }
      );
    } finally {
      // Re-enable form
      this.brandForm.enable();
      this.isSubmitting = false;
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  // Update brand
  async updateBrand() {
    if (!this.selectedBrandId) {
      console.error('No brand ID selected for update');
      this.toastrService.message('Brand cannot be updated: ID not found', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return;
    }

    // Prevent multiple submissions
    this.isSubmitting = true;
    this.brandForm.disable();
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formData = new FormData();
    formData.append('id', this.selectedBrandId);
    formData.append('name', this.brandForm.get('name').value);
    
    // Only append image if a new one is selected
    if (this.selectedFile) {
      formData.append('BrandImage', this.selectedFile);
    }

    try {
      await this.brandService.update(formData, 
        () => {
          this.toastrService.message(
            'Brand updated successfully',
            'Success',
            { toastrMessageType: ToastrMessageType.Success, position: ToastrPosition.TopRight }
          );
          
          // Reset form and refresh list
          this.resetForm();
          this.getBrands();
        },
        errorMessage => {
          this.toastrService.message(
            errorMessage,
            'Error',
            { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight }
          );
        }
      );
    } finally {
      this.brandForm.enable();
      this.isSubmitting = false;
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
}