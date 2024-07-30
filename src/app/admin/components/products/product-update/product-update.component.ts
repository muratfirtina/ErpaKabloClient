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
import { AngularEditorModule } from '@kolkov/angular-editor';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { DialogService } from 'src/app/services/common/dialog.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Brand } from 'src/app/contracts/brand/brand';
import { Category } from 'src/app/contracts/category/category';
import { Feature } from 'src/app/contracts/feature/feature';
import { Featurevalue } from 'src/app/contracts/featurevalue/featurevalue';
import { Product } from 'src/app/contracts/product/product';
import { FileUploadDialogComponent } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';

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
  displayedColumns: string[] = ['photo', 'name', 'price', 'stock', 'sku', 'categoryName', 'brandName', 'features'];
  defaultProductImage = 'assets/product/ecommerce-default-product.png';
  

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
    spinner: NgxSpinnerService
  ) {
    super(spinner);
    this.createForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      this.loadProduct();
    });
    this.loadCategories();
    this.loadBrands();
  }

  createForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required],
      brandId: ['', Validators.required],
      varyantGroupID: [''],
      tax: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
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

  async loadProduct() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      const response = await this.productService.getById(this.productId, () => {}, () => {});
      this.product = response;
      this.relatedProducts = response.relatedProducts;
      this.updateFormWithProductData();
      this.loadProductFeatures();
    } catch (error) {
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
        category: [image.category],
        storage: [image.storage],
        url: [image.url],
        showcase: [image.showcase] || '../../../../../assets/product/ecommerce-default-product.png'
      }));
    });
  
    // RelatedProducts güncelleme
    this.relatedProducts = this.product.relatedProducts;
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
      const category = await this.categoryService.getById(this.product.categoryId);
      this.features = category.features;
      this.features.forEach(feature => {
        this.loadFeatureValues(feature.id);
      });
    } catch (error) {
      this.customToastrService.message("Ürün özellikleri yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  async loadFeatureValues(featureId: string) {
    try {
      const feature = await this.featureService.getById(featureId);
      this.featureValues[featureId] = feature.featureValues;
    } catch (error) {
      console.error('Error loading feature values:', error);
    }
  }
  getProductImage(product: any): string {
    return product.showcaseImage?.url || this.defaultProductImage;
  }

  onSubmit() {
    if (this.productForm.valid) {
      const updatedProduct = {
        ...this.productForm.value,
        id: this.productId,
        productImageFiles: this.productForm.get('productImageFiles').value.map(image => ({
          ...image,
          showcase: image.showcase || false
        }))
      };
  
      this.productService.update(updatedProduct,
        () => {
          this.customToastrService.message("Ürün başarıyla güncellendi", "Başarılı", {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
          this.router.navigate(['/products']);
        },
        (error) => {
          this.customToastrService.message("Ürün güncellenemedi", "Hata", {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          });
        }
      );
    } else {
      this.snackBar.open('Lütfen tüm gerekli alanları doldurun', 'Kapat', { duration: 3000 });
    }
  }

  openImageUploadDialog() {
    this.dialogService.openDialog({
      componentType: FileUploadDialogComponent,
      data: { product: this.product },
      options: { width: '550px' },
      afterClosed: (result: File[]) => {
        if (result && result.length > 0) {
          // Yeni resimleri ekle
          result.forEach(file => {
            this.productImageFiles.push(this.fb.group({
              name: [file.name],
              // Diğer gerekli alanları da ekleyin
            }));
          });
        }
      }
    });
  }

  removeImage(index: number) {
    this.productImageFiles.removeAt(index);
  }

  addFeature() {
    this.productFeatureValues.push(this.fb.group({
      featureId: ['', Validators.required],
      featureName: [''],
      featureValueId: ['', Validators.required],
      featureValueName: ['']
    }));
  }

  removeFeature(index: number) {
    this.productFeatureValues.removeAt(index);
  }

  onFeatureChange(index: number) {
    const featureControl = this.productFeatureValues.at(index);
    const featureId = featureControl.get('featureId').value;
    const feature = this.features.find(f => f.id === featureId);
    if (feature) {
      featureControl.patchValue({ featureName: feature.name });
    }
  }

  onFeatureValueChange(index: number) {
    const featureControl = this.productFeatureValues.at(index);
    const featureId = featureControl.get('featureId').value;
    const featureValueId = featureControl.get('featureValueId').value;
    const featureValue = this.featureValues[featureId]?.find(fv => fv.id === featureValueId);
    if (featureValue) {
      featureControl.patchValue({ featureValueName: featureValue.name });
    }
  }

  navigateToProduct(productId: string) {
    this.router.navigate(['/admin/products/product-update', productId]);
  }
}