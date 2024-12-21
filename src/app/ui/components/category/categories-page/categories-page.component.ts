import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
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

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule,
    RouterModule, 
    MainHeaderComponent, 
    NavbarComponent, 
    DownbarComponent,
    FooterComponent,
    BreadcrumbComponent],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss'
})
export class CategoriesPageComponent extends BaseComponent implements OnInit {
  categories: Category[] = [];
  totalCategoryCount: number = 0;

  constructor(
    private breadcrumbService: BreadcrumbService,
    private categoryService: CategoryService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Categories', url: '/categories' }
    ]);
    await this.loadCategories();
  }

  async loadCategories() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      const data = await this.categoryService.getMainCategories(
        { pageIndex: 0, pageSize: 50 }
      );
      this.categories = data.items;
      this.totalCategoryCount = data.count;
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
}