import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from 'src/app/contracts/category/category';
import { DefaultImages } from 'src/app/contracts/defaultImages';
import { CategoryService } from 'src/app/services/common/models/category.service';

@Component({
  selector: 'app-categories-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories-sidebar.component.html',
  styleUrl: './categories-sidebar.component.scss'
})
export class CategoriesSidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();
  mainCategories: Category[] = [];
  defaultCategoryImage = DefaultImages.defaultCategoryImage || '../../../../../assets/icons/category/ecommerce-default-category.png';

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadMainCategories();
  }

  async loadMainCategories() {
    try {
      const response = await this.categoryService.getMainCategories({ pageIndex: -1, pageSize: -1 });
      this.mainCategories = response.items;
      
      // Konsola hata ayıklama bilgisi
      console.log('Loaded categories:', this.mainCategories);
      
      // Kategoriler için resim kontrolü
      this.mainCategories.forEach(category => {
        if (!category.categoryImage) {
          console.log(`Category ${category.name} has no image`);
        }
      });
    } catch (error) {
      console.error('Error loading main categories:', error);
      this.mainCategories = []; // Hata durumunda boş array'e ayarla
    }
  }

  close() {
    this.closeSidebar.emit();
  }

  navigateToCategory(categoryId: string) {
    this.router.navigate(['/' + categoryId]);
    this.close();
  }
}