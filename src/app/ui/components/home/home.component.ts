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
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';
import { DownbarComponent } from '../downbar/downbar.component';
import { ProductGridComponent } from '../product/product-grid/product-grid.component';
import { FooterComponent } from '../footer/footer.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { DefaultImages } from 'src/app/contracts/defaultImages';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SpinnerComponent } from 'src/app/base/spinner/spinner.component';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { Brand } from 'src/app/contracts/brand/brand';

// Interface for testimonials
interface Testimonial {
  name: string;
  company: string;
  quote: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MainHeaderComponent, 
    CommonModule, 
    NavbarComponent, 
    RouterModule, 
    DownbarComponent, 
    ProductGridComponent, 
    FooterComponent,
    SpinnerComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent implements OnInit, OnDestroy {
  mainCategories: Category[] = [];
  carousels: Carousel[] = [];
  brands: Brand[] = [];
  testimonials: Testimonial[] = [];
  currentSlide = 0;
  slideInterval: any; 
  isMobile: boolean = false;
  mostLikedProducts: GetListResponse<Product>;
  mostViewedProducts: GetListResponse<Product>;
  bestSellingProducts: GetListResponse<Product>;
  randomProducts: GetListResponse<Product>;
  defaultProductImage = DefaultImages.defaultProductImage;
  isLoading: boolean = true;
  loadingProgress: number = 0;

  @ViewChild('categoryGrid') categoryGrid!: ElementRef;
  @ViewChild('testimonialsContainer') testimonialsContainer!: ElementRef;
  @ViewChild('mostLikedSection') mostLikedSection: ElementRef;
  @ViewChild('mostViewedSection') mostViewedSection: ElementRef;
  @ViewChild('bestSellingSection') bestSellingSection: ElementRef;
  @ViewChild('randomSection') randomSection: ElementRef;
  @ViewChild('brandSection') brandSection: ElementRef;
  @ViewChild('featuredVideoSection') featuredVideoSection: ElementRef;

  private observers: IntersectionObserver[] = [];
  
  // Diğer bölümler yüklenmiş mi kontrolü
  private mostLikedLoaded = false;
  private mostViewedLoaded = false;
  private bestSellingLoaded = false;
  private randomLoaded = false;
  private brandLoaded = false;
  private featuredVideoLoaded = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  constructor(
    private spinnerService: SpinnerService, 
    private categoryService: CategoryService,
    private carouselService: CarouselService,
    private brandService: BrandService,
    private productService: ProductService,
    private productLikeService: ProductLikeService,
    private productOperations: ProductOperationsService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
    super(spinnerService);

    // Initialize testimonials
    this.initializeTestimonials();
  }

  private initializeTestimonials() {
    // Sample testimonials
    this.testimonials = [
      {
        name: "Jo*** Ty***",
        company: "Af*** Ma***",
        quote: "Our production line efficiency increased by 30% after implementing their equipment. The technical support team solves our issues promptly."
      },
      {
        name: "Sa*** Jo***",
        company: "Dr*** In***",
        quote: "The quality of industrial components we received exceeded our expectations. Their expert consultants helped us choose the perfect solutions for our facility."
      },
      {
        name: "Mi*** Br***",
        company: "Ea*** Ae***",
        quote: "We've been working with them for over 5 years, and the reliability of their products is unmatched in the industry. Their attention to detail makes all the difference."
      },
      {
        name: "Je*** Da***",
        company: "Gl*** Lo***",
        quote: "The industrial automation systems we purchased have revolutionized our warehouse operations. The ROI was achieved in just 8 months."
      },
      {
        name: "Ro*** Wi***",
        company: "Pr*** En***",
        quote: "Their custom-engineered solutions addressed challenges that other suppliers couldn't solve. The technical expertise of their team is impressive."
      },
      {
        name: "Em*** Ma***",
        company: "St*** In***.",
        quote: "From initial consultation to installation and training, the entire process was smooth and professional. We've already placed orders for additional equipment."
      },
      {
        name: "Da*** Th***",
        company: "Ad*** Ma***",
        quote: "The comprehensive warranty and after-sales service give us peace of mind. When we needed emergency support, their team responded within an hour."
      }
    ];
  }

  async ngOnInit() {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.spinnerService.updateProgress(SpinnerType.SquareLoader, 0);
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // Sadece temel verileri yükleyelim
      await this.loadMainCategories();
      this.loadingProgress = 40;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 40);
      
      await this.loadCarousels();
      this.loadingProgress = 80;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 60);

      await this.loadBrands();
      this.loadingProgress = 40;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 80);
      
      // Ürün verilerini şimdi yüklemiyoruz
      this.loadingProgress = 100;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 100);
      
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      this.hideSpinner(SpinnerType.SquareLoader);
      
      setTimeout(() => {
        this.isLoading = false;
        this.startSlideShow();
        this.checkScreenSize();
        
        // Görünüm hazır olduğunda gözlemcileri kur
        this.setupIntersectionObservers();
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

  // Load brands from the brand service
  async loadBrands() {
    const pageRequest: PageRequest = { pageIndex: -1, pageSize: -1 }; // Get first 6 brands for display
    try {
      const response = await this.brandService.list(
        pageRequest, 
        () => {},
        (error) => {
          // Handle error more gracefully
          console.error('Error loading brands:', error);
          // Don't show any error messages to users - just silently fail
          this.brands = []; // Set brands to empty array so the section won't display
        }
      );
      
      // Only set brands if we actually got results
      if (response && response.items && response.items.length > 0) {
        this.brands = response.items;
      } else {
        this.brands = [];
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      this.brands = []; // Set brands to empty array so the section won't display
    }
  }

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  async loadMostLikedProducts() {
    this.mostLikedProducts = await this.productService.getMostLikedProducts(10);
    if (this.authService.isAuthenticated) {
      const productIds = this.mostLikedProducts.items.map(p => p.id);
      const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
      
      this.mostLikedProducts.items.forEach(product => {
        product.isLiked = likedProductIds.includes(product.id);
      });
    }
  }

  async loadMostViewedProducts() {
    this.mostViewedProducts = await this.productService.getMostViewedProducts(10);
    if (this.authService.isAuthenticated) {
        const productIds = this.mostViewedProducts.items.map(p => p.id);
        const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
        
        this.mostViewedProducts.items.forEach(product => {
            product.isLiked = likedProductIds.includes(product.id);
        });
    }
  }

  async loadBestSellingProducts() {
    this.bestSellingProducts = await this.productService.getBestSellingProducts(10);
    if (this.authService.isAuthenticated) {
        const productIds = this.bestSellingProducts.items.map(p => p.id);
        const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
        
        this.bestSellingProducts.items.forEach(product => {
            product.isLiked = likedProductIds.includes(product.id);
        });
    }
  }

  async loadRandomProducts() {
    this.randomProducts = await this.productService.getRandomProducts(10);
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
    }, 7000); // Change slide every 7 seconds
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
    
    // Reset timer on manual slide change
    this.resetSlideTimer();
  }
  
  private resetSlideTimer() {
    this.stopSlideShow();
    this.startSlideShow();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  async toggleLike(event: Event, product: Product) {
    event.stopPropagation();
    await this.productOperations.toggleLike(product);
  }

  async addToCart(event: Event, product: Product) {
    event.stopPropagation();
    await this.productOperations.addToCart(product);
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  getProductImage(product: Product): string {
    if (product.showcaseImage) {
      return product.showcaseImage.url;
    }
    return this.defaultProductImage;
  }

  // Scroll categories horizontally
  scrollCategories(direction: 'left' | 'right') {
    if (this.categoryGrid && this.categoryGrid.nativeElement) {
      const container = this.categoryGrid.nativeElement;
      const scrollAmount = 205 + 16; // Card width + gap
      
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  }
  
  // Scroll testimonials horizontally
  scrollTestimonials(direction: 'left' | 'right') {
    if (this.testimonialsContainer && this.testimonialsContainer.nativeElement) {
      const container = this.testimonialsContainer.nativeElement;
      const scrollAmount = container.offsetWidth;
      
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  }
  private setupIntersectionObservers() {
    setTimeout(() => {
      // Ürün bölümlerini gözlemle ve görünür olduklarında yükle
      this.observeElement(this.mostLikedSection?.nativeElement, () => {
        if (!this.mostLikedLoaded) {
          this.loadMostLikedProducts();
          this.mostLikedLoaded = true;
        }
      });
      
      this.observeElement(this.mostViewedSection?.nativeElement, () => {
        if (!this.mostViewedLoaded) {
          this.loadMostViewedProducts();
          this.mostViewedLoaded = true;
        }
      });
      
      this.observeElement(this.bestSellingSection?.nativeElement, () => {
        if (!this.bestSellingLoaded) {
          this.loadBestSellingProducts();
          this.bestSellingLoaded = true;
        }
      });
      
      this.observeElement(this.randomSection?.nativeElement, () => {
        if (!this.randomLoaded) {
          this.loadRandomProducts();
          this.randomLoaded = true;
        }
      });
      this.observeElement(this.brandSection?.nativeElement, () => {
        if (!this.brandLoaded) {
          this.loadBrands();
          this.brandLoaded = true;
        }
      });
      this.observeElement(this.featuredVideoSection?.nativeElement, () => {
        if (!this.featuredVideoLoaded) {
          this.featuredVideoLoaded = true;
        }
      });
    }, 500); // DOM elementleri yüklenmesi için kısa bir gecikme
  }
  
  private observeElement(element: HTMLElement, callback: () => void) {
    if (!element) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(element); // Bir kez yüklendikten sonra gözlemlemeyi durdur
        }
      });
    }, { threshold: 0.1 }); // Elementin %10'u görünür olduğunda tetikle
    
    observer.observe(element);
    this.observers.push(observer);
  }

  // Set initial scroll position after view is initialized
  ngAfterViewInit() {
    setTimeout(() => {
      if (this.categoryGrid && this.categoryGrid.nativeElement) {
        this.categoryGrid.nativeElement.scrollLeft = 0;
      }
      
      if (this.testimonialsContainer && this.testimonialsContainer.nativeElement) {
        this.testimonialsContainer.nativeElement.scrollLeft = 0;
      }
    }, 100);
    this.setupIntersectionObservers();
  }
}