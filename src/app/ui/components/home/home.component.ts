import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { CarouselService } from 'src/app/services/common/models/carousel.service';
import { Category } from 'src/app/contracts/category/category';
import { Carousel } from 'src/app/contracts/carousel/carousel';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainHeaderComponent, CommonModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
  mainCategories: Category[] = [];
  carousels: Carousel[] = [];
  currentSlide = 0;
  slideInterval: any;

  constructor(
    spinner: NgxSpinnerService,
    private categoryService: CategoryService,
    private carouselService: CarouselService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    await this.loadMainCategories();
    await this.loadCarousels();
    this.hideSpinner(SpinnerType.BallSpinClockwise);
    this.startSlideShow();
  }

  ngOnDestroy() {
    this.stopSlideShow();
  }

  async loadMainCategories() {
    const pageRequest: PageRequest = { pageIndex: -1, pageSize: -1 };
    const response = await this.categoryService.getMainCategories(pageRequest, () => {}, (error) => {});
    this.mainCategories = response.items;
  }

  async loadCarousels() {
    const pageRequest: PageRequest = { pageIndex: -1, pageSize: -1 };
    const response = await this.carouselService.list(pageRequest, () => {}, (error) => {});
    this.carousels = response.items;
  }

  startSlideShow() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 7000); // Her 7 saniyede bir slayt değişir
  }

  stopSlideShow() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.carousels.length;
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.carousels.length) % this.carousels.length;
  }

  setCurrentSlide(index: number) {
    this.currentSlide = index;
  }
}