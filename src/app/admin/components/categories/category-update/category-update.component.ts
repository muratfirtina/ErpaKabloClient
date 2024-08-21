import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, map, startWith, switchMap } from 'rxjs';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Category } from 'src/app/contracts/category/category';
import { CategoryGetById } from 'src/app/contracts/category/category-getbyid';
import { CategoryUpdate } from 'src/app/contracts/category/category-update';
import { CategoryFilterByDynamic } from 'src/app/contracts/category/categoryFilterByDynamic';
import { CategoryImageFile } from 'src/app/contracts/category/categoryImageFile';
import { Filter, DynamicQuery } from 'src/app/contracts/dynamic-query';
import { Feature } from 'src/app/contracts/feature/feature';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-category-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './category-update.component.html',
  styleUrls: ['./category-update.component.scss','../../../../../styles.scss']
})
export class CategoryUpdateComponent extends BaseComponent implements OnInit {

  categoryForm: FormGroup;
  categoryId: string;
  category: CategoryGetById;
  categories: Category[] = [];
  features: Feature[] = [];
  filteredCategories: Observable<Category[]>;
  filteredParentCategories: Observable<Category[]>;
  parentCategoryIdControl: FormControl;
  pagedCategories: Category[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = -1;
  pageIndex: number = -1;
  count: number = 0;
  pages: number = 0;
  searchForm: FormGroup;
  selectedFile: File | null = null;
  categoryImage: CategoryImageFile;
  currentImageUrl: string | null = null;
  selectedImageUrl: string | ArrayBuffer | null = null;
  removeExistingImage: boolean = false;


  constructor(
    spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private featureService: FeatureService,
    private route: ActivatedRoute,
    private router: Router,
    private toastrService: CustomToastrService
  ) {
    super(spinner);

    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

    this.parentCategoryIdControl = new FormControl('');
  }

  async ngOnInit() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      parentCategoryId: [''],
      subCategories: [[]],
      features: [[]],
      categoryImage: [null]
    });

    this.categoryId = this.route.snapshot.paramMap.get('id')!;
    await this.loadCategoryDetails();
    await this.loadFeatures();

    this.filteredParentCategories = this.parentCategoryIdControl.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.name),
      switchMap(name => this.searchCategory(name)) // searchCategory metodunu çağırarak
    );
  }

  selectParentCategory(category: Category) {
    this.categoryForm.patchValue({ parentCategoryId: category.id });
    this.parentCategoryIdControl.setValue(category.name);
  }

  async loadCategoryDetails() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      this.category = await this.categoryService.getById(this.categoryId);
      if (this.category) {
        this.categoryForm.patchValue({
          name: this.category.name,
          parentCategoryId: this.category.parentCategoryId,
          features: this.category.features.map(feat => feat.id),
        });

        if (this.category.categoryImage) {
          this.currentImageUrl = this.category.categoryImage.url;
        }

        if (this.category.parentCategoryId) {
          const parentCategory = await this.categoryService.getById(this.category.parentCategoryId);
          if (parentCategory) {
            this.parentCategoryIdControl.setValue(parentCategory.name);
          }
        }
      }
    } catch (error) {
      this.toastrService.message('Error loading category details', 'Error', { 
        toastrMessageType: ToastrMessageType.Error, 
        position: ToastrPosition.TopRight 
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  async loadCategories() {
    const data = await this.categoryService.list({ pageIndex: -1, pageSize: -1 });
    this.categories = data.items;
    this.pagedCategories = this.createHierarchy(this.categories);
  }

  async loadFeatures() {
    const data = await this.featureService.list({ pageIndex: -1, pageSize: -1 });
    this.features = data.items;
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      const formData = new FormData();
      formData.append('id', this.categoryId);
      formData.append('name', this.categoryForm.get('name').value);

      const parentCategoryId = this.categoryForm.get('parentCategoryId').value;
      if (parentCategoryId) {
        formData.append('parentCategoryId', parentCategoryId);
      }

      const features = this.categoryForm.get('features').value;
      if (features && features.length > 0) {
        features.forEach((featureId: string) => {
          formData.append('featureIds', featureId);
        });
      }

      formData.append('removeExistingImage', this.removeExistingImage.toString());

      if (this.selectedFile) {
        formData.append('newCategoryImage', this.selectedFile, this.selectedFile.name);
      }

      this.showSpinner(SpinnerType.BallSpinClockwise);
      this.categoryService.update(formData).then(
        () => {
          this.hideSpinner(SpinnerType.BallSpinClockwise);
          this.toastrService.message('Category updated successfully', 'Success', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
          this.router.navigate(['/admin/categories']);
        },
        (error) => {
          this.hideSpinner(SpinnerType.BallSpinClockwise);
          this.toastrService.message('Failed to update category', 'Error', {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          });
        }
      );
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.removeExistingImage = true;

      const reader = new FileReader();
      reader.onload = e => this.selectedImageUrl = reader.result;
      reader.readAsDataURL(file);
    }
  }


  updateCheckedState(id: string, state: boolean) {
    const category = this.findCategoryById(this.categories, id);
    if (category) {
      category.checked = state;
      if (category.subCategories) {
        category.subCategories.forEach(subCategory => this.updateCheckedState(subCategory.id, state));
      }
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

  onFeatureToggle(featureId: string, checked: boolean) {
    let selectedFeatures = this.categoryForm.value.features || [];
    if (checked) {
      selectedFeatures.push(featureId);
    } else {
      selectedFeatures = selectedFeatures.filter(id => id !== featureId);
    }
    this.categoryForm.patchValue({ features: selectedFeatures });
  }

  async searchCategory(name: string): Promise<Category[]> {
    if (!name || name.length < 3) {
      return [];
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);

    const filters: Filter[] = [{
      field: CategoryFilterByDynamic.Name,
      operator: "contains",
      value: name,
      logic: "",
      filters: [],
    }];

    const dynamicFilter: Filter = {
      field: "",
      operator: "",
      logic: "and",
      filters: filters
    };

    const dynamicQuery: DynamicQuery = {
      sort: [{ field: CategoryFilterByDynamic.Name, dir: "asc" }],
      filter: dynamicFilter
    };

    const pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };

    try {
      const response = await this.categoryService.getCategoriesByDynamicQuery(dynamicQuery, pageRequest);
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      return response.items;
    } catch (error) {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      return [];
    }
  }

  createHierarchy(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Tüm kategorileri bir Map'e ekleyin
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, subCategories: [] });
    });

    // Kategorileri hiyerarşik yapıya yerleştirin
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
