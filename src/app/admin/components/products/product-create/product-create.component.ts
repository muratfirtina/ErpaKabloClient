import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
    NgxMatSelectSearchModule,
    AngularEditorModule,
  ],
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss', '../../../../../styles.scss']
})
export class ProductCreateComponent extends BaseComponent implements OnInit {
  productForm: FormGroup;
  features: Feature[] = [];
  featureValues: { [key: string]: Featurevalue[] } = {};
  variantColumns: string[] = ['select', 'combination', 'price', 'stock', 'sku', 'actions'];
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


  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private featureService: FeatureService,
    private brandService: BrandService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private customToastrService: CustomToastrService,
    private changeDetectorRef: ChangeDetectorRef,
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
      stock: control.get('stock').value
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
        sku: [existingVariant ? existingVariant.sku : '', Validators.required]
      }));
    });

    this.variantsCreated = true;
    this.updateButtonText();
    this.updateDataSource();
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