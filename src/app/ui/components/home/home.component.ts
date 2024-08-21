import { Component, OnInit } from '@angular/core';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { extend } from 'jquery';
import { BaseComponent } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { Category } from 'src/app/contracts/category/category';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainHeaderComponent,CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent extends BaseComponent implements OnInit{
  mainCategories: Category[] = [];
  colors: string[] = ['#009688', '#FF3E7F', '#03A9F4', '#FFC107', '#4CAF50', '#9C27B0'];


  constructor(
    spinner:NgxSpinnerService,
    private categoryService: CategoryService
    ) {
    super(spinner);
  }
  async ngOnInit() {
    
    this.loadMainCategories();
  }

  async loadMainCategories(){
    const pageRequest: PageRequest = { pageIndex: -1, pageSize: -1 };
    const response = await this.categoryService.getMainCategories(pageRequest, () => {}, (error) => {});
    this.mainCategories = response.items;


  }
  getColor(index: number): string {
    return this.colors[index % this.colors.length];
  }




}
