import { ChangeDetectorRef, Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularEditorConfig, AngularEditorModule, UploadResponse } from '@kolkov/angular-editor';
import { NgxFileDropModule } from 'ngx-file-drop';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { BrandService } from 'src/app/services/common/models/brand.service';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { DialogService } from 'src/app/services/common/dialog.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Brand } from 'src/app/contracts/brand/brand';
import { Category } from 'src/app/contracts/category/category';
import { Feature } from 'src/app/contracts/feature/feature';
import { Featurevalue } from 'src/app/contracts/featurevalue/featurevalue';
import { Product } from 'src/app/contracts/product/product';
import { FileUploadDialogComponent } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, from, map } from 'rxjs';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { MatButtonModule } from '@angular/material/button';
import { DescriptionEditorDialogComponent } from 'src/app/dialogs/description-editor-dialog/description-editor-dialog.component';

interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  id: string;
  parentCategoryId: string;
}

@Component({
  selector: 'app-product-update',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularEditorModule,
    NgxFileDropModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './product-update.component.html',
  styleUrls: ['./product-update.component.scss']
})
export class ProductUpdateComponent extends BaseComponent implements OnInit {
  productForm: FormGroup;
  productId: string;
  product: Product;
  categories: Category[] = [];
  brands: Brand[] = [];
  features: Feature[] = [];
  featureValues: { [key: string]: Featurevalue[] } = {};
  relatedProducts: any[] = [];
  displayedColumns: string[] = ['photo', 'name', 'price', 'stock', 'sku','title','categoryName', 'brandName', 'features'];
  defaultProductImage = 'assets/product/ecommerce-default-product.png';
  
  // Marka ve kategori arama için değişkenler
  filteredBrands: Brand[] = [];
  showBrandResults: boolean = false;
  showCategoryTree: boolean = false;
  private brandSearchSubject = new Subject<string>();
  
  // Kategori ağacı için değişkenler
  public treeControl: FlatTreeControl<FlatNode>;
  private treeFlattener: MatTreeFlattener<Category, FlatNode>;
  public categorydataSource: MatTreeFlatDataSource<Category, FlatNode>;
  
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '300px',
    minHeight: '200px',
    placeholder: 'Açıklama girin',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [
      ['bold']
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
    ],
    uploadWithCredentials: false,
    upload: (file: File): Observable<HttpEvent<UploadResponse>> => {
      const formData = new FormData();
      formData.append('image', file);
    
      return from(this.productService.uploadDescriptionImage(formData)).pipe(
        map(response => {
          if (response && response.url) {
            const imageUrl = response.url;
            
            return new HttpResponse({
              body: {
                imageUrl: imageUrl
              },
              status: 200,
              statusText: 'OK'
            });
          }
          throw new Error('Upload failed');
        })
      );
    }
  };
  

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private featureService: FeatureService,
    private dialogService: DialogService,
    private customToastrService: CustomToastrService,
    private changeDetectorRef: ChangeDetectorRef,
    spinner: SpinnerService
  ) {
    super(spinner);
    this.createForm();
    this.setupBrandSearch();
    
    // Kategori ağacı için tanımlamalar
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
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      this.loadProduct();
    });
    
    // Form değişikliklerini izleme
    this.productForm.valueChanges.subscribe(() => {
      // Formu dirty olarak işaretle
      this.productForm.markAsDirty();
    });
    
    // Angular editor için özel takip
    this.productForm.get('description').valueChanges.subscribe(value => {
      this.productForm.markAsDirty();
    });
  }

  public hasChild = (_: number, node: FlatNode): boolean => node.expandable;
  
  private _transformer = (node: Category, level: number): FlatNode => {
    return {
      expandable: !!node.subCategories && node.subCategories.length > 0,
      name: node.name,
      level: level,
      id: node.id,
      parentCategoryId: node.parentCategoryId
    };
  };
  
  public onCategorySelected(node: FlatNode): void {
    this.productForm.patchValue({
      categoryId: node.id,
      categorySearch: node.name
    });
    this.loadCategoryFeatures(node.id);
    this.showCategoryTree = false; // Seçim yapıldıktan sonra dropdown'ı kapat
  }
  
  private setupBrandSearch() {
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
      description: [''], // Validasyon yok
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      categorySearch: [''],
      brandId: ['', Validators.required],
      brandSearch: [''],
      varyantGroupID: [''], // Validasyon yok
      tax: [0], // Validasyon yok
      stock: [0], // Min validasyonu kaldırıldı
      price: [0], // Min validasyonu kaldırıldı
      sku: ['', Validators.required],
      productFeatureValues: this.fb.array([]),
      productImageFiles: this.fb.array([])
    });
  }

  get productFeatureValues() {
    return this.productForm.get('productFeatureValues') as FormArray;
  }

  get productImageFiles() {
    return this.productForm.get('productImageFiles') as FormArray;
  }

  // Güvenli özellik değerleri erişimi için helper metod
  getFeatureValues(featureId: string): Featurevalue[] {
    if (!featureId) return [];
    
    const values = this.featureValues[featureId];
    return values || [];
  }

  async loadProduct() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      const response = await this.productService.getById(this.productId, () => {}, () => {});
      this.product = response;
      this.relatedProducts = response.relatedProducts;
      
      // Önce kategori ve marka listelerini yükle
      await Promise.all([
        this.loadCategories(),
        this.loadBrands()
      ]);
      
      // Sonra ürünün formunu güncelle
      this.updateFormWithProductData();
      
      // En son özellikleri yükle
      await this.loadProductFeatures();
      
    } catch (error) {
      console.error('Ürün yükleme hatası:', error);
      this.customToastrService.message("Ürün yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  updateFormWithProductData() {
    const brandName = this.brands.find(b => b.id === this.product.brandId)?.name || '';
    const categoryName = this.categories.find(c => c.id === this.product.categoryId)?.name || '';
    
    this.productForm.patchValue({
      name: this.product.name,
      description: this.product.description,
      title: this.product.title,
      categoryId: this.product.categoryId,
      categorySearch: categoryName,
      brandId: this.product.brandId,
      brandSearch: brandName,
      varyantGroupID: this.product.varyantGroupID,
      tax: this.product.tax,
      stock: this.product.stock,
      price: this.product.price,
      sku: this.product.sku
    });
  
    // ProductFeatureValues güncelleme
    this.productFeatureValues.clear();
    this.product.productFeatureValues.forEach(featureValue => {
      this.productFeatureValues.push(this.fb.group({
        featureId: [featureValue.featureId],
        featureName: [featureValue.featureName],
        featureValueId: [featureValue.featureValueId],
        featureValueName: [featureValue.featureValueName]
      }));
    });
  
    // ProductImageFiles güncelleme
    this.productImageFiles.clear();
    this.product.productImageFiles.forEach(image => {
      this.productImageFiles.push(this.fb.group({
        id: [image.id],
        fileName: [image.fileName],
        path: [image.path],
        entityType: [image.entityType],
        storage: [image.storage],
        url: [image.url],
        showcase: [image.showcase]
      }));
    });

    if (!this.product.productImageFiles.some(image => image.showcase)) {
      this.setShowcaseImage(0);
    }
  
    // RelatedProducts güncelleme
    this.relatedProducts = this.product.relatedProducts;
    
    // Form değişiklik algılama durumunu sıfırla
    this.productForm.markAsPristine();
  }

  async loadCategories() {
    try {
      const data = await this.categoryService.list({ pageIndex: -1, pageSize: -1 });
      this.categories = data.items;
      const hierarchicalCategories = this.createHierarchy(this.categories);
      this.categorydataSource.data = hierarchicalCategories;
      
      // Tüm kategorileri kapat
      this.treeControl.collapseAll();
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error loading categories:', error);
      this.customToastrService.message("Kategoriler yüklenemedi", "Hata", {
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
    const brandContainer = document.querySelector('.brand-search-results');
    const brandInput = document.querySelector('#brandSearch');
    
    if (categoryContainer && categoryInput) {
      if (!categoryContainer.contains(event.target as Node) && 
          !categoryInput.contains(event.target as Node)) {
        this.showCategoryTree = false;
      }
    }
    
    if (brandContainer && brandInput) {
      if (!brandContainer.contains(event.target as Node) && 
          !brandInput.contains(event.target as Node)) {
        this.showBrandResults = false;
      }
    }
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
      this.showBrandResults = this.filteredBrands.length > 0;
    } catch (error) {
      console.error('Marka araması başarısız:', error);
    }
  }

  selectBrand(brand: Brand) {
    this.productForm.patchValue({
      brandId: brand.id,
      brandSearch: brand.name
    });
    this.showBrandResults = false;
  }

  async loadBrands() {
    try {
      const data = await this.brandService.list({ pageIndex: -1, pageSize: -1 });
      this.brands = data.items;
    } catch (error) {
      this.customToastrService.message("Markalar yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  async loadProductFeatures() {
    try {
      await this.loadCategoryFeatures(this.product.categoryId);
    } catch (error) {
      console.error('Ürün özellikleri yüklenemedi:', error);
    }
  }
  
  async loadCategoryFeatures(categoryId: string) {
    try {
      const category = await this.categoryService.getById(categoryId);
      
      if (category && category.features) {
        this.features = category.features;
        
        // Özellik değerlerini bekleyerek yükle
        const promises = this.features.map(feature => this.loadFeatureValues(feature.id));
        await Promise.all(promises);
        
        // Özellik değerlerini kontrol et
        this.features.forEach(feature => {
          const values = this.featureValues[feature.id];
        });
      } else {
      }
    } catch (error) {
      console.error('Ürün özellikleri yüklenemedi:', error);
      this.customToastrService.message("Ürün özellikleri yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  async loadFeatureValues(featureId: string) {
    try {
      const feature = await this.featureService.getById(featureId);
      
      if (feature && feature.featureValues) {
        this.featureValues[featureId] = feature.featureValues;
      } else {
        this.featureValues[featureId] = []; // Boş dizi başlat
      }
    } catch (error) {
      console.error(`${featureId} için değer yükleme hatası:`, error);
      this.featureValues[featureId] = []; // Hata durumunda boş dizi
    }
  }

  getProductImage(product: any): string {
    return product.showcaseImage?.url || this.defaultProductImage;
  }

  setShowcaseImage(index: number) {
    const images = this.productImageFiles.controls;
    images.forEach((image, i) => {
      image.patchValue({ showcase: i === index });
    });
  }

  onSubmit() {
    
    // Form geçersiz olsa bile devam edelim
    const formData = new FormData();
    const updatedProduct = this.productForm.value;
    
    // Temel ürün bilgilerini ekle
    formData.append('id', this.productId);
    formData.append('name', updatedProduct.name || '');
    formData.append('description', updatedProduct.description || '');
    formData.append('title', updatedProduct.title || '');
    formData.append('categoryId', updatedProduct.categoryId || '');
    formData.append('brandId', updatedProduct.brandId || '');
    formData.append('varyantGroupID', updatedProduct.varyantGroupID || '');
    formData.append('tax', String(updatedProduct.tax || 0));
    formData.append('stock', String(updatedProduct.stock || 0));
    formData.append('price', String(updatedProduct.price || 0));
    formData.append('sku', updatedProduct.sku || '');
  
    // Ürün özelliklerini ekle - yalnızca doldurulanları gönder
    updatedProduct.productFeatureValues.forEach((feature, index) => {
      if (feature.featureId && feature.featureValueId) {
        formData.append(`productFeatures[${index}].id`, feature.featureId);
        formData.append(`productFeatures[${index}].name`, feature.featureName || '');
        formData.append(`productFeatures[${index}].featureValues[0].id`, feature.featureValueId);
        formData.append(`productFeatures[${index}].featureValues[0].name`, feature.featureValueName || '');
      }
    });
  
    // Fotoğrafları ekle
    this.productImageFiles.controls.forEach((control, index) => {
      const file = control.get('file')?.value;
      if (file instanceof File) {
        formData.append(`newProductImages`, file, file.name);
      } else if (control.get('id')?.value) {
        formData.append(`existingImageIds`, control.get('id').value);
      }
      if (control.get('showcase').value) {
        formData.append('showcaseImageIndex', index.toString());
      }
    });
  
    
    this.productService.update(formData,
      () => {
        this.customToastrService.message("Ürün başarıyla güncellendi", "Başarılı", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        this.router.navigate(['/admin/products/product-update/'+this.productId]);
      },
      (error) => {
        console.error('Güncelleme hatası:', error);
        this.customToastrService.message("Ürün güncellenemedi", "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    );
  }

  // Form hatalarını bulan yardımcı metod
  getFormErrors() {
    const result = {};
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      if (control && control.errors) {
        result[key] = control.errors;
      }
    });
    return result;
  }

  openImageUploadDialog() {
    this.dialogService.openDialog({
      componentType: FileUploadDialogComponent,
      data: { product: this.product },
      options: { width: '550px' },
      afterClosed: (result: File[]) => {
        if (result && result.length > 0) {
          result.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              this.productImageFiles.push(this.fb.group({
                fileName: [file.name],
                url: [e.target.result],
                showcase: [false],
                file: [file]  // Dosyayı da saklayalım
              }));
            };
            reader.readAsDataURL(file);
          });
        }
      }
    });
  }

  openDescriptionEditor() {
    this.dialogService.openDialog({
      componentType: DescriptionEditorDialogComponent,
      data: { description: this.productForm.get('description').value || '' },
      options: {
        width: '1200px',
        height: '600px'
      },
      afterClosed: result => {
        if (result !== undefined) {
          this.productForm.patchValue({ description: result });
          this.productForm.markAsDirty();
        }
      }
    });
  }

  removeImage(index: number) {
    this.productImageFiles.removeAt(index);
    if (this.productImageFiles.length > 0 && !this.productImageFiles.controls.some(control => control.get('showcase').value)) {
      this.setShowcaseImage(0);
    }
  }

  addFeature() {
    this.productFeatureValues.push(this.fb.group({
      featureId: [''],
      featureName: [''],
      featureValueId: [''],
      featureValueName: ['']
    }));
  }

  removeFeature(index: number) {
    this.productFeatureValues.removeAt(index);
  }

  onFeatureChange(index: number) {
    const featureControl = this.productFeatureValues.at(index);
    const featureId = featureControl.get('featureId').value;
    
    
    if (!featureId) {
      return;
    }
    
    const feature = this.features.find(f => f.id === featureId);
    
    if (feature) {
      featureControl.patchValue({ 
        featureName: feature.name,
        // Özellik değiştiğinde değeri sıfırla
        featureValueId: '',
        featureValueName: ''
      });
      
      // Değerleri kontrol et
      const values = this.getFeatureValues(featureId);
      
      // Form durumunu güncelle
      this.productForm.markAsDirty();
    } else {
    }
  }

  onFeatureValueChange(index: number) {
    const featureControl = this.productFeatureValues.at(index);
    const featureId = featureControl.get('featureId').value;
    const featureValueId = featureControl.get('featureValueId').value;
    
    
    if (!featureId || !featureValueId) {
      return;
    }
    
    const values = this.getFeatureValues(featureId);
    const featureValue = values.find(fv => fv.id === featureValueId);
    
    if (featureValue) {
      featureControl.patchValue({ featureValueName: featureValue.name });
      
      // Form durumunu güncelle
      this.productForm.markAsDirty();
    } else {
    }
  }

  navigateToProduct(productId: string) {
    this.router.navigate(['/admin/products/product-update', productId]);
  }

  navigateToProductDetail(productId: string) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([productId])
    );
    window.open(url, '_blank');
  }
}