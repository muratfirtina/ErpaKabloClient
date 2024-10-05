import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
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
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { Product } from 'src/app/contracts/product/product';
import { ProductService } from 'src/app/services/common/models/product.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { CreateCartItem } from 'src/app/contracts/cart/createCartItem';
import { CartService } from 'src/app/services/common/models/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainHeaderComponent, CommonModule, NavbarComponent,RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
  mainCategories: Category[] = [];
  carousels: Carousel[] = [];
  currentSlide = 0;
  slideInterval: any; 
  isMobile: boolean = false;
  mostLikedProducts: GetListResponse<Product> 
  defaultProductImage = 'assets/product/ecommerce-default-product.png';

  @ViewChild('categoryGrid') categoryGrid!: ElementRef;


  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  constructor(
    spinner: NgxSpinnerService,
    private categoryService: CategoryService,
    private carouselService: CarouselService,
    private productService: ProductService,
    private productLikeService: ProductLikeService,
    private router: Router,
    private customToasterService: CustomToastrService,
    private authService: AuthService,
    private cartService: CartService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    await this.loadMainCategories();
    await this.loadCarousels();
    await this.loadMostLikedProducts();
    this.hideSpinner(SpinnerType.BallSpinClockwise);
    this.startSlideShow();
    this.checkScreenSize()
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

  async loadMostLikedProducts()
  {
    const pageRequest: PageRequest = { pageIndex: 1, pageSize: 10 };
    this.mostLikedProducts = await this.productService.getMostLikedProducts(10);
    if (this.authService.isAuthenticated) {
      const productIds = this.mostLikedProducts.items.map(p => p.id);
      const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
      
      this.mostLikedProducts.items.forEach(product => {
        product.isLiked = likedProductIds.includes(product.id);
      });
    }

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
  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  scrollLeft() {
    const grid = this.categoryGrid.nativeElement;
    grid.scrollBy({ left: -250, behavior: 'smooth' });
  }

  scrollRight() {
    const grid = this.categoryGrid.nativeElement;
    grid.scrollBy({ left: 250, behavior: 'smooth' });
  }

  async toggleLikeMostLikedProduct(event: Event, mostLikedProduct: Product) {
    event.stopPropagation();
  
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }
  
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      const response = await this.productLikeService.toggleProductLike(mostLikedProduct.id);
      mostLikedProduct.isLiked = response;
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.customToasterService.message(
        mostLikedProduct.isLiked ? 'Ürün beğenildi' : 'Ürün beğenisi kaldırıldı',
        'Başarılı',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
    } catch (error) {
      console.error('Error toggling like for product:', error);
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.customToasterService.message(
        'Beğeni işlemi sırasında bir hata oluştu',
        'Hata',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    }
  }

  async addMostLikedProductToCart(event: Event, mostLikedProduct: Product) {
    event.stopPropagation(); // Ürün detayına yönlendirmeyi engelle
    this.showSpinner(SpinnerType.BallSpinClockwise);
    let createCartItem: CreateCartItem = new CreateCartItem();
    createCartItem.productId = mostLikedProduct.id;
    createCartItem.quantity = 1;
    createCartItem.isChecked = true;
    await this.cartService.add(createCartItem, () => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.customToasterService.message(mostLikedProduct.name + " Sepete eklendi", "", {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
    }, (errorMessage) => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.customToasterService.message("En fazla stok sayısı kadar ürün ekleyebilirsiniz", "", {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
    });
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  getProductImage(product: Product): string {
    if (product.showcaseImage ) {
      return product.showcaseImage.url;
    }
    return this.defaultProductImage;
  }
}