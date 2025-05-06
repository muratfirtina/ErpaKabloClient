import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
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
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';
import { DownbarComponent } from '../downbar/downbar.component';
import { ProductGridComponent } from '../product/product-grid/product-grid.component';
import { FooterComponent } from '../footer/footer.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { DefaultImages } from 'src/app/contracts/defaultImages';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SpinnerComponent } from 'src/app/base/spinner/spinner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainHeaderComponent, CommonModule, NavbarComponent, RouterModule, DownbarComponent, ProductGridComponent, FooterComponent,SpinnerComponent],
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
  mostViewedProducts: GetListResponse<Product>;
  bestSellingProducts: GetListResponse<Product>;
  randomProducts: GetListResponse<Product>;
  defaultProductImage = DefaultImages.defaultProductImage;
  isLoading: boolean = true;
  loadingProgress: number = 0;

  @ViewChild('categoryGrid') categoryGrid!: ElementRef;


  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  constructor(
    private spinnerService: SpinnerService, 
    private categoryService: CategoryService,
    private carouselService: CarouselService,
    private productService: ProductService,
    private productLikeService: ProductLikeService,
    private productOperations: ProductOperationsService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
    super(spinnerService);
  }

  async ngOnInit() {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.spinnerService.updateProgress(SpinnerType.SquareLoader, 0);
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // Ana kategorileri yükle
      await this.loadMainCategories();
      this.loadingProgress = 15;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 15);
      
      // Carouselleri yükle
      await this.loadCarousels();
      this.loadingProgress = 30;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 30);
      
      // En çok beğenilen ürünleri yükle
      await this.loadMostLikedProducts();
      this.loadingProgress = 50;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 50);
      
      // En çok görüntülenen ürünleri yükle
      await this.loadMostViewedProducts();
      this.loadingProgress = 65;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 65);
      
      // En çok satan ürünleri yükle
      await this.loadBestSellingProducts();
      this.loadingProgress = 80;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 80);
      
      // Rastgele ürünleri yükle
      await this.loadRandomProducts();
      this.loadingProgress = 100;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 100);
      
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      this.hideSpinner(SpinnerType.SquareLoader);
      
      // Küçük bir gecikme ile yükleme durumunu kapat
      setTimeout(() => {
        this.isLoading = false;
        this.startSlideShow();
        this.checkScreenSize();
      }, 300);
    }
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
    
    // Process video URLs
    this.carousels.forEach(carousel => {
      // Check if this is a video carousel
      if (carousel.mediaType === 'video') {
        carousel.isVideo = true;
        
        if (carousel.videoType === 'youtube') {
          // Extract YouTube video ID from URL
          const videoIdMatch = carousel.videoUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (videoIdMatch && videoIdMatch[1]) {
            carousel.videoId = videoIdMatch[1];
          }
        } 
        else if (carousel.videoType === 'vimeo') {
          // Extract Vimeo video ID from URL
          const videoIdMatch = carousel.videoUrl?.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|)(\d+)(?:|\/\?)/);
          if (videoIdMatch && videoIdMatch[1]) {
            carousel.videoId = videoIdMatch[1];
          }
        }
      }
    });
  }
  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  async loadMostLikedProducts()
  {
    this.mostLikedProducts = await this.productService.getMostLikedProducts(20);
    if (this.authService.isAuthenticated) {
      const productIds = this.mostLikedProducts.items.map(p => p.id);
      const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
      
      this.mostLikedProducts.items.forEach(product => {
        product.isLiked = likedProductIds.includes(product.id);
      });
    }

  }
  async loadMostViewedProducts() {
    this.mostViewedProducts = await this.productService.getMostViewedProducts(20);
    if (this.authService.isAuthenticated) {
        const productIds = this.mostViewedProducts.items.map(p => p.id);
        const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
        
        this.mostViewedProducts.items.forEach(product => {
            product.isLiked = likedProductIds.includes(product.id);
        });
    }
  }
  async loadBestSellingProducts() {
    this.bestSellingProducts = await this.productService.getBestSellingProducts(20);
    if (this.authService.isAuthenticated) {
        const productIds = this.bestSellingProducts.items.map(p => p.id);
        const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
        
        this.bestSellingProducts.items.forEach(product => {
            product.isLiked = likedProductIds.includes(product.id);
        });
    }
}

async loadRandomProducts() {
    this.randomProducts = await this.productService.getRandomProducts(20);
    if (this.authService.isAuthenticated) {
        const productIds = this.randomProducts.items.map(p => p.id);
        const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
        
        this.randomProducts.items.forEach(product => {
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



  async toggleLikeMostLikedProduct(event: Event, mostLikedProduct: Product) {
    event.stopPropagation();
    await this.productOperations.toggleLike(mostLikedProduct);
  }

  async addMostLikedProductToCart(event: Event, mostLikedProduct: Product) {
    event.stopPropagation();
    await this.productOperations.addToCart(mostLikedProduct);
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
  // Kategori grid'inin scroll işlemini yönetecek fonksiyon
scrollCategories(direction: 'left' | 'right') {
  if (this.categoryGrid && this.categoryGrid.nativeElement) {
    const container = this.categoryGrid.nativeElement;
    const scrollAmount = 205 + 16; // Kart genişliği + gap
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  }
}

// ngAfterViewInit içinde başlangıç scroll pozisyonunu sıfırlayın
ngAfterViewInit() {
  setTimeout(() => {
    if (this.categoryGrid && this.categoryGrid.nativeElement) {
      this.categoryGrid.nativeElement.scrollLeft = 0;
    }
  }, 100);
}
}