import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { Brand } from 'src/app/contracts/brand/brand';
import { Category } from 'src/app/contracts/category/category';
import { Feature } from 'src/app/contracts/feature/feature';
import { Featurevalue } from 'src/app/contracts/featurevalue/featurevalue';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxFileDropModule } from 'ngx-file-drop';
import { DialogService } from 'src/app/services/common/dialog.service';
import { FileUploadDialogComponent } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';
import { SafeUrlPipe } from 'src/app/pipes/safeUrl.pipe';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog } from '@angular/material/dialog';
import { DescriptionEditorDialogComponent } from 'src/app/dialogs/description-editor-dialog/description-editor-dialog.component';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

interface CategoryNode extends Category {
  level: number;
  expanded?: boolean;
  hasChildren?: boolean;
  children?: CategoryNode[];
}

interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  id: string;
  parentCategoryId: string;
  checked?: boolean;
}

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatTreeModule,
    MatRadioModule,
    NgxMatSelectSearchModule,
    AngularEditorModule,
    NgxFileDropModule,
    DragDropModule,
    SafeUrlPipe
  ],
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss', '../../../../../styles.scss']
})
export class ProductCreateComponent implements OnInit {
  categories: Category[] = [];
  productForm: FormGroup;
  loading: boolean = false;
  features: Feature[] = [];
  featureValues: { [key: string]: Featurevalue[] } = {};
  filteredBrands: Brand[] = [];
  filteredCategories: CategoryNode[] = [];
  showBrandResults: boolean = false;
  showCategoryTree: boolean = false;
  allSelected: boolean = false;
  variantsCreated: boolean = false;
  canGenerateVariants: boolean = false;
  buttonText: string = 'Ürünü Ekle';
  private imageUrls = new Map<string, string>();
  private brandSearchSubject = new Subject<string>();
  public treeControl: FlatTreeControl<FlatNode>;
  private treeFlattener: MatTreeFlattener<Category, FlatNode>;
  public categorydataSource: MatTreeFlatDataSource<Category, FlatNode>;

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService,
    private categoryService: CategoryService,
    private featureService: FeatureService,
    private productService: ProductService,
    private spinnerService: NgxSpinnerService,
    private customToasterService: CustomToastrService,
    private dialogService: DialogService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.createForm();
    this.setupBrandSearch();
    this.treeControl = new FlatTreeControl<FlatNode>(
      node => node.level,
      node => node.expandable
    );

    this.treeFlattener = new MatTreeFlattener(
      this._transformer,
      node => node.level,
      node => node.expandable,
      node => node.subCategories
    );

    this.categorydataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.createForm();
    this.setupBrandSearch();
  }

  public hasChild = (_: number, node: FlatNode): boolean => node.expandable;

  public onCategorySelected(node: FlatNode): void {
    this.productForm.patchValue({
      categoryId: node.id,
      categorySearch: node.name
    });
    this.loadCategoryFeatures(node.id);
    this.showCategoryTree = false; // Seçim yapıldıktan sonra dropdown'ı kapat
  }

  private _transformer = (node: Category, level: number): FlatNode => {
    return {
      expandable: !!node.subCategories && node.subCategories.length > 0,
      name: node.name,
      level: level,
      id: node.id,
      parentCategoryId: node.parentCategoryId
    };
  };

  ngOnInit() {
    this.setupFormSubscriptions();
    this.loadInitialData();
  }

  private createForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      brandId: ['', Validators.required],
      brandSearch: [''],
      categoryId: ['', Validators.required],
      categorySearch: [''],
      existingVaryantGroup: [false], // Mevcut varyant grubuna ekleme yapılacak mı?
      varyantGroupId: [''], // Mevcut varyant grup ID'si
      tax: [0, /* [Validators.required, Validators.min(0)] */],
      features: this.fb.array([]),
      variants: this.fb.array([])
    });
  }

  getControl(variant: AbstractControl, controlName: string): FormControl {
    return variant.get(controlName) as FormControl;
  }

  private setupBrandSearch() {
    this.brandSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchBrands(searchTerm);
    });
  }

  private setupFormSubscriptions() {
    this.productForm.get('features')?.valueChanges.subscribe(() => {
      this.updateCanGenerateVariants();
    });
  }

  private async loadInitialData() {
    try {
      this.loading = true;
      await this.loadCategories();
    } catch (error) {
      this.handleError('Veriler yüklenirken bir hata oluştu', error);
    } finally {
      this.loading = false;
    }
  }

  public async loadCategories() {
    try {
      const data = await this.categoryService.list({ pageIndex: -1, pageSize: -1 });
      this.categories = data.items;
      const hierarchicalCategories = this.createHierarchy(this.categories);
      this.categorydataSource.data = hierarchicalCategories;
      // Tüm kategorileri genişlet
      this.treeControl.collapseAll();
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error loading categories:', error);
      this.customToasterService.message("Kategoriler yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  private createHierarchy(categories: Category[]): Category[] {
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

  public filterCategories(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (!input) {
      this.categorydataSource.data = this.createHierarchy(this.categories);
      this.treeControl.expandAll();
      return;
    }

    const filterTree = (categories: Category[]): Category[] => {
      return categories.reduce((acc, category) => {
        const matchesSearch = category.name.toLowerCase().includes(input.toLowerCase());
        const filteredChildren = filterTree(category.subCategories || []);

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...category,
            subCategories: filteredChildren
          });
        }

        return acc;
      }, [] as Category[]);
    };

    const filteredCategories = filterTree([...this.categories]);
    this.categorydataSource.data = this.createHierarchy(filteredCategories);
    this.treeControl.expandAll();
    this.changeDetectorRef.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const categoryContainer = document.querySelector('.category-tree');
    const categoryInput = document.querySelector('#categorySearch');

    if (categoryContainer && categoryInput) {
      if (!categoryContainer.contains(event.target as Node) &&
          !categoryInput.contains(event.target as Node)) {
        this.showCategoryTree = false;
      }
    }
  }

  private buildCategoryTree(categories: Category[], parentId: string = null, level: number = 0): CategoryNode[] {
    const categoryNodes = categories
      .filter(cat => cat.parentCategoryId === parentId)
      .map(cat => {
        const children = this.buildCategoryTree(categories, cat.id, level + 1);
        return {
          ...cat,
          level,
          expanded: false,
          hasChildren: children.length > 0,
          children: children
        };
      });
    return categoryNodes;
  }

  onBrandSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.brandSearchSubject.next(input.value);
  }

  async searchBrands(searchTerm: string) {
    if (searchTerm.length < 2) {
      this.filteredBrands = [];
      this.showBrandResults = false;
      return;
    }

    try {
      const response = await this.brandService.getBrandsByDynamicQuery(
        { filter: { field: 'name', operator: 'contains', value: searchTerm } },
        { pageIndex: -1, pageSize: -1 }
      );
      this.filteredBrands = response.items;
      this.showBrandResults = true;
    } catch (error) {
      this.handleError('Marka araması başarısız', error);
    }
  }

  selectBrand(brand: Brand) {
    this.productForm.patchValue({
      brandId: brand.id,
      brandSearch: brand.name
    });
    this.showBrandResults = false;
  }



  toggleCategory(category: CategoryNode, event: Event) {
    event.stopPropagation();
    category.expanded = !category.expanded;
    this.changeDetectorRef.detectChanges(); // Değişiklikleri tetikle
  }

  async selectCategory(category: CategoryNode) {
    this.productForm.patchValue({
      categoryId: category.id,
      categorySearch: category.name
    });
    this.showCategoryTree = false;
    await this.loadCategoryFeatures(category.id);
  }

  private async loadCategoryFeatures(categoryId: string) {
    try {
      const category = await this.categoryService.getById(categoryId);
      this.features = category.features;
      await Promise.all(
        this.features.map(feature => this.loadFeatureValues(feature.id))
      );
      // Clear existing features and variants when category changes
      this.featureFormArray.clear();
      this.variants.clear();
      this.variantsCreated = false;
      this.canGenerateVariants = false;
      this.changeDetectorRef.detectChanges(); // Update view
    } catch (error) {
      this.handleError('Kategori özellikleri yüklenemedi', error);
    }
  }


  private async loadFeatureValues(featureId: string) {
    try {
      const feature = await this.featureService.getById(featureId);
      this.featureValues[featureId] = feature.featureValues;
    } catch (error) {
      this.handleError('Özellik değerleri yüklenemedi', error);
    }
  }

  get featureFormArray(): FormArray {
    return this.productForm.get('features') as FormArray;
  }

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  addFeature() {
    this.featureFormArray.push(this.createFeatureFormGroup());
    this.variantsCreated = false;
  }

  removeFeature(index: number) {
    this.featureFormArray.removeAt(index);
    this.variantsCreated = false;
    this.updateCanGenerateVariants();
  }

  private createFeatureFormGroup(): FormGroup {
    return this.fb.group({
      featureId: ['', Validators.required],
      selectedValues: [[], Validators.required]
    });
  }

  generateVariants() {
    const combinations = this.generateCombinations();
    this.variants.clear();

    const featureMappings = this.getFeatureMappings(); // Get mappings

    combinations.forEach(combination => {
      this.variants.push(this.createVariantFormGroup(combination, featureMappings)); // Pass mappings
    });

    this.variantsCreated = true;
    this.updateButtonText();
  }

  private getFeatureMappings(): { featureId: string, valueId: string, valueName: string }[][] {
    return this.featureFormArray.controls.map(control => {
        const featureId = this.getControl(control, 'featureId').value;
        return (this.getControl(control, 'selectedValues').value as string[]).map(valueId => {
            const value = this.featureValues[featureId]?.find(v => v.id === valueId);
            return {
                featureId: featureId,
                valueId: valueId,
                valueName: value?.name || 'Unknown'
            };
        });
    }).filter(group => group.length > 0);
  }


  private createVariantFormGroup(combination: { featureId: string, valueId: string, valueName: string }[], featureMappings: any): FormGroup {
    const combinationName = combination.map(c => c.valueName).join(' - ');
    return this.fb.group({
        selected: [false],
        combination: [combinationName], // Display name
        combinationDetails: [combination], // Store detailed mapping
        price: [0, [Validators.required, Validators.min(0)]],
        stock: [-1, [Validators.required, Validators.min(-1)]],
        sku: ['', Validators.required],
        title: [''],
        description: [''],
        images: [[]],
        showcaseImageIndex: [null] // Default to null
    });
  }


  removeVariant(index: number) {
    this.variants.removeAt(index);
    this.updateVariantsState();
  }

  removeSelectedVariants() {
    for (let i = this.variants.length - 1; i >= 0; i--) {
      if (this.getControl(this.variants.at(i), 'selected').value) {
        this.variants.removeAt(i);
      }
    }
    this.updateVariantsState();
  }

  toggleAllSelection() {
    this.allSelected = !this.allSelected;
    this.variants.controls.forEach(control => {
      this.getControl(control, 'selected').setValue(this.allSelected);
    });
  }

  updateAllSelected() {
    this.allSelected = this.variants.controls.every(control =>
      this.getControl(control, 'selected').value
    );
  }

  updateSelectedVariants(event: Event, field: string, index: number) {
    const value = (event.target as HTMLInputElement).value;
    const currentVariant = this.variants.at(index);

    if (!this.getControl(currentVariant, 'selected').value) {
      return;
    }

    this.variants.controls.forEach((control, i) => {
      if (i !== index && this.getControl(control, 'selected').value) {
        this.getControl(control, field).setValue(value);
      }
    });
  }

  private generateCombinations(): { featureId: string, valueId: string, valueName: string }[][] {
    const selectedValuesGrouped = this.featureFormArray.controls.map(control => {
        const featureId = this.getControl(control, 'featureId').value;
        const selectedValueIds = this.getControl(control, 'selectedValues').value as string[];
        return selectedValueIds.map(valueId => {
            const value = this.featureValues[featureId]?.find(v => v.id === valueId);
            return {
                featureId: featureId,
                valueId: valueId,
                valueName: value?.name || 'Unknown' // Fallback if value not found
            };
        });
    }).filter(group => group.length > 0); // Filter out features with no selected values

    return this.cartesianProduct(selectedValuesGrouped);
  }


  private cartesianProduct<T>(arrays: T[][]): T[][] {
    if (!arrays || arrays.length === 0) {
        return [[]]; // Return an array with an empty combination if input is empty
    }
    return arrays.reduce((a, b) =>
        a.flatMap(x => b.map(y => [...x, y])),
        [[]] as T[][]
    );
  }



  private updateVariantsState() {
    this.variantsCreated = this.variants.length > 0;
    this.updateButtonText();
    this.allSelected = false;
  }

  private updateButtonText() {
    this.buttonText = this.variants.length > 1 ? 'Ürünleri Ekle' : 'Ürünü Ekle';
  }

  getImageUrl(file: File): string {
    const fileId = `${file.name}-${file.lastModified}`;
    if (!this.imageUrls.has(fileId)) {
      const url = URL.createObjectURL(file);
      this.imageUrls.set(fileId, url);
    }
    return this.imageUrls.get(fileId);
  }

  async onSubmit() {
    // Mark all controls as touched to display validation errors
    this.productForm.markAllAsTouched();
    this.variants.controls.forEach(variant => (variant as FormGroup).markAllAsTouched());

    if (!this.productForm.valid || this.variants.controls.some(v => v.invalid)) {
      console.log("Form is invalid:", this.productForm.errors);
      this.variants.controls.forEach((v, i) => {
        if(v.invalid) console.log(`Variant ${i} is invalid:`, v.errors);
      });
      this.customToasterService.message('Lütfen tüm gerekli alanları doldurun ve varyant bilgilerini kontrol edin.', 'Hata', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return;
    }

    if (this.variants.length === 0) {
      this.customToasterService.message('En az bir varyant oluşturmalısınız.', 'Hata', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return;
    }

    try {
      this.loading = true;
      this.spinnerService.show(SpinnerType.BallSpinClockwise);
      this.productForm.disable(); // Disable form during submission

      const formData = new FormData();
      this.variants.controls.forEach((variant, index) => {
        this.appendVariantData(formData, variant, index);
      });

      await this.productService.createMultiple(
        formData,
        () => { // Success Callback
          this.loading = false;
          this.spinnerService.hide();
          this.productForm.enable(); // Re-enable form

          // More robust form reset
          this.resetForm();

          this.customToasterService.message('Ürünler başarıyla oluşturuldu', 'Başarılı', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
        },
        (error) => { // Error Callback
          this.loading = false;
          this.spinnerService.hide();
          this.productForm.enable(); // Re-enable form on error

          console.error("Product creation error:", error);
          // Try to parse backend error message if available
          let errorMessage = 'Ürün oluşturulamadı. Lütfen tekrar deneyin.';
          if (error && typeof error === 'string') {
              errorMessage = error; // Use string error directly
          } 

          this.customToasterService.message(
            errorMessage,
            'Hata',
            {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight,
              
            }
          );
        }
      );
    } catch (error) { // Catch synchronous errors or errors from the promise itself
      this.loading = false;
      this.spinnerService.hide();
      this.productForm.enable(); // Re-enable form

      console.error("Unexpected error during submission:", error);
      this.customToasterService.message(
        'Beklenmedik bir hata oluştu.',
        'Hata',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    }
  }


  private appendVariantData(formData: FormData, variant: AbstractControl, index: number) {
    const baseData = {
      name: this.productForm.get('name').value, // Use base name
      description: this.getControl(variant, 'description').value || '', // Ensure string
      title: this.getControl(variant, 'title').value || '', // Ensure string
      categoryId: this.productForm.get('categoryId').value,
      brandId: this.productForm.get('brandId').value,
      sku: this.getControl(variant, 'sku').value,
      price: this.getControl(variant, 'price').value,
      stock: this.getControl(variant, 'stock').value,
      tax: this.productForm.get('tax').value || 0, // Default tax if null/undefined
      // Send showcaseImageIndex only if it's not null
      ...(this.getControl(variant, 'showcaseImageIndex').value !== null && { showcaseImageIndex: this.getControl(variant, 'showcaseImageIndex').value })
    };
    if (this.productForm.get('existingVaryantGroup').value && 
      this.productForm.get('varyantGroupId').value) {
        baseData['varyantGroupID'] = this.productForm.get('varyantGroupId').value;
      }

    Object.entries(baseData).forEach(([key, value]) => {
      // Ensure value is not null/undefined before appending
      if (value !== null && value !== undefined) {
         // Handle potential boolean values if needed in the future
         if (typeof value === 'boolean') {
            formData.append(`Products[${index}].${key}`, value.toString());
         } else {
            formData.append(`Products[${index}].${key}`, value);
         }
      }
    });


    this.appendFeatureData(formData, variant, index);

    const images = this.getControl(variant, 'images').value as File[];
    if (images && images.length > 0) {
      images.forEach((image: File) => {
        formData.append(`Products[${index}].ProductImages`, image, image.name);
      });
    }
  }


  private appendFeatureData(formData: FormData, variant: AbstractControl, index: number) {
    const combinationDetails = this.getControl(variant, 'combinationDetails').value as { featureId: string, valueId: string }[];

    if (combinationDetails && combinationDetails.length > 0) {
      combinationDetails.forEach((detail, featureIndex) => {
          if (detail.featureId && detail.valueId) { // Ensure both IDs exist
              formData.append(`Products[${index}].FeatureIds[${featureIndex}]`, detail.featureId);
              formData.append(`Products[${index}].FeatureValueIds[${featureIndex}]`, detail.valueId);
          }
      });
    }
  }

  private handleSuccess(message: string) {
    this.customToasterService.message(message, 'Başarılı', {
      toastrMessageType: ToastrMessageType.Success,
      position: ToastrPosition.TopRight
    });
    this.resetForm();
  }

  private handleError(message: string, error: any) {
    console.error('Error:', error);
    this.customToasterService.message(message, 'Hata', {
      toastrMessageType: ToastrMessageType.Error,
      position: ToastrPosition.TopRight
    });
  }

  private resetForm() {
    // Reset the main form group, keeping category/brand if desired or resetting fully
    this.productForm.reset({
        name: '',
        brandId: '', // Reset brand or keep it based on workflow
        brandSearch: '',
        categoryId: '', // Reset category or keep it
        categorySearch: '',
        tax: 0
        // Don't reset arrays here, clear them below
    });

    // Clear FormArrays explicitly
    this.featureFormArray.clear();
    this.variants.clear();

    // Reset state variables
    this.variantsCreated = false;
    this.canGenerateVariants = false;
    this.allSelected = false;
    this.features = []; // Clear loaded features for the category
    this.featureValues = {}; // Clear loaded feature values
    this.filteredBrands = [];
    this.showBrandResults = false;
    this.showCategoryTree = false; // Ensure category tree is hidden

    // Reset image preview URLs
    this.imageUrls.forEach(url => URL.revokeObjectURL(url));
    this.imageUrls.clear();

    // Trigger change detection if needed, though reset usually does
    this.changeDetectorRef.detectChanges();
  }


  ngOnDestroy() {
    this.brandSearchSubject.complete();
    // Clean up object URLs
    this.imageUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.imageUrls.clear();
  }

  getControlValue(variant: AbstractControl, controlName: string): any {
    return this.getControl(variant, controlName).value;
  }

  hasSelectedVariants(): boolean {
    return this.variants.controls.some(v => this.getControlValue(v, 'selected'));
  }

  getVariantCombination(variant: AbstractControl): string {
    return this.getControlValue(variant, 'combination');
  }

  getVariantImages(variant: AbstractControl): File[] {
    return this.getControlValue(variant, 'images');
  }

  isVariantSelected(variant: AbstractControl): boolean {
    return this.getControlValue(variant, 'selected');
  }

  // Form kontrol yapılandırıcılar
  setupVariantControl(variant: AbstractControl, controlName: string): FormControl {
    return this.getControl(variant, controlName);
  }

  // Event handler'lar
  handleVariantInputChange(event: Event, field: string, index: number): void {
    this.updateSelectedVariants(event, field, index);
  }

  handleCheckboxChange(variant: AbstractControl): void {
    this.updateAllSelected();
  }

  onFeatureChange(index: number): void {
    const feature = this.featureFormArray.at(index);
    feature.patchValue({ selectedValues: [] }); // Seçili değerleri sıfırla
    this.updateCanGenerateVariants();
    this.variantsCreated = false; // Reset variants flag
    this.variants.clear(); // Clear variants if features change significantly
    this.updateButtonText();
}


onFeatureSelect(event: Event, index: number) {
  const select = event.target as HTMLSelectElement;
  const featureId = select.value;

  // Seçilen özelliğin değerlerini temizle
  const feature = this.featureFormArray.at(index);
  feature.patchValue({ selectedValues: [] }); // Reset selected values

  // Reset variants if feature changes
  this.variantsCreated = false;
  this.variants.clear();
  this.updateCanGenerateVariants();
  this.updateButtonText();

  // Değişiklikleri tetikle
  this.changeDetectorRef.detectChanges();
}


isValueSelected(feature: AbstractControl, valueId: string): boolean {
  const selectedValues = feature.get('selectedValues').value as string[];
  return selectedValues.includes(valueId);
}

toggleFeatureValue(feature: AbstractControl, valueId: string) {
  const selectedValues = [...feature.get('selectedValues').value] as string[];
  const index = selectedValues.indexOf(valueId);

  if (index === -1) {
    selectedValues.push(valueId);
  } else {
    selectedValues.splice(index, 1);
  }

  feature.patchValue({ selectedValues });
  // Reset variants if values change
  this.variantsCreated = false;
  this.variants.clear();
  this.updateCanGenerateVariants();
  this.updateButtonText();
  this.changeDetectorRef.detectChanges();
}


// Varyant oluşturma butonunun aktifliğini kontrol et
private updateCanGenerateVariants(): void {
    this.canGenerateVariants = this.featureFormArray.length > 0 &&
        this.featureFormArray.controls.every(control => {
            const featureId = control.get('featureId').value;
            const selectedValues = control.get('selectedValues').value;
            // Ensure a feature is selected AND at least one value is selected for it
            return featureId && Array.isArray(selectedValues) && selectedValues.length > 0;
        });
}


openImageUploadDialog(variant: AbstractControl): void {
  this.dialogService.openDialog({
    componentType: FileUploadDialogComponent,
    data: { options: { accept: '.png, .jpg, .jpeg, .gif, .avif, .webp' } },
    options: {
      width: '500px'
    },
    afterClosed: (result: File[]) => {
      if (result && result.length > 0) {
        const currentImages = [...this.getControl(variant, 'images').value];
        const newImages = result.filter(file => this.isValidImageFile(file)); // Filter valid images

        currentImages.push(...newImages); // Add only new, valid images
        this.getControl(variant, 'images').setValue(currentImages);

        // --- REMOVED AUTOMATIC SHOWCASE SETTING ---
        // if (currentImages.length === newImages.length && // Check if these are the *first* images added
        //     this.getControl(variant, 'showcaseImageIndex').value === null) {
        //   this.getControl(variant, 'showcaseImageIndex').setValue(0); // Don't automatically set showcase
        // }
        // --- END REMOVED BLOCK ---

        this.changeDetectorRef.detectChanges(); // Ensure view updates
      }
    }
  });
}


// Resim geçerlilik kontrolü
private isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  return validTypes.includes(file.type) && file.size <= maxSize;
}

// Showcase image ayarlama
setShowcaseImage(variant: AbstractControl, imageIndex: number): void {
  const currentShowcaseIndex = this.getControl(variant, 'showcaseImageIndex').value;
  // If the clicked image is already the showcase, deselect it (set to null)
  // Otherwise, select the clicked image.
  this.getControl(variant, 'showcaseImageIndex')
    .setValue(currentShowcaseIndex === imageIndex ? null : imageIndex);
  this.changeDetectorRef.detectChanges(); // Update view
}


// Resim önizleme URL'i oluşturma (Use SafeUrlPipe in template)
// getImagePreviewUrl(file: File): string {
//   return URL.createObjectURL(file); // Keep URL creation logic if needed elsewhere, but prefer pipe
// }

// Resim silme
removeImage(variant: AbstractControl, imageIndex: number): void {
  const images = [...this.getControl(variant, 'images').value];
  const removedFile = images.splice(imageIndex, 1)[0]; // Remove and get the file

  // Clean up Object URL if using the map
  const fileId = `${removedFile.name}-${removedFile.lastModified}`;
  if (this.imageUrls.has(fileId)) {
      URL.revokeObjectURL(this.imageUrls.get(fileId));
      this.imageUrls.delete(fileId);
  }

  this.getControl(variant, 'images').setValue(images);

  // Silinen resim showcase ise, showcase'i sıfırla
  const showcaseIndex = this.getControl(variant, 'showcaseImageIndex').value;
  if (showcaseIndex === imageIndex) {
    // If the deleted image was the showcase, reset showcase to null
    this.getControl(variant, 'showcaseImageIndex').setValue(null);
  } else if (showcaseIndex !== null && showcaseIndex > imageIndex) {
    // If a showcase exists and it was after the deleted image, decrement its index
    this.getControl(variant, 'showcaseImageIndex').setValue(showcaseIndex - 1);
  }
  // If showcase was before the deleted image, its index remains correct.

  this.changeDetectorRef.detectChanges(); // Update view
}

onImageDrop(variant: AbstractControl, event: CdkDragDrop<File[]>) {
  const images = [...this.getControl(variant, 'images').value];
  const currentShowcaseIndex = this.getControl(variant, 'showcaseImageIndex').value;
  const previousIndex = event.previousIndex;
  const currentIndex = event.currentIndex;

  // Perform the array move
  moveItemInArray(images, previousIndex, currentIndex);
  this.getControl(variant, 'images').setValue(images);

  // Update showcase index if it was affected by the move
  if (currentShowcaseIndex !== null) {
    if (currentShowcaseIndex === previousIndex) {
      // If the showcase image itself was moved, update its index
      this.getControl(variant, 'showcaseImageIndex').setValue(currentIndex);
    } else if (currentShowcaseIndex > previousIndex && currentShowcaseIndex <= currentIndex) {
      // If an item was moved from *before* the showcase to *at or after* the showcase's original position
      this.getControl(variant, 'showcaseImageIndex').setValue(currentShowcaseIndex - 1);
    } else if (currentShowcaseIndex < previousIndex && currentShowcaseIndex >= currentIndex) {
      // If an item was moved from *after* the showcase to *at or before* the showcase's original position
      this.getControl(variant, 'showcaseImageIndex').setValue(currentShowcaseIndex + 1);
    }
    // Otherwise, the showcase index remains correct relative to the other images
  }
  this.changeDetectorRef.detectChanges(); // Update view
}


openDescriptionEditor(variant: AbstractControl, index: number): void {
  const dialogRef = this.dialogService.openDialog({
    componentType: DescriptionEditorDialogComponent,
    data: { description: this.getControl(variant, 'description').value || '' },
    options: {
      width: '1200px',
      height: '600px'  // minHeight yerine height kullanıyoruz
    },
    afterClosed: result => {
      if (result !== undefined) {
        this.getControl(variant, 'description').setValue(result);
        // Update other selected variants if needed
        this.updateSelectedVariantsValue('description', result, index);
      }
    }
  });
}

// Yeni metod ekleyelim
updateSelectedVariantsValue(field: string, value: any, currentIndex: number): void {
  // Check if the *current* variant is selected before propagating
  if (!this.getControl(this.variants.at(currentIndex), 'selected').value) {
      return; // Don't propagate if the source variant isn't selected
  }

  this.variants.controls.forEach((control, i) => {
      // Propagate only to *other* selected variants
      if (i !== currentIndex && this.getControl(control, 'selected').value) {
          this.getControl(control, field).setValue(value);
      }
  });
}
}