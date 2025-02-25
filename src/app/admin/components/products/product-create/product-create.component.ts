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
    private dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef,
    private cdr: ChangeDetectorRef
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
    this.cdr.detectChanges(); // Değişiklikleri tetikle
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
    
    combinations.forEach(combination => {
      this.variants.push(this.createVariantFormGroup(combination.join(' - ')));
    });

    this.variantsCreated = true;
    this.updateButtonText();
  }

  private createVariantFormGroup(combination: string): FormGroup {
    return this.fb.group({
      selected: [false],
      combination: [combination],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: ['', Validators.required],
      title: [''],
      description: [''],
      images: [[]],
      showcaseImageIndex: [null]
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

  private generateCombinations(): string[][] {
    const selectedValues = this.featureFormArray.controls.map(control => 
      this.getControl(control, 'selectedValues').value.map(valueId => 
        this.featureValues[this.getControl(control, 'featureId').value]
          .find(v => v.id === valueId).name
      )
    ).filter(values => values.length > 0);

    return this.cartesianProduct(selectedValues);
  }

  private cartesianProduct(arrays: string[][]): string[][] {
    return arrays.reduce((a, b) => 
      a.flatMap(x => b.map(y => [...x, y])),
      [[]] as string[][]
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
    if (!this.productForm.valid) {
      this.customToasterService.message('Lütfen tüm gerekli alanları doldurun', 'Hata', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return;
    }
  
    try {
      this.loading = true;
      this.spinnerService.show(SpinnerType.BallSpinClockwise);
      this.productForm.disable();
  
      const formData = new FormData();
      this.variants.controls.forEach((variant, index) => {
        this.appendVariantData(formData, variant, index);
      });
  
      await this.productService.createMultiple(
        formData,
        () => {
          this.loading = false;
          this.spinnerService.hide();
          this.productForm.enable();
  
          // Form temizleme işlemleri
          this.productForm.patchValue({ name: '' });
          while (this.featureFormArray.length > 0) {
            this.featureFormArray.removeAt(0);
          }
          this.variants.clear();
          this.variantsCreated = false;
          this.canGenerateVariants = false;
          this.allSelected = false;
  
          // Başarı mesajını göster
          this.customToasterService.message('Ürünler başarıyla oluşturuldu', 'Başarılı', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
        },
        (error) => {
          this.loading = false;
          this.spinnerService.hide();
          this.productForm.enable();
          
          this.customToasterService.message(
            'Ürün oluşturulamadı',
            'Hata',
            {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight
            }
          );
        }
      );
    } catch (error) {
      this.loading = false;
      this.spinnerService.hide();
      this.productForm.enable();
      
      this.customToasterService.message(
        error?.message || 'Bir hata oluştu',
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
      name: this.productForm.get('name').value,
      description: this.getControl(variant, 'description').value,
      title: this.getControl(variant, 'title').value,
      categoryId: this.productForm.get('categoryId').value,
      brandId: this.productForm.get('brandId').value,
      sku: this.getControl(variant, 'sku').value,
      price: this.getControl(variant, 'price').value,
      stock: this.getControl(variant, 'stock').value,
      tax: this.productForm.get('tax').value,
      showcaseImageIndex: this.getControl(variant, 'showcaseImageIndex').value
    };

    Object.entries(baseData).forEach(([key, value]) => {
      formData.append(`Products[${index}].${key}`, value);
    });

    this.appendFeatureData(formData, variant, index);

    const images = this.getControl(variant, 'images').value;
    images.forEach((image: File) => {
      formData.append(`Products[${index}].ProductImages`, image, image.name);
    });
  }

  private appendFeatureData(formData: FormData, variant: AbstractControl, index: number) {
    const combination = this.getControl(variant, 'combination').value.split(' - ');
    
    this.featureFormArray.controls.forEach((feature, featureIndex) => {
      const featureId = this.getControl(feature, 'featureId').value;
      formData.append(`Products[${index}].FeatureIds[${featureIndex}]`, featureId);
      
      const featureValue = this.featureValues[featureId]
        .find(fv => fv.name === combination[featureIndex]);
      
      if (featureValue) {
        formData.append(`Products[${index}].FeatureValueIds[${featureIndex}]`, featureValue.id);
      }
    });
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
    this.createForm();
    this.variantsCreated = false;
    this.canGenerateVariants = false;
    this.allSelected = false;
    this.features = [];
    this.featureValues = {};
    this.filteredBrands = [];
    this.showBrandResults = false;
    this.showCategoryTree = false;
  }

  ngOnDestroy() {
    this.brandSearchSubject.complete();
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
}



onFeatureSelect(event: Event, index: number) {
  const select = event.target as HTMLSelectElement;
  const featureId = select.value;
  
  // Seçilen özelliğin değerlerini temizle
  const feature = this.featureFormArray.at(index);
  feature.patchValue({ selectedValues: [] });
  
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
  this.changeDetectorRef.detectChanges();
}


// Varyant oluşturma butonunun aktifliğini kontrol et
private updateCanGenerateVariants(): void {
    this.canGenerateVariants = this.featureFormArray.length > 0 && 
        this.featureFormArray.controls.every(control => {
            const featureId = control.get('featureId').value;
            const selectedValues = control.get('selectedValues').value;
            return featureId && selectedValues.length > 0;
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
        result.forEach(file => {
          if (this.isValidImageFile(file)) {
            currentImages.push(file);
          }
        });
        this.getControl(variant, 'images').setValue(currentImages);

        // İlk resim yüklendiğinde otomatik olarak showcase olarak ayarla
        if (currentImages.length === result.length && 
            this.getControl(variant, 'showcaseImageIndex').value === null) {
          this.getControl(variant, 'showcaseImageIndex').setValue(0);
        }
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
  this.getControl(variant, 'showcaseImageIndex')
    .setValue(currentShowcaseIndex === imageIndex ? null : imageIndex);
}

// Resim önizleme URL'i oluşturma
getImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

// Resim silme
removeImage(variant: AbstractControl, imageIndex: number): void {
  const images = [...this.getControl(variant, 'images').value];
  images.splice(imageIndex, 1);
  this.getControl(variant, 'images').setValue(images);

  // Silinen resim showcase ise, showcase'i sıfırla veya ilk resmi seç
  const showcaseIndex = this.getControl(variant, 'showcaseImageIndex').value;
  if (showcaseIndex === imageIndex) {
    this.getControl(variant, 'showcaseImageIndex').setValue(images.length > 0 ? 0 : null);
  } else if (showcaseIndex > imageIndex) {
    this.getControl(variant, 'showcaseImageIndex').setValue(showcaseIndex - 1);
  }
}
onImageDrop(variant: AbstractControl, event: CdkDragDrop<File[]>) {
  const images = [...this.getControl(variant, 'images').value];
  const showcaseIndex = this.getControl(variant, 'showcaseImageIndex').value;
  
  moveItemInArray(images, event.previousIndex, event.currentIndex);
  this.getControl(variant, 'images').setValue(images);

  // Showcase image indexini güncelle
  if (showcaseIndex === event.previousIndex) {
    this.getControl(variant, 'showcaseImageIndex').setValue(event.currentIndex);
  } else if (showcaseIndex > event.previousIndex && showcaseIndex <= event.currentIndex) {
    this.getControl(variant, 'showcaseImageIndex').setValue(showcaseIndex - 1);
  } else if (showcaseIndex < event.previousIndex && showcaseIndex >= event.currentIndex) {
    this.getControl(variant, 'showcaseImageIndex').setValue(showcaseIndex + 1);
  }
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
        // Event oluşturmak yerine direkt değeri güncelliyoruz
        this.updateSelectedVariantsValue('description', result, index);
      }
    }
  });
}

// Yeni metod ekleyelim
updateSelectedVariantsValue(field: string, value: any, currentIndex: number): void {
  if (!this.getControl(this.variants.at(currentIndex), 'selected').value) {
      return;
  }

  this.variants.controls.forEach((control, i) => {
      if (i !== currentIndex && this.getControl(control, 'selected').value) {
          this.getControl(control, field).setValue(value);
      }
  });
}

}