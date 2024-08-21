import { Component, OnInit } from '@angular/core';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { extend } from 'jquery';
import { BaseComponent } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CategoryService } from 'src/app/services/common/models/category.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainHeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent extends BaseComponent implements OnInit{

  constructor(
    spinner:NgxSpinnerService,
    private categoryService: CategoryService
    ) {
    super(spinner);
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

 
    //burada ana kategorileri getireceğiz yani parentCategoryId si null olanları




}
