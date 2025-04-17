import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from 'src/app/base/base/base.component';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, FormArray } from '@angular/forms';
import { FeaturecreateconfrimDialogComponent } from 'src/app/dialogs/featureDialogs/featurecreateconfrim-dialog/featurecreateconfrim-dialog.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeatureCreate } from 'src/app/contracts/feature/feature-create';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Category } from 'src/app/contracts/category/category';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-feature-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './feature-create.component.html',
  styleUrls: ['./feature-create.component.scss']
})
export class FeatureCreateComponent extends BaseComponent implements OnInit {
  featureForm: FormGroup;
  categories: Category[] = [];
  filteredCategories: Observable<Category[]>;
  categoryFilterCtrl: FormControl = new FormControl();
  selectedCategories: Category[] = [];
  expandedCategories: Set<string> = new Set();
  dataSource = { data: [] as Category[] };

  constructor(
    spinner: SpinnerService,
    private featureService: FeatureService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private categoryService: CategoryService,
    private toastrService: CustomToastrService,
    private featurevalueService: FeaturevalueService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.featureForm = this.fb.group({
      name: ['', Validators.required],
      categoryIds: [[]],
      featureValues: this.fb.array([this.createFeatureValueControl()])
    });

    this.loadCategories();
    this.setupCategoryFilter();
  }

  get featureValues(): FormArray {
    return this.featureForm.get('featureValues') as FormArray;
  }

  createFeatureValueControl(): FormControl {
    return this.fb.control('', Validators.required);
  }

  addFeatureValueControl() {
    this.featureValues.push(this.createFeatureValueControl());
  }

  removeFeatureValueControl(index: number) {
    if (this.featureValues.length > 1) {
      this.featureValues.removeAt(index);
    } else {
      this.toastrService.message('En az bir özellik değeri olmalıdır', 'Uyarı', {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
    }
  }

  loadCategories() {
    this.categoryService.list({ pageIndex: -1, pageSize: -1 }).then(data => {
      this.categories = this.createHierarchy(data.items);
      this.dataSource.data = this.categories;
      // Filtre değerini sıfırla
      this.categoryFilterCtrl.setValue('');
    }).catch(error => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    });
  }

  setupCategoryFilter() {
    this.filteredCategories = this.categoryFilterCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCategories(value || ''))
    );

    // Filtrelenen kategorileri dataSource'a uygulamak için
    this.categoryFilterCtrl.valueChanges.subscribe(value => {
      const searchTerm = value ? value.toLowerCase().trim() : '';

      if (searchTerm === '') {
        // Arama terimi yoksa, tüm kategori ağacını göster
        this.dataSource.data = [...this.categories];
      } else {
        // Arama terimi varsa, kopyalama yapmadan önce orijinal ağacı kullan
        const filteredTree = this.getFilteredCategoryTree(this.categories, searchTerm);
        this.dataSource.data = filteredTree;
        
        // Otomatik olarak tüm kategorileri genişlet
        this.expandAllFilteredCategories(this.dataSource.data);
      }
      
      // Mevcut seçili kategorilerin işaretli kalmasını sağla
      this.restoreCheckedState();
    });
  }

  /**
   * Arama terimine göre filtrelenmiş kategori ağacını döndürür
   */
  getFilteredCategoryTree(categories: Category[], searchTerm: string): Category[] {
    // Kategorilerin derin kopyasını oluştur
    const clonedCategories = JSON.parse(JSON.stringify(categories)) as Category[];
    
    // Her kategorinin kendisinde veya alt kategorilerinde arama terimi var mı kontrol et
    const shouldIncludeCategory = (category: Category, term: string): boolean => {
      // Kategorinin kendi adında arama terimi varsa dahil et
      if (category.name.toLowerCase().includes(term)) {
        return true;
      }
      
      // Alt kategorileri kontrol et
      if (category.subCategories && category.subCategories.length > 0) {
        // Alt kategorileri filtrele
        const filteredSubCategories = category.subCategories.filter(subCat => 
          shouldIncludeCategory(subCat, term)
        );
        
        // Alt kategorileri güncelle
        category.subCategories = filteredSubCategories;
        
        // Eğer alt kategorilerde eşleşen varsa, bu kategoriyi dahil et
        return filteredSubCategories.length > 0;
      }
      
      return false;
    };
    
    // Ana kategorileri filtrele
    return clonedCategories.filter(category => 
      shouldIncludeCategory(category, searchTerm)
    );
  }

  /**
   * Filtrelenmiş kategorilerin tümünü genişlet
   */
  expandAllFilteredCategories(categories: Category[]): void {
    categories.forEach(category => {
      // Bu kategoriyi genişlet
      this.expandedCategories.add(category.id);
      
      // Alt kategoriler varsa onları da genişlet
      if (category.subCategories && category.subCategories.length > 0) {
        this.expandAllFilteredCategories(category.subCategories);
      }
    });
  }

  /**
   * Filtreleme sonrası seçili kategorilerin durumunu korur
   */
  restoreCheckedState(): void {
    // Mevcut dataSource'daki kategorileri dolaş
    const restoreChecks = (categories: Category[]): void => {
      categories.forEach(category => {
        // Seçili kategorilerde bu kategori var mı kontrol et
        const isSelected = this.selectedCategories.some(sc => sc.id === category.id);
        // Eğer seçiliyse, checked özelliğini true yap
        if (isSelected) {
          category.checked = true;
        }
        
        // Alt kategorileri varsa onları da kontrol et
        if (category.subCategories && category.subCategories.length > 0) {
          restoreChecks(category.subCategories);
        }
      });
    };
    
    // Recursive olarak tüm kategorileri kontrol et
    restoreChecks(this.dataSource.data);
  }

  filterCategories(value: string): Category[] {
    if (!value) return this.flattenCategories(this.categories);
    
    const filterValue = value.toLowerCase().trim();
    return this.flattenCategories(this.categories).filter(category =>
      category.name.toLowerCase().includes(filterValue)
    );
  }

  private flattenCategories(categories: Category[]): Category[] {
    let flattened: Category[] = [];
    categories.forEach(category => {
      flattened.push(category);
      if (category.subCategories) {
        flattened = flattened.concat(this.flattenCategories(category.subCategories));
      }
    });
    return flattened;
  }

  isExpanded(category: Category): boolean {
    return this.expandedCategories.has(category.id);
  }

  isCategorySelected(category: Category): boolean {
    return category.checked || false;
  }

  toggleCategoryExpansion(category: Category, event: Event): void {
    // Olayın üst elemanlara iletilmesini engelle
    event.stopPropagation();
    event.preventDefault();
    
    if (this.expandedCategories.has(category.id)) {
      this.expandedCategories.delete(category.id);
    } else {
      this.expandedCategories.add(category.id);
    }
  }

  toggleCategory(category: Category, event: any): void {
    const isChecked = event.target.checked;
    this.updateCategoryAndDescendants(category, isChecked);
    this.updateSelectedCategories();
  }

  updateCategoryAndDescendants(category: Category, checked: boolean): void {
    category.checked = checked;
    
    if (category.subCategories) {
      category.subCategories.forEach(subCategory => {
        this.updateCategoryAndDescendants(subCategory, checked);
      });
    }
  }

  updateSelectedCategories(): void {
    this.selectedCategories = this.collectSelectedCategories(this.categories);
    
    // Form değerini güncelle
    this.featureForm.patchValue({
      categoryIds: this.selectedCategories.map(cat => cat.id)
    });
  }

  collectSelectedCategories(categories: Category[]): Category[] {
    let selected: Category[] = [];
    categories.forEach(category => {
      if (category.checked) {
        selected.push(category);
      }
      
      if (category.subCategories && category.subCategories.length > 0) {
        selected = selected.concat(this.collectSelectedCategories(category.subCategories));
      }
    });
    return selected;
  }

  removeCategory(category: Category): void {
    this.updateCategoryAndDescendants(category, false);
    this.updateSelectedCategories();
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.featureForm.valid) {
      this.openDialog(this.featureForm.value);
    }
  }

  openDialog(formValue: any): void {
    const dialogRef = this.dialog.open(FeaturecreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createFeatureWithFeatureValues(formValue);
      }
    });
  }

  async createFeatureWithFeatureValues(formValue: any) {
    try {
      const featureValues = formValue.featureValues.map(value => ({
        name: value
      }));
  
      const create_feature: FeatureCreate = {
        id: '',
        name: formValue.name,
        categoryIds: formValue.categoryIds ? formValue.categoryIds : [],
        featureValues: featureValues
      };
  
      const createdFeature = await this.featureService.create(create_feature);
  
      // Reset the form
      this.featureForm.reset();
      this.selectedCategories = [];
  
      // Recursive olarak tüm kategorilerin checked durumunu sıfırla
      const resetCategoryChecks = (categories: Category[]) => {
        categories.forEach(category => {
          category.checked = false;
          if (category.subCategories && category.subCategories.length > 0) {
            resetCategoryChecks(category.subCategories);
          }
        });
      };
  
      // Ana kategori listesindeki tüm checked durumlarını sıfırla
      resetCategoryChecks(this.categories);
      
      // Tree view'ı güncelle
      this.dataSource.data = [...this.categories];
  
      // Reset the feature values to have one empty control
      while (this.featureValues.length > 0) {
        this.featureValues.removeAt(0);
      }
      this.featureValues.push(this.createFeatureValueControl());
  
      this.toastrService.message('Feature and Feature Values created successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
    } catch (error) {
      this.toastrService.message(error, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  findCategoryById(categories: Category[], id: string): Category | undefined {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.subCategories) {
        const subCategory = this.findCategoryById(category.subCategories, id);
        if (subCategory) {
          return subCategory;
        }
      }
    }
    return undefined;
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
}