import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTreeModule } from '@angular/material/tree';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AngularEditorConfig, AngularEditorModule, UploadResponse } from '@kolkov/angular-editor';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatRadioModule } from '@angular/material/radio';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, from, map } from 'rxjs';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-product-update',
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
    NgxFileDropModule
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
  }
  

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private featureService: FeatureService,
    private snackBar: MatSnackBar,
    private dialogService: DialogService,
    private customToastrService: CustomToastrService,
    spinner: SpinnerService
  ) {
    super(spinner);
    this.createForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      this.loadProduct();
    });
    
    // Form değişikliklerini izleme
    this.productForm.valueChanges.subscribe(() => {
      console.log('Form değişti');
      // Formu dirty olarak işaretle
      this.productForm.markAsDirty();
    });
    
    // Angular editor için özel takip
    this.productForm.get('description').valueChanges.subscribe(value => {
      this.productForm.markAsDirty();
      console.log('Description değişti, form dirty mi:', this.productForm.dirty);
    });
  }

  createForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''], // Validasyon yok
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      brandId: ['', Validators.required],
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
      
      console.log('Ürün yükleme tamamlandı');
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
    this.productForm.patchValue({
      name: this.product.name,
      description: this.product.description,
      title: this.product.title,
      categoryId: this.product.categoryId,
      brandId: this.product.brandId,
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
    } catch (error) {
      this.customToastrService.message("Kategoriler yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
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
      console.log('Ürün özellikleri yükleniyor...');
      const category = await this.categoryService.getById(this.product.categoryId);
      
      if (category && category.features) {
        this.features = category.features;
        console.log(`${this.features.length} adet özellik bulundu`);
        
        // Özellik değerlerini bekleyerek yükle
        const promises = this.features.map(feature => this.loadFeatureValues(feature.id));
        await Promise.all(promises);
        
        // Özellik değerlerini kontrol et
        this.features.forEach(feature => {
          const values = this.featureValues[feature.id];
          console.log(`${feature.name} özelliği için ${values ? values.length : 0} değer yüklendi`);
        });
      } else {
        console.log('Kategoride özellik bulunamadı');
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
      console.log(`${featureId} özelliği için değerler yükleniyor...`);
      const feature = await this.featureService.getById(featureId);
      
      if (feature && feature.featureValues) {
        this.featureValues[featureId] = feature.featureValues;
        console.log(`${featureId} özelliği için ${feature.featureValues.length} değer yüklendi`);
      } else {
        console.log(`${featureId} özelliği için değer bulunamadı`);
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
    console.log('onSubmit çağrıldı');
    console.log('Form durumu - valid:', this.productForm.valid, 'dirty:', this.productForm.dirty);
    
    // Form validasyonu kontrolünü gevşetelim - hatalar görünsün
    if (this.productForm.invalid) {
      console.log('Form geçersiz. Hatalar:', this.getFormErrors());
    }
    
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
  
    console.log('Form data hazırlandı, gönderiliyor...');
    
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
    console.log('Yeni özellik eklendi');
  }

  removeFeature(index: number) {
    this.productFeatureValues.removeAt(index);
  }

  onFeatureChange(index: number) {
    console.log(`Özellik değişti, index: ${index}`);
    const featureControl = this.productFeatureValues.at(index);
    const featureId = featureControl.get('featureId').value;
    
    console.log(`Seçilen özellik ID: ${featureId}`);
    
    if (!featureId) {
      console.log('Özellik ID boş');
      return;
    }
    
    const feature = this.features.find(f => f.id === featureId);
    
    if (feature) {
      console.log(`Bulunan özellik: ${feature.name}`);
      featureControl.patchValue({ 
        featureName: feature.name,
        // Özellik değiştiğinde değeri sıfırla
        featureValueId: '',
        featureValueName: ''
      });
      
      // Değerleri kontrol et
      const values = this.getFeatureValues(featureId);
      console.log(`${feature.name} için ${values.length} değer var`);
      
      // Form durumunu güncelle
      this.productForm.markAsDirty();
    } else {
      console.log(`ID'si ${featureId} olan özellik bulunamadı`);
    }
  }

  onFeatureValueChange(index: number) {
    console.log(`Özellik değeri değişti, index: ${index}`);
    const featureControl = this.productFeatureValues.at(index);
    const featureId = featureControl.get('featureId').value;
    const featureValueId = featureControl.get('featureValueId').value;
    
    console.log(`Özellik ID: ${featureId}, Değer ID: ${featureValueId}`);
    
    if (!featureId || !featureValueId) {
      console.log('Özellik ID veya değer ID boş');
      return;
    }
    
    const values = this.getFeatureValues(featureId);
    const featureValue = values.find(fv => fv.id === featureValueId);
    
    if (featureValue) {
      console.log(`Bulunan değer: ${featureValue.name}`);
      featureControl.patchValue({ featureValueName: featureValue.name });
      
      // Form durumunu güncelle
      this.productForm.markAsDirty();
    } else {
      console.log(`ID'si ${featureValueId} olan değer bulunamadı`);
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
