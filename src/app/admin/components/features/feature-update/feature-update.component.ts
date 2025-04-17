import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from 'src/app/base/base/base.component';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
  FormArray,
} from '@angular/forms';
import {
  CustomToastrService,
  ToastrMessageType,
  ToastrPosition,
} from 'src/app/services/ui/custom-toastr.service';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Category } from 'src/app/contracts/category/category';
import { ActivatedRoute } from '@angular/router';
import { FeatureUpdate } from 'src/app/contracts/feature/feature-update';
import { FeatureGetById } from 'src/app/contracts/feature/feature-getbyid';
import { Featurevalue } from 'src/app/contracts/featurevalue/featurevalue';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-feature-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feature-update.component.html',
  styleUrls: ['./feature-update.component.scss'],
})
export class FeatureUpdateComponent extends BaseComponent implements OnInit {
  featureForm: FormGroup;
  categories: Category[] = [];
  filteredCategories: Observable<Category[]>;
  categoryFilterCtrl: FormControl = new FormControl();
  selectedCategories: Category[] = [];
  featureId: string;
  allFeatureValues: Featurevalue[] = [];
  expandedCategories: Set<string> = new Set();
  dataSource = { data: [] as Category[] }; // Simple object instead of MatTreeDataSource

  constructor(
    spinner: SpinnerService,
    private featureService: FeatureService,
    private featureValueService: FeaturevalueService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.featureId = this.route.snapshot.paramMap.get('id')!;
    this.featureForm = this.fb.group({
      name: ['', Validators.required],
      categoryIds: [[]],
      featureValues: this.fb.array([]),
    });

    this.setupCategoryFilter();
    this.loadFeature();
    this.loadFeatureValues().then(() => this.loadFeature());
    this.loadCategories();
  }

  loadFeatureValues(): Promise<void> {
    return this.featureValueService
      .list({ pageIndex: -1, pageSize: -1 })
      .then((data) => {
        this.allFeatureValues = data.items;
      })
      .catch((error) => {
        this.toastrService.message(error, 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight,
        });
      });
  }

  // Form kontrollerine erişim için getter
  get featureValues(): FormArray {
    return this.featureForm.get('featureValues') as FormArray;
  }

  // Özellik değeri kontrolünün FormControl mu yoksa FormGroup mu olduğunu kontrol et
  isStringControl(index: number): boolean {
    return this.featureValues.at(index) instanceof FormControl;
  }

  // Yeni özellik değeri ekleme (string olarak)
  addFeatureValueControl(value: string = ''): void {
    this.featureValues.push(this.fb.control(value));
  }

  // Mevcut özellik değeri ekleme (FormGroup olarak)
  addExistingFeatureValueControl(value: any = { id: '' }): void {
    this.featureValues.push(
      this.fb.group({
        id: [value.id, Validators.required],
      })
    );
  }

  removeFeatureValueControl(index: number): void {
    if (this.featureValues.length > 1) {
      this.featureValues.removeAt(index);
    } else {
      this.toastrService.message(
        'En az bir özellik değeri olmalıdır',
        'Uyarı',
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight,
        }
      );
    }
  }

  isExpanded(category: Category): boolean {
    return this.expandedCategories.has(category.id);
  }

  isCategorySelected(category: Category): boolean {
    return category.checked || false;
  }

  toggleCategory(category: Category, event: any): void {
    const isChecked = event.target.checked;
    this.updateCategoryAndDescendants(category, isChecked);
    this.updateSelectedCategories();
  }

  updateCategoryAndDescendants(category: Category, checked: boolean): void {
    category.checked = checked;

    if (category.subCategories) {
      category.subCategories.forEach((subCategory) => {
        this.updateCategoryAndDescendants(subCategory, checked);
      });
    }
  }

  removeCategory(category: Category): void {
    this.updateCategoryAndDescendants(category, false);
    this.updateSelectedCategories();
  }

  updateSelectedCategories(): void {
    this.selectedCategories = this.collectSelectedCategories(this.categories);

    // Form değerini güncelle
    this.featureForm.patchValue({
      categoryIds: this.selectedCategories.map((cat) => cat.id),
    });
  }

  collectSelectedCategories(categories: Category[]): Category[] {
    let selected: Category[] = [];
    categories.forEach((category) => {
      if (category.checked) {
        selected.push(category);
      }

      if (category.subCategories && category.subCategories.length > 0) {
        selected = selected.concat(
          this.collectSelectedCategories(category.subCategories)
        );
      }
    });
    return selected;
  }

  loadFeature() {
    this.featureService
      .getById(this.featureId)
      .then((data: FeatureGetById) => {
        this.featureForm.patchValue({ name: data.name });

        // Form arrays'i temizle
        while (this.featureValues.length > 0) {
          this.featureValues.removeAt(0);
        }

        // Özellik değerlerini form'a ekle
        data.featureValues.forEach((value) => {
          this.addExistingFeatureValueControl(value);
        });

        // Önce kategorilerin yüklenmesini bekle, sonra seçili kategorileri işaretle
        this.loadCategories().then(() => {
          // Kategorileri işaretle
          if (data.categories && data.categories.length > 0) {
            // Seçili kategorileri doğrudan ata
            this.selectedCategories = [...data.categories];

            // Her kategoriyi işaretle
            data.categories.forEach((category) => {
              this.markCategoryAsSelected(category.id);

              // Ebeveyn kategorileri genişlet
              let parentCategory = this.findCategoryParent(
                this.categories,
                category.id
              );
              while (parentCategory) {
                this.expandedCategories.add(parentCategory.id);
                parentCategory = this.findCategoryParent(
                  this.categories,
                  parentCategory.id
                );
              }
            });
          }
        });
      })
      .catch((error) => {
        this.toastrService.message(error, 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight,
        });
      });
  }
  markCategoryAsSelected(categoryId: string): void {
    const category = this.findCategoryById(this.categories, categoryId);
    if (category) {
      category.checked = true;
    }
  }

  // Kategori ebeveynini bulma yardımcı metodu ekle
  findCategoryParent(categories: Category[], childId: string): Category | null {
    for (const category of categories) {
      if (category.subCategories) {
        // Doğrudan alt kategori mi kontrol et
        if (category.subCategories.some((sub) => sub.id === childId)) {
          return category;
        }

        // Alt kategorilerde recursive ara
        const foundInSub = this.findCategoryParent(
          category.subCategories,
          childId
        );
        if (foundInSub) {
          return foundInSub;
        }
      }
    }
    return null;
  }

  loadCategories(): Promise<void> {
    return this.categoryService
      .list({ pageIndex: -1, pageSize: -1 })
      .then((data) => {
        this.categories = this.createHierarchy(data.items);
        this.dataSource.data = this.categories;
      })
      .catch((error) => {
        this.toastrService.message(error, 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight,
        });
      });
  }

  // toggleCategoryExpansion metodunu güncelle - event parametresi ekle ve event.stopPropagation() kullan
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

  private flattenCategories(categories: Category[]): Category[] {
    let flattened: Category[] = [];
    categories.forEach((category) => {
      flattened.push(category);
      if (category.subCategories) {
        flattened = flattened.concat(
          this.flattenCategories(category.subCategories)
        );
      }
    });
    return flattened;
  }

  setupCategoryFilter() {
    this.filteredCategories = this.categoryFilterCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterCategories(value || ''))
    );

    // Filtrelenen kategorileri dataSource'a uygulamak için
    this.categoryFilterCtrl.valueChanges.subscribe((value) => {
      const searchTerm = value ? value.toLowerCase().trim() : '';

      if (searchTerm === '') {
        // Arama terimi yoksa, tüm kategori ağacını göster
        this.dataSource.data = [...this.categories];
      } else {
        // Arama terimi varsa, kopyalama yapmadan önce orijinal ağacı kullan
        const filteredTree = this.getFilteredCategoryTree(
          this.categories,
          searchTerm
        );
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
   * @param categories Kategoriler
   * @param searchTerm Arama terimi
   * @returns Filtrelenmiş kategori ağacı
   */
  getFilteredCategoryTree(
    categories: Category[],
    searchTerm: string
  ): Category[] {
    // Kategorilerin derin kopyasını oluştur
    const clonedCategories = JSON.parse(
      JSON.stringify(categories)
    ) as Category[];

    // Her kategorinin kendisinde veya alt kategorilerinde arama terimi var mı kontrol et
    const shouldIncludeCategory = (
      category: Category,
      term: string
    ): boolean => {
      // Kategorinin kendi adında arama terimi varsa dahil et
      if (category.name.toLowerCase().includes(term)) {
        return true;
      }

      // Alt kategorileri kontrol et
      if (category.subCategories && category.subCategories.length > 0) {
        // Alt kategorileri filtrele
        const filteredSubCategories = category.subCategories.filter((subCat) =>
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
    return clonedCategories.filter((category) =>
      shouldIncludeCategory(category, searchTerm)
    );
  }
  /**
   * Filtrelenmiş kategorilerin tümünü genişlet
   */
  expandAllFilteredCategories(categories: Category[]): void {
    categories.forEach((category) => {
      // Bu kategoriyi genişlet
      this.expandedCategories.add(category.id);

      // Alt kategoriler varsa onları da genişlet
      if (category.subCategories && category.subCategories.length > 0) {
        this.expandAllFilteredCategories(category.subCategories);
      }
    });
  }
  filterCategoryTreeWithHierarchy(
    categories: Category[],
    matchedIds: Set<string>
  ): Category[] {
    const result: Category[] = [];

    for (const category of categories) {
      // Kategorinin kopyasını oluştur
      const categoryCopy = { ...category };

      // Alt kategorileri filtrele (varsa)
      if (category.subCategories && category.subCategories.length > 0) {
        categoryCopy.subCategories = this.filterCategoryTreeWithHierarchy(
          category.subCategories,
          matchedIds
        );
      } else {
        categoryCopy.subCategories = [];
      }

      // Bu kategori eşleşiyorsa veya alt kategorileri eşleşen varsa sonuca ekle
      if (
        matchedIds.has(category.id) ||
        (categoryCopy.subCategories && categoryCopy.subCategories.length > 0)
      ) {
        result.push(categoryCopy);
      }
    }

    return result;
  }
  expandMatchedCategories(categories: Category[]): void {
    for (const category of categories) {
      // Alt kategorisi varsa ve filtrede eşleşen varsa, bu kategoriyi genişlet
      if (category.subCategories && category.subCategories.length > 0) {
        this.expandedCategories.add(category.id);
        this.expandMatchedCategories(category.subCategories);
      }
    }
  }
  deepCloneCategories(categories: Category[]): Category[] {
    return categories.map((cat) => ({
      ...cat,
      subCategories: cat.subCategories
        ? this.deepCloneCategories(cat.subCategories)
        : [],
    }));
  }
  buildFilteredHierarchy(filteredCategories: Category[]): Category[] {
    // Önce tüm kategorileri ve onların parent'larını içerecek bir set oluştur
    const categoryIds = new Set<string>();
    const result: Category[] = [];

    // Önce bulunan kategorileri ekle
    filteredCategories.forEach((cat) => {
      categoryIds.add(cat.id);
    });

    // Ebeveyn kategorileri bul ve ekle
    filteredCategories.forEach((cat) => {
      let parent = this.findCategoryParent(this.categories, cat.id);
      while (parent) {
        categoryIds.add(parent.id);
        parent = this.findCategoryParent(this.categories, parent.id);
      }
    });

    // Filtrelenmiş ebeveyn-alt kategori hiyerarşisini oluştur
    const tempCategories = this.deepCloneCategories(this.categories);
    this.filterCategoryTree(tempCategories, categoryIds);

    return tempCategories.filter((cat) => categoryIds.has(cat.id));
  }
  filterCategoryTree(categories: Category[], keepIds: Set<string>): void {
    for (let i = categories.length - 1; i >= 0; i--) {
      const category = categories[i];

      if (category.subCategories && category.subCategories.length > 0) {
        this.filterCategoryTree(category.subCategories, keepIds);

        // Alt kategoriler filtrelendikten sonra boş kaldıysa ve bu kategori de filtrelenecekse kaldır
        if (category.subCategories.length === 0 && !keepIds.has(category.id)) {
          categories.splice(i, 1);
        }
      } else if (!keepIds.has(category.id)) {
        // Alt kategorisi olmayan ve ID'si bulunmayan kategorileri kaldır
        categories.splice(i, 1);
      }
    }
  }
  // filterCategories metodunu daha güçlü hale getirin
  filterCategories(value: string): Category[] {
    if (!value) return this.flattenCategories(this.categories);

    const filterValue = value.toLowerCase().trim();
    return this.flattenCategories(this.categories).filter((category) =>
      category.name.toLowerCase().includes(filterValue)
    );
  }
  restoreCheckedState(): void {
    // Mevcut dataSource'daki kategorileri dolaş
    const restoreChecks = (categories: Category[]): void => {
      categories.forEach((category) => {
        // Seçili kategorilerde bu kategori var mı kontrol et
        const isSelected = this.selectedCategories.some(
          (sc) => sc.id === category.id
        );
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

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.featureForm.valid) {
      this.updateFeature(this.featureForm.value);
    }
  }

  async updateFeature(formValue: any) {
    try {
      // Özellik değerlerini hazırla (createFeatureWithFeatureValues metodundaki gibi)
      // Hem mevcut hem de yeni feature değerleri için tek bir yapı kullan
      const featureValues = [];
      const featureValueIds = [];

      this.featureValues.controls.forEach((control) => {
        if (control instanceof FormControl) {
          // Yeni değer
          const valueText = control.value.trim();
          if (valueText) {
            featureValues.push({ name: valueText });
          }
        } else if (control instanceof FormGroup) {
          // Mevcut değer
          const id = control.get('id').value;
          if (id) {
            featureValueIds.push(id);
          }
        }
      });

      // Update nesnesini oluştur
      const update_feature: FeatureUpdate = {
        id: this.featureId,
        name: formValue.name,
        categoryIds: formValue.categoryIds ? formValue.categoryIds : [],
        featureValueIds: featureValueIds,
        featureValues: featureValues,
      };

      // Feature'ı güncelle
      await this.featureService.update(update_feature);

      this.toastrService.message(
        'Feature ve feature değerleri başarıyla güncellendi',
        'Başarılı',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight,
        }
      );

      // Sayfayı yenile
      await this.loadFeatureValues();
      await this.loadFeature();
    } catch (error) {
      this.toastrService.message(error, 'Hata', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight,
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

    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, subCategories: [] });
    });

    categoryMap.forEach((category) => {
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
