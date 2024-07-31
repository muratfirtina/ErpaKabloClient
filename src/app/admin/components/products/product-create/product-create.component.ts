import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
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
import { ProductCreate } from 'src/app/contracts/product/product-create';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
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
import { ProductImageDialogComponent } from 'src/app/dialogs/product-image-dialog/product-image-dialog.component';
import { SafeUrlPipe } from 'src/app/pipes/safeUrl.pipe';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatRadioModule } from '@angular/material/radio';

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
    SafeUrlPipe
  ],
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss', '../../../../../styles.scss']
})
export class ProductCreateComponent extends BaseComponent implements OnInit {
  productForm: FormGroup;
  features: Feature[] = [];
  featureValues: { [key: string]: Featurevalue[] } = {};
  variantColumns: string[] = ['select', 'images', 'combination', 'price', 'stock', 'sku', 'actions'];
  variantIds: string[] = [];
  allSelected = false;
  variantsCreated: boolean = false;
  canGenerateVariants: boolean = false
  buttonText: string = 'Ürünü Ekle';
  dataSource: MatTableDataSource<any>;

  categories: Category[] = [];
  filteredCategories: Category[] = [];
  brands: Brand[] = [];
  filteredBrands: Brand[] = [];
  private brandSearchSubject = new Subject<string>();

  private _transformer = (node: Category, level: number): FlatNode => {
    return {
      expandable: !!node.subCategories && node.subCategories.length > 0,
      name: node.name,
      level: level,
      id: node.id,
      parentCategoryId: node.parentCategoryId
    };
  };

  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.subCategories
  );

  hasChild = (_: number, node: FlatNode) => node.expandable;

  categorydataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Ürün açıklamasını girin',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [
      
    ],
    customClasses: [
      {
        name: "quote",
        class: "quote",
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: "titleText",
        class: "titleText",
        tag: "h1",
      },
    ]
  };

  currentImageIndex: { [key: string]: number } = {};
  @ViewChild('carouselContainer') carouselContainer: ElementRef;

  
  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private featureService: FeatureService,
    private brandService: BrandService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private customToastrService: CustomToastrService,
    private changeDetectorRef: ChangeDetectorRef,
    private dialogService: DialogService,
    private safeUrlPipe: SafeUrlPipe,
    private sanitizer: DomSanitizer,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
    this.createForm();

   

    this.brandSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchBrands(searchTerm);
    });
  }

  createForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required],
      brandId: ['', Validators.required],
      categorySearch: [''],
      brandSearch: [''],
      varyantGroupID: [''],
      tax: [0, [Validators.required, Validators.min(0)]],
      features: this.fb.array([]),
      variants: this.fb.array([])
    });
    this.buttonText = 'Ürünü Ekle';
  }

  async ngOnInit() {
    this.productForm.get('features').valueChanges.subscribe(() => {
      this.canGenerateVariants = this.featureFormArray.length > 0 && 
        this.featureFormArray.controls.every(control => 
          control.get('featureId').value && 
          control.get('selectedValues').value.length > 0
        );
      this.variantsCreated = false;
    });

    await this.loadCategories();
    this.productForm.get('categorySearch').valueChanges.subscribe(value => {
      this.filterCategories(value);
    });


    this.productForm.get('brandSearch').valueChanges.subscribe(value => {
      this.brandSearchSubject.next(value);
    });

    this.updateDataSource();
    this.initializeImageIndexes();
  }

  async loadCategories() {
    try {
      const data = await this.categoryService.list({ pageIndex: -1, pageSize: -1 });
      this.categories = data.items;
      const hierarchicalCategories = this.createHierarchy(this.categories);
      this.categorydataSource.data = hierarchicalCategories;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error loading categories:', error);
      this.customToastrService.message("Kategoriler yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
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

  //hasChild = (_: number, node: Category) => !!node.subCategories && node.subCategories.length > 0;
  filterCategories(searchTerm: string) {
    if (!searchTerm) {
      this.categorydataSource.data = this.createHierarchy(this.categories);
      this.treeControl.expandAll();
      return;
    }
    
    const filterTree = (categories: Category[]): Category[] => {
      return categories.reduce((acc, category) => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
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
  
    const filteredCategories = filterTree(this.categories);
    this.categorydataSource.data = this.createHierarchy(filteredCategories);
    this.treeControl.expandAll();
    this.changeDetectorRef.detectChanges();
  }

  onCategorySelected(node: FlatNode) {
    this.productForm.patchValue({
      categoryId: node.id,
      categorySearch: node.name
    });
    this.loadCategoryFeatures(node.id);
  }

  async searchBrands(searchTerm: string) {
    if (searchTerm.length < 2) {
      this.filteredBrands = [];
      return;
    }

    const dynamicQuery = {
      filter: {
        field: 'name',
        operator: 'contains',
        value: searchTerm
      }
    };

    try {
      const response = await this.brandService.getBrandsByDynamicQuery(dynamicQuery, { pageIndex: 0, pageSize: 10 });
      this.filteredBrands = response.items;
    } catch (error) {
      console.error('Error searching brands:', error);
      this.customToastrService.message("Marka araması başarısız", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }


  onBrandSelected(brand: Brand) {
    this.productForm.patchValue({
      brandId: brand.id,
      brandSearch: brand.name
    });
  }

  loadCategoryFeatures(categoryId: string) {
    this.features = [];
    this.featureValues = {};
    this.featureFormArray.clear();
    this.variants.clear();
    this.variantsCreated = false;
    this.canGenerateVariants = false;
    this.buttonText = 'Ürünü Ekle'; 
    this.categoryService.getById(categoryId).then(
      (category) => {
        this.features = category.features;
        this.features.forEach(feature => {
          this.loadFeatureValues(feature.id);
        });
      },
      (error) => this.snackBar.open('Kategori özellikleri yüklenemedi: ' + error, 'Kapat', { duration: 3000 })
    );
  }
  loadFeatureValues(featureId: string) {
    this.featureService.getById(featureId).then(
      (feature) => {
        this.featureValues[featureId] = feature.featureValues;
      },
      (error) => console.error('Error loading feature values:', error)
    );
  }

  get featureFormArray() {
    return this.productForm.get('features') as FormArray;
  }

  get variants() {
    return this.productForm.get('variants') as FormArray;
  }

  addFeature() {
    this.featureFormArray.push(this.createFeatureFormGroup());
    this.variantsCreated = false;
    this.updateCanGenerateVariants();
  }

  removeFeature(index: number) {
    this.featureFormArray.removeAt(index);
    this.variantsCreated = false;
    this.updateCanGenerateVariants();
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
    this.updateDataSource();
    this.updateVariantsState();
  }

  removeSelectedVariants() {
    for (let i = this.variants.length - 1; i >= 0; i--) {
      if (this.variants.at(i).get('selected').value) {
        this.variants.removeAt(i);
      }
    }
    this.updateDataSource();
    this.updateVariantsState();
  }

  updateDataSource() {
    this.dataSource = new MatTableDataSource(this.variants.controls);
    this.changeDetectorRef.detectChanges();
  }

  updateVariantsState() {
    this.variantsCreated = this.variants.length > 0;
    this.updateAllSelected();
    this.updateButtonText();
  }

  updateButtonText() {
    this.buttonText = this.variants.length > 1 ? 'Ürünleri Ekle' : 'Ürünü Ekle';
  }

  toggleAllSelection() {
    this.allSelected = !this.allSelected;
    this.variants.controls.forEach(control => {
      control.get('selected').setValue(this.allSelected);
    });
  }

  updateAllSelected() {
    this.allSelected = this.variants.controls.every(control => control.get('selected').value);
  }

  updateSelectedVariants(event: any, field: string, index: number) {
    const value = event.target.value;
    const currentVariant = this.variants.at(index);
    
    // Eğer değişiklik yapılan varyant seçili değilse, hiçbir şey yapma
    if (!currentVariant.get('selected').value) {
      return;
    }

    this.variants.controls.forEach((control, i) => {
      if (i !== index && control.get('selected').value) {
        control.get(field).setValue(value);
      }
    });

    // Veri kaynağını güncelle
    this.updateDataSource();
  }

  updateCanGenerateVariants() {
    this.canGenerateVariants = this.featureFormArray.length > 0 && 
      this.featureFormArray.controls.every(control => 
        control.get('featureId').value && 
        control.get('selectedValues').value.length > 0
      );
  }
  createFeatureFormGroup(): FormGroup {
    return this.fb.group({
      featureId: ['', Validators.required],
      selectedValues: [[], Validators.required]
    });
  }

  generateVariants() {
    const combinations = this.generateCombinations();
    
    // Mevcut varyantların değerlerini saklayalım
    const existingVariants = this.variants.controls.map(control => ({
      combination: control.get('combination').value,
      sku: control.get('sku').value,
      price: control.get('price').value,
      stock: control.get('stock').value,
      images: [[]],
      showcaseImageIndex: control.get('showcaseImageIndex').value

    }));

    this.variants.clear();
    combinations.forEach((combination) => {
      const combinationString = combination.join(' - ');
      const existingVariant = existingVariants.find(v => v.combination === combinationString);
      
      this.variants.push(this.fb.group({
        selected: [false],
        combination: [combinationString],
        price: [existingVariant ? existingVariant.price : 0, [Validators.required, Validators.min(0)]],
        stock: [existingVariant ? existingVariant.stock : 0, [Validators.required, Validators.min(0)]],
        sku: [existingVariant ? existingVariant.sku : '', Validators.required],
        images: [[]],
        showcaseImageIndex: [existingVariant ? existingVariant.showcaseImageIndex : 0]
      }));
    });

    this.variantsCreated = true;
    this.updateButtonText();
    this.updateDataSource();
  }

  openImageUploadDialog(variant: FormGroup, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dialogService.openDialog({
      componentType: FileUploadDialogComponent,
      data: { variant: variant },
      options: { width: '550px' },
      afterClosed: (result: File[]) => {
        if (result && result.length > 0) {
          const currentImages = variant.get('images').value || [];
          variant.patchValue({ images: [...currentImages, ...result] });
          this.initializeImageIndexes(); // Yeni resimler eklendiğinde indeksleri güncelle

          if (variant.get('showcaseImageIndex').value === null || variant.get('showcaseImageIndex').value === undefined) {
            variant.patchValue({ showcaseImageIndex: 0 });
          }
        }
      }
    });
  }

  setShowcaseImage(variant: FormGroup, index: number) {
    const currentShowcaseIndex = variant.get('showcaseImageIndex').value;
    
    if (currentShowcaseIndex === index) {
      // Eğer tıklanan görsel zaten vitrin görseli ise, vitrin görselini kaldır
      variant.patchValue({ showcaseImageIndex: null });
    } else {
      // Değilse, yeni vitrin görselini ayarla
      variant.patchValue({ showcaseImageIndex: index });
    }
    
    // Değişiklikleri yansıtmak için Angular'ın değişiklik algılama mekanizmasını tetikle
    this.changeDetectorRef.detectChanges();
  }
  
  isShowcaseImage(variant: FormGroup, index: number): boolean {
    return variant.get('showcaseImageIndex').value === index;
  }

  generateUniqueId(): string {
    // Basit bir benzersiz ID oluşturma fonksiyonu
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  initializeImageIndexes() {
    (this.productForm.get('variants') as FormArray).controls.forEach((variant: FormGroup, index: number) => {
      // Her varyant için benzersiz bir ID oluştur veya mevcut olanı kullan
      if (!this.variantIds[index]) {
        this.variantIds[index] = this.generateUniqueId();
      }
      // Bu benzersiz ID'yi kullanarak image index'ini set et
      this.currentImageIndex[this.variantIds[index]] = 0;
    });
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  prevImage(variant: FormGroup, event: Event, index: number) {
    event.preventDefault();
    event.stopPropagation();
    const variantId = this.variantIds[index];
    if (this.currentImageIndex[variantId] > 0) {
      this.currentImageIndex[variantId]--;
    }
  }

  nextImage(variant: FormGroup, event: Event, index: number) {
    event.preventDefault();
    event.stopPropagation();
    const variantId = this.variantIds[index];
    const images = variant.get('images').value;
    if (this.currentImageIndex[variantId] < images.length - 1) {
      this.currentImageIndex[variantId]++;
    }
  }

  removeCurrentImage(variant: FormGroup, event: Event, index: number) {
    event.preventDefault();
    event.stopPropagation();
    const variantId = this.variantIds[index];
    const images = variant.get('images').value;
    const showcaseIndex = variant.get('showcaseImageIndex').value;
    images.splice(this.currentImageIndex[variantId], 1);
    variant.patchValue({ images: images });
    if (this.currentImageIndex[variantId] >= images.length) {
      this.currentImageIndex[variantId] = Math.max(0, images.length - 1);
    }

    if (showcaseIndex === this.currentImageIndex[variantId]) {
      variant.patchValue({ showcaseImageIndex: images.length > 0 ? 0 : null });
    } else if (showcaseIndex > this.currentImageIndex[variantId]) {
      variant.patchValue({ showcaseImageIndex: showcaseIndex - 1 });
    }
  }

  generateCombinations(): string[][] {
    const selectedValues = this.featureFormArray.controls.map(control => 
      control.get('selectedValues').value.map(valueId => 
        this.featureValues[control.get('featureId').value].find(v => v.id === valueId).name
      )
    ).filter(values => values.length > 0); // Boş seçimleri filtrele
    return this.cartesianProduct(selectedValues);
  }

  cartesianProduct(arrays: string[][]): string[][] {
    return arrays.reduce((a, b) => 
      a.flatMap(x => b.map(y => [...x, y])),
      [[]] as string[][]
    );
  }

  onSubmit() {
    if (this.productForm.valid) {
      const formData = new FormData();
  
      this.variants.controls.forEach((variant, index) => {
        formData.append(`Products[${index}].Name`, this.productForm.get('name').value);
        formData.append(`Products[${index}].Description`, this.productForm.get('description').value);
        formData.append(`Products[${index}].CategoryId`, this.productForm.get('categoryId').value);
        formData.append(`Products[${index}].BrandId`, this.productForm.get('brandId').value);
        formData.append(`Products[${index}].Sku`, variant.get('sku').value);
        formData.append(`Products[${index}].Price`, variant.get('price').value);
        formData.append(`Products[${index}].Stock`, variant.get('stock').value);
        formData.append(`Products[${index}].Tax`, this.productForm.get('tax').value);
        formData.append(`Products[${index}].VaryantGroupID`, this.productForm.get('varyantGroupID').value);
        formData.append(`Products[${index}].ShowcaseImageIndex`, variant.get('showcaseImageIndex').value);

  
        this.featureFormArray.controls.forEach((feature, featureIndex) => {
          formData.append(`Products[${index}].FeatureIds[${featureIndex}]`, feature.get('featureId').value);
        });
  
        const featureValueIds = variant.get('combination').value.split(' - ').map((value, valueIndex) => {
          const featureId = this.featureFormArray.at(valueIndex).get('featureId').value;
          const featureValues = this.featureValues[featureId] || [];
          return featureValues.find(fv => fv.name === value)?.id || '';
        });
  
        featureValueIds.forEach((valueId, valueIndex) => {
          formData.append(`Products[${index}].FeatureValueIds[${valueIndex}]`, valueId);
        });
  
        const images = variant.get('images').value;
        if (images && images.length > 0) {
          images.forEach((image, imageIndex) => {
            if (image instanceof File) {
              formData.append(`Products[${index}].ProductImages`, image, image.name);
            }
          });
        }
      });
  
      this.productService.createMultiple(formData,
        () => {
          console.log('Success: Products created');
          this.snackBar.open('Ürünler başarıyla oluşturuldu', 'Kapat', { duration: 3000 });
        },
        (error) => {
          console.error('Error:', error);
          this.snackBar.open('Ürünler oluşturulamadı: ' + JSON.stringify(error), 'Kapat', { duration: 3000 });
        }
      );
    } else {
      console.log('Form is invalid');
      this.snackBar.open('Lütfen tüm gerekli alanları doldurun', 'Kapat', { duration: 3000 });
    }
  }
}