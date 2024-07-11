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
    MatTableModule
  ],
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss']
})
export class ProductCreateComponent extends BaseComponent implements OnInit {
  productForm: FormGroup;
  categories: Category[] = [];
  brands: Brand[] = [];
  features: Feature[] = [];
  featureValues: { [key: string]: Featurevalue[] } = {};
  variantColumns: string[] = ['combination', 'price', 'stock', 'sku'];
  variantsCreated: boolean = false;
  canGenerateVariants: boolean = false
  buttonText: string = 'Ürünü Ekle';

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private featureService: FeatureService,
    private brandService: BrandService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private customToastrService: CustomToastrService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
    this.createForm();
  }

  createForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required],
      brandId: ['', Validators.required],
      varyantGroupID: [''],
      tax: [0, [Validators.required, Validators.min(0)]],
      features: this.fb.array([]),
      variants: this.fb.array([])
    });
    this.buttonText = 'Ürünü Ekle';
  }

  async ngOnInit() {
    await this.loadCategories();
    await this.loadBrands();

    this.productForm.get('features').valueChanges.subscribe(() => {
      this.canGenerateVariants = this.featureFormArray.length > 0 && 
        this.featureFormArray.controls.every(control => 
          control.get('featureId').value && 
          control.get('selectedValues').value.length > 0
        );
      this.variantsCreated = false;
    });
  }

  async loadCategories() {
    const data = await this.categoryService.list({ pageIndex: 0, pageSize: 1000 });
    this.categories = data.items;
  }

  async loadBrands() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      const data = await this.brandService.list({ pageIndex: 0, pageSize: 1000 });
      this.brands = data.items;
    } catch (error) {
      this.customToastrService.message("Markalar yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onCategoryChange(categoryId: string) {
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
    if (this.variants.length === 0) {
      this.variantsCreated = false;
    }
    this.buttonText = this.variants.length > 1 ? 'Ürünleri Ekle' : 'Ürünü Ekle';
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
    this.variants.clear();
    combinations.forEach(combination => {
      this.variants.push(this.fb.group({
        combination: [combination.join(' - ')],
        price: [0, [Validators.required, Validators.min(0)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        sku: ['', Validators.required]
      }));
    });
    this.variantsCreated = true;
    this.buttonText = this.variants.length > 1 ? 'Ürünleri Ekle' : 'Ürünü Ekle';
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
      const productData: ProductCreate[] = this.variants.controls.map(variant => ({
        name: this.productForm.get('name').value,
        description: this.productForm.get('description').value,
        categoryId: this.productForm.get('categoryId').value,
        brandId: this.productForm.get('brandId').value,
        sku: variant.get('sku').value,
        varyantGroupID: this.productForm.get('varyantGroupID').value,
        price: parseFloat(variant.get('price').value),
        stock: parseInt(variant.get('stock').value),
        tax: parseFloat(this.productForm.get('tax').value),
        featureIds: this.featureFormArray.controls.map(f => f.get('featureId').value),
        featureValueIds: variant.get('combination').value.split(' - ').map((value, index) => 
          this.featureValues[this.featureFormArray.at(index).get('featureId').value]
            .find(fv => fv.name === value).id
        )
      }));
  
      if (productData.length === 1) {
        // Tek varyant durumunda
        this.productService.create(productData[0],
          () => {
            console.log('Success: Single product created');
            this.snackBar.open('Ürün başarıyla oluşturuldu', 'Kapat', { duration: 3000 });
          },
          (error) => {
            console.error('Error:', error);
            this.snackBar.open('Ürün oluşturulamadı: ' + JSON.stringify(error), 'Kapat', { duration: 3000 });
          }
        );
      } else {
        // Birden fazla varyant durumunda
        this.productService.createMultiple(productData,
          (data) => {
            console.log('Success:', data);
            this.snackBar.open('Ürünler başarıyla oluşturuldu', 'Kapat', { duration: 3000 });
          },
          (error) => {
            console.error('Error:', error);
            this.snackBar.open('Ürünler oluşturulamadı: ' + JSON.stringify(error), 'Kapat', { duration: 3000 });
          }
        );
      }
      
      console.log(productData);
    }
  }
}