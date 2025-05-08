import { Component, OnInit } from '@angular/core';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Category } from 'src/app/contracts/category/category';
import { BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { FooterComponent } from '../../footer/footer.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { DownbarComponent } from '../../downbar/downbar.component';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { SpinnerComponent } from 'src/app/base/spinner/spinner.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule,
    RouterModule, 
    MainHeaderComponent, 
    NavbarComponent, 
    DownbarComponent,
    FooterComponent,
    BreadcrumbComponent,
    SpinnerComponent],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss'
})
export class CategoriesPageComponent extends BaseComponent implements OnInit {
  categories: Category[] = [];
  totalCategoryCount: number = 0;
  isLoading: boolean = true; // Loading state ekleyin
  loadingProgress: number = 0; // Progress değeri ekleyin

  constructor(
    private breadcrumbService: BreadcrumbService,
    private categoryService: CategoryService,
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.isLoading = true;
    this.loadingProgress = 0;
    
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Categories', url: '/categories' }
    ]);
    
    await this.loadCategories();
  }

  async loadCategories() {
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // Progress değerini artıralım
      this.loadingProgress = 20;
      
      const data = await this.categoryService.getMainCategories(
        { pageIndex: 0, pageSize: 50 }
      );
      
      // Veriler yüklenince progress'i ilerletelim
      this.loadingProgress = 80;
      
      this.categories = data.items;
      this.totalCategoryCount = data.count;
      
      // İşlem tamamlandı
      this.loadingProgress = 100;
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      // Kısa bir gecikme ile loading state'i kapatalım
      setTimeout(() => {
        this.isLoading = false;
        this.hideSpinner(SpinnerType.SquareLoader);
      }, 300);
    }
  }
}