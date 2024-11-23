// product-detail.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from 'src/app/contracts/product/product';
import { ProductService } from 'src/app/services/common/models/product.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { ProductImageFile } from 'src/app/contracts/product/productImageFile';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from "../../navbar/navbar.component";
import { SafeHtmlPipe } from "../../../../pipes/safe-html.pipe";
import { ProductDetailTabsComponent } from './product-detail-tabs/product-detail-tabs.component';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { User } from 'src/app/contracts/user/user';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { DownbarComponent } from '../../downbar/downbar.component';
import { ProductGridComponent } from '../product-grid/product-grid.component';
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MainHeaderComponent, 
    NavbarComponent, 
    SafeHtmlPipe, 
    ProductDetailTabsComponent,
    RouterModule,
    BreadcrumbComponent,
    DownbarComponent,
    ProductGridComponent
  ]
})
export class ProductDetailComponent extends BaseComponent implements OnInit {
  product: Product | null = null;
  randomProducts: GetListResponse<Product>;
  randomProductsForBrands: GetListResponse<Product>;
  user: User;
  currentImageIndex = 0;
  defaultProductImage = 'assets/product/ecommerce-default-product.png';
  selectedFeatures: { [key: string]: string } = {};
  sortedAvailableFeatures: { [key: string]: string[] } = {};
  visualFeatures: string[] = [];
  allFeatures: { [key: string]: string[] } = {};
  quantity: number = 1;
  activeTab: string = 'description';
  isImageZoomed: boolean = false;
  isAuthenticated: boolean = false;

  @ViewChild('productGrid') productGrid!: ElementRef;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private customToastrService: CustomToastrService,
    private breadcrumbService: BreadcrumbService,
    private authService: AuthService,
    private productLikeService: ProductLikeService,
    private productOperations: ProductOperationsService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
        this.loadRandomProducts(productId);
        this.loadRandomProductsForBrand(productId);
      } else {
        this.customToastrService.message("Ürün ID'si bulunamadı", "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    });
    this.determineVisualFeatures();
    this.isAuthenticated = this.authService.isAuthenticated;
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }

  async toggleLike(event: Event, product: Product) {
    event.stopPropagation();
    await this.productOperations.toggleLike(product);
  }

  async addToCart(product: Product) {
    await this.productOperations.addToCart(product, this.quantity);
  }

  // Tıklanabilir kartlar için
  onCardClick(productId: string) {
    this.router.navigate(['/product', productId]);
  }
  
  async loadProduct(productId: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      this.product = await this.productService.getById(productId,()=>{},()=>{});
      if (this.product) {
        this.product.relatedProducts = Array.isArray(this.product.relatedProducts) ? this.product.relatedProducts : [];
        this.initializeSelectedFeatures();
        this.initializeAllFeatures();
        this.sortAvailableFeatures();
        this.resetCurrentImageIndex();
        this.updateBreadcrumbs();
        if (this.isAuthenticated) {
          const isLiked = await this.productLikeService.isProductLiked(productId);
          this.product.isLiked = isLiked;
        }
      }
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    } catch (error) {
      this.customToastrService.message("Ürün yüklenirken bir hata oluştu", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  async loadRandomProducts(productId: string) {
    const response = await this.productService.getRandomProductsByProductId(productId);
    this.randomProducts = response;
    if (this.authService.isAuthenticated) {
      const productIds = this.randomProducts.items.map(p => p.id);
      const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
      this.randomProducts.items.forEach(product => {
        product.isLiked = likedProductIds.includes(product.id);
      });
    }
  }

  async loadRandomProductsForBrand(productId: string) {
    const response = await this.productService.getRandomProductsForBrandByProductId(productId);
    this.randomProductsForBrands = response;
    if (this.authService.isAuthenticated) {
      const productIds = this.randomProductsForBrands.items.map(p => p.id);
      const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
      this.randomProductsForBrands.items.forEach(product => {
        product.isLiked = likedProductIds.includes(product.id);
      });
    }
  }

  // Ürün özelliklerini yönetme metodları
  initializeAllFeatures() {
    if (this.product && this.product.relatedProducts) {
      const allProducts = [this.product, ...this.product.relatedProducts];
      allProducts.forEach(product => {
        product.productFeatureValues.forEach(feature => {
          if (!this.allFeatures[feature.featureName]) {
            this.allFeatures[feature.featureName] = [];
          }
          if (!this.allFeatures[feature.featureName].includes(feature.featureValueName)) {
            this.allFeatures[feature.featureName].push(feature.featureValueName);
          }
        });
      });
    }
  }

  determineVisualFeatures() {
    this.visualFeatures = ['renk'];
  }

  initializeSelectedFeatures() {
    if (this.product) {
      for (let feature of this.product.productFeatureValues) {
        this.selectedFeatures[feature.featureName] = feature.featureValueName;
      }
    }
  }

  sortAvailableFeatures() {
    if (this.product && this.product.availableFeatures) {
      for (const [featureName, values] of Object.entries(this.product.availableFeatures)) {
        this.sortedAvailableFeatures[featureName] = this.sortFeatureValues(featureName, values);
      }
    }
  }

  sortFeatureValues(featureName: string, values: string[]): string[] {
    if (featureName.toLowerCase() === 'numara' || featureName.toLowerCase() === 'beden') {
      return values.sort((a, b) => parseFloat(a) - parseFloat(b));
    }
    return values.sort();
  }

  // Görsel özellikler için metodlar
  getFeatureImage(featureName: string, featureValue: string): string {
    if (this.visualFeatures.includes(featureName.toLowerCase())) {
      const featureImages = this.getFeatureImages(featureName);
      const matchingImage = featureImages.find(img => img.value === featureValue);
      return matchingImage ? matchingImage.imageUrl : this.defaultProductImage;
    }
    return '';
  }

  getFeatureImages(featureName: string): { value: string, imageUrl: string }[] {
    if (!this.product || !this.product.relatedProducts || !this.sortedAvailableFeatures[featureName]) 
      return [];

    const selectedNumara = this.selectedFeatures['Numara'];
    const allProducts = [this.product, ...this.product.relatedProducts];
    const sortedFeatureValues = this.sortedAvailableFeatures[featureName];

    return sortedFeatureValues.map(featureValue => {
      const matchingProduct = allProducts.find(product => 
        product.productFeatureValues.some(f => 
          f.featureName === 'Numara' && f.featureValueName === selectedNumara) &&
        product.productFeatureValues.some(f => 
          f.featureName.toLowerCase() === featureName.toLowerCase() && 
          f.featureValueName === featureValue)
      );

      let imageUrl = this.defaultProductImage;
      if (matchingProduct) {
        imageUrl = this.findShowcaseImage(matchingProduct.productImageFiles) || 
                  (matchingProduct.showcaseImage ? matchingProduct.showcaseImage.url : 
                  this.defaultProductImage);
      }

      return { value: featureValue, imageUrl };
    });
  }

  // Özellik seçimi ve kontrolü
  onFeatureSelect(featureName: string, featureValue: string) {
    if (this.isFeatureValueSelected(featureName, featureValue)) return;
    
    this.selectedFeatures[featureName] = featureValue;
    const matchingProduct = this.findMatchingProduct();
    if (matchingProduct) {
      this.loadProduct(matchingProduct.id);
    } else {
      this.customToastrService.message(
        "Seçilen özelliklere uygun ürün bulunamadı", 
        "Bilgi",
        {
          toastrMessageType: ToastrMessageType.Info,
          position: ToastrPosition.TopRight
        }
      );
    }
  }

  isFeatureValueSelected(featureName: string, featureValue: string): boolean {
    return this.selectedFeatures[featureName] === featureValue;
  }

  findMatchingProduct(): Product | null {
    if (!this.product) return null;
    
    const allProducts = [this.product, ...this.product.relatedProducts];
    return allProducts.find(product => 
      product.productFeatureValues.every(feature => 
        this.selectedFeatures[feature.featureName] === feature.featureValueName
      )
    ) || null;
  }

  // Resim yönetimi metodları
  resetCurrentImageIndex() {
    this.currentImageIndex = 0;
    if (this.product && (!this.product.productImageFiles || 
        this.product.productImageFiles.length === 0)) {
      this.currentImageIndex = -1;
    }
  }

  toggleImageZoom() {
    this.isImageZoomed = !this.isImageZoomed;
  }

  nextImage(event: Event) {
    event.stopPropagation();
    if (this.product?.productImageFiles && 
        this.currentImageIndex < this.product.productImageFiles.length - 1) {
      this.currentImageIndex++;
    }
  }

  prevImage(event: Event) {
    event.stopPropagation();
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  selectImage(index: number) {
    if (this.product?.productImageFiles && 
        index >= 0 && 
        index < this.product.productImageFiles.length) {
      this.currentImageIndex = index;
    }
  }

  findShowcaseImage(productImageFiles: ProductImageFile[]): string {
    if (!productImageFiles) return '';
    const showcaseImage = productImageFiles.find(img => img.showcase === true);
    return showcaseImage ? showcaseImage.url : '';
  }

  // Yardımcı metodlar
  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY' 
    }).format(value);
  }

  updateBreadcrumbs() {
    if (!this.product) return;
    this.breadcrumbService.setBreadcrumbs([
      { 
        label: this.product.categoryName, 
        url: `/category/${this.product.categoryId}` 
      },
      { 
        label: this.product.brandName, 
        url: `/brand/${this.product.brandId}` 
      },
      { 
        label: this.product.name + ' ' + this.product.title, 
        url: `/product/${this.product.id}` 
      }
    ]);
  }

  // Miktar kontrolü
  increaseQuantity() {
    if (this.quantity < 10) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
  getProductImage(product: Product): string {
    if (product.showcaseImage) {
      return product.showcaseImage.url;
    }
    return this.defaultProductImage;
  }

  scrollLeft() {
    if (this.productGrid) {
      this.productGrid.nativeElement.scrollBy({ left: -250, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.productGrid) {
      this.productGrid.nativeElement.scrollBy({ left: 250, behavior: 'smooth' });
    }
  }

  // Ürün işlemleri
  async toggleLikeRandomProductForBrand(event: Event, product: Product) {
    event.stopPropagation();
    await this.productOperations.toggleLike(product);
  }

  async addRandomProductForBrandToCart(event: Event, product: Product) {
    event.stopPropagation();
    await this.productOperations.addToCart(product);
  }

  // ProductOperationsService kullanımına geçiş
  async onProductAddToCart(product: Product) {
    await this.productOperations.addToCart(product);
  }

  async onProductLike(product: Product) {
    await this.productOperations.toggleLike(product);
  }
}