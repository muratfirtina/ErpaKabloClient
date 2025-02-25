// product-detail.component.ts
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from 'src/app/contracts/product/product';
import { ProductService } from 'src/app/services/common/models/product.service';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { ProductImageFile } from 'src/app/contracts/product/productImageFile';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from "../../navbar/navbar.component";
import { SafeHtmlPipe } from "../../../../pipes/safe-html.pipe";
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { AuthService } from 'src/app/services/common/auth.service';
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { User } from 'src/app/contracts/user/user';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { DownbarComponent } from '../../downbar/downbar.component';
import { ProductGridComponent } from '../product-grid/product-grid.component';
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';
import { FEATURE_CONFIGS, FeatureType } from 'src/app/enums/featureType';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { FooterComponent } from '../../footer/footer.component';

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
    RouterModule,
    BreadcrumbComponent,
    DownbarComponent,
    ProductGridComponent,
    FooterComponent
]
})
export class ProductDetailComponent extends BaseComponent implements OnInit,OnChanges {
  @Input() productId: string;
  @Input() key: number; // Yeni key input'u ekle

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
  likeCount: number = 0;
  randomProductsLoading: boolean = false;
  randomProductsForBrandLoading: boolean = false;

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
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    if (this.productId) {
      this.loadProduct(this.productId);
      this.loadLikeCount(this.productId);
      this.loadRandomProducts(this.productId);
      this.loadRandomProductsForBrand(this.productId);
      if (this.authService.isAuthenticated) {
        await this.productService.trackProductView(this.productId);
      }
    }
    this.determineVisualFeatures();
    this.isAuthenticated = this.authService.isAuthenticated;
  }
 ngOnChanges(changes: SimpleChanges) {
    if ((changes['productId'] || changes['key']) && this.productId) {
      this.loadProduct(this.productId);
      this.loadLikeCount(this.productId);
      this.loadRandomProducts(this.productId);
      this.loadRandomProductsForBrand(this.productId);
    }
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }

  async loadLikeCount(productId: string) {
    try {
      this.likeCount = await this.productLikeService.getProductLikeCount(productId);
    } catch (error) {
      console.error('Error loading like count:', error);
    }
  }

  async toggleLike(event: Event, product: Product) {
    event.stopPropagation();
    const result = await this.productOperations.toggleLike(product);
    this.likeCount = result.likeCount;
  }

  async addToCart(product: Product) {
    await this.productOperations.addToCart(product, this.quantity);
  }

  // Tıklanabilir kartlar için
  onCardClick(productId: string) {
    this.router.navigate(['/'+productId]);
  }
  
  async loadProduct(productId: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      // URL pattern kontrolü
      if (!productId.includes('-p-')) {
        throw new Error('Invalid product ID format');
      }
  
      this.clearFeatures();
      this.product = await this.productService.getById(productId,()=>{},()=>{});
      
      if (!this.product) {
        throw new Error('Product not found');
      }
  
      // Başarılı yükleme durumunda diğer işlemleri yap
      this.product.relatedProducts = Array.isArray(this.product.relatedProducts) 
        ? this.product.relatedProducts 
        : [];
      
      this.initializeSelectedFeatures();
      this.initializeAllFeatures();
      this.sortAvailableFeatures();
      this.resetCurrentImageIndex();
      this.updateBreadcrumbs();
      
      if (this.isAuthenticated) {
        const isLiked = await this.productLikeService.isProductLiked(productId);
        this.product.isLiked = isLiked;
      }
  
    } catch (error) {
      console.error('Error loading product:', error);
      this.customToastrService.message(
        "Product not found or invalid product ID", 
        "Error", 
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
      this.router.navigate(['/']);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  async loadRandomProducts(productId: string) {
    this.randomProductsLoading = true;
    try {
      if (!productId.includes('-p-')) return;
      
      const response = await this.productService.getRandomProductsByProductId(productId);
      this.randomProducts = response;
      
      if (this.authService.isAuthenticated && this.randomProducts?.items) {
        const productIds = this.randomProducts.items.map(p => p.id);
        const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
        this.randomProducts.items.forEach(product => {
          product.isLiked = likedProductIds.includes(product.id);
        });
      }
    } catch (error) {
      console.error('Error loading random products:', error);
    }
    finally {
      this.randomProductsLoading = false;
    }
  }
  
  async loadRandomProductsForBrand(productId: string) {
    this.randomProductsForBrandLoading = true;
    try {
      if (!productId.includes('-p-')) return;
      
      const response = await this.productService.getRandomProductsForBrandByProductId(productId);
      this.randomProductsForBrands = response;
      
      if (this.authService.isAuthenticated && this.randomProductsForBrands?.items) {
        const productIds = this.randomProductsForBrands.items.map(p => p.id);
        const likedProductIds = await this.productLikeService.getUserLikedProductIds(productIds);
        this.randomProductsForBrands.items.forEach(product => {
          product.isLiked = likedProductIds.includes(product.id);
        });
      }
    } catch (error) {
      console.error('Error loading random brand products:', error);
    } finally {
      this.randomProductsForBrandLoading = false;
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

  private determineVisualFeatures() {
    this.visualFeatures = Object.entries(FEATURE_CONFIGS)
      .filter(([_, config]) => config.isVisual)
      .map(([featureName]) => featureName.toLowerCase());
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

  private sortFeatureValues(featureName: string, values: string[]): string[] {
    const config = FEATURE_CONFIGS[featureName];
    
    if (config?.requiresNumericSort) {
      return values.sort((a, b) => parseFloat(a) - parseFloat(b));
    }
    return values.sort();
  }

  // Görsel özellikler için metodlar
  getFeatureImage(featureName: string, featureValue: string): string {
    if (!this.visualFeatures.includes(featureName.toLowerCase())) {
      return '';
    }
  
    // Ürünün kendi seçili özellikleri ile eşleşiyorsa kendi resmini göster
    if (this.selectedFeatures[featureName] === featureValue && this.product) {
      if (this.product.showcaseImage?.url) {
        return this.product.showcaseImage.url;
      }
      if (this.product.productImageFiles?.length > 0) {
        const showcaseImage = this.product.productImageFiles.find(img => img.showcase);
        return showcaseImage?.url || this.product.productImageFiles[0].url;
      }
    }
  
    // Diğer durumlar için featureImages'dan al
    const featureImages = this.getFeatureImages(featureName);
    const matchingImage = featureImages.find(img => img.value === featureValue);
    return matchingImage ? matchingImage.imageUrl : this.defaultProductImage;
  }

  private getFeatureImages(featureName: string): { value: string, imageUrl: string }[] {
    if (!this.product || !this.sortedAvailableFeatures[featureName]) {
      return [];
    }
  
    const featureConfig = FEATURE_CONFIGS[featureName];
    if (!featureConfig?.isVisual) {
      return [];
    }
  
    // Tek ürün durumu için
    if (!this.product.relatedProducts || this.product.relatedProducts.length === 0) {
      const currentFeatureValue = this.product.productFeatureValues.find(
        f => f.featureName.toLowerCase() === featureName.toLowerCase()
      )?.featureValueName;
  
      if (currentFeatureValue) {
        return [{
          value: currentFeatureValue,
          imageUrl: this.product.showcaseImage?.url || 
                   this.product.productImageFiles?.[0]?.url || 
                   this.defaultProductImage
        }];
      }
      return [];
    }
  
    // Birden fazla varyant durumu için mevcut mantık devam eder
    const sizeFeature = Object.entries(FEATURE_CONFIGS)
      .find(([_, config]) => config.type === FeatureType.SIZE)?.[0];
    
    const selectedSize = sizeFeature ? this.selectedFeatures[sizeFeature] : null;
    const allProducts = [this.product, ...this.product.relatedProducts];
    const sortedFeatureValues = this.sortedAvailableFeatures[featureName];
  
    return sortedFeatureValues.map(featureValue => {
      const productForFeature = this.findMatchingProductForFeature(
        allProducts,
        featureName,
        featureValue,
        sizeFeature,
        selectedSize
      );
  
      let imageUrl = this.defaultProductImage;
      if (productForFeature) {
        imageUrl = productForFeature.showcaseImage?.url || 
                  productForFeature.productImageFiles?.[0]?.url || 
                  this.defaultProductImage;
      }
  
      return {
        value: featureValue,
        imageUrl: imageUrl
      };
    });
  }
  
  private findMatchingProductForFeature(
    products: Product[],
    featureName: string,
    featureValue: string,
    sizeFeature: string | null,
    selectedSize: string | null
  ): Product | null {
    return products.find(product => {
      const hasMatchingFeature = product.productFeatureValues.some(f => 
        f.featureName.toLowerCase() === featureName.toLowerCase() && 
        f.featureValueName === featureValue
      );
  
      const hasSizeMatch = !sizeFeature || !selectedSize || 
        product.productFeatureValues.some(f => 
          f.featureName === sizeFeature && 
          f.featureValueName === selectedSize
        );
  
      return hasMatchingFeature && hasSizeMatch;
    }) || null;
  }

  
  
  /* private getProductImageUrl(product: Product | null): string {
    if (!product) return this.defaultProductImage;
    
    // Önce showcase resmi kontrol et
    if (product.showcaseImage?.url) {
      return product.showcaseImage.url;
    }
    
    // Showcase resmi yoksa, productImageFiles'dan showcase olan veya ilk resmi al
    if (product.productImageFiles?.length > 0) {
      const showcaseImage = product.productImageFiles.find(img => img.showcase);
      return showcaseImage?.url || product.productImageFiles[0].url;
    }
    
    return this.defaultProductImage;
  } */
  

  // Özellik seçimi ve kontrolü
  onFeatureSelect(featureName: string, featureValue: string) {
    if (this.isFeatureValueSelected(featureName, featureValue)) return;
    
    this.selectedFeatures[featureName] = featureValue;
    const matchingProduct = this.findMatchingProduct();
    if (matchingProduct) {
      // Yeni ürün yüklenirken özellikleri temizle
      this.clearFeatures(); 
      this.loadProduct(matchingProduct.id);
    } else {
      this.customToastrService.message(
        "No products found matching the selected features",
        "Information",
        {
          toastrMessageType: ToastrMessageType.Info,
          position: ToastrPosition.TopRight
        }
      );
    }
  }
  
  private clearFeatures() {
    this.allFeatures = {};
    this.selectedFeatures = {};
    this.sortedAvailableFeatures = {};
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
}

  updateBreadcrumbs() {
    if (!this.product) return;
    this.breadcrumbService.setBreadcrumbs([
      { 
        label: this.product.categoryName, 
        url: `/${this.product.categoryId}` 
      },
      { 
        label: this.product.brandName, 
        url: `/${this.product.brandId}` 
      },
      { 
        label: this.product.name + ' ' + this.product.title, 
        url: `/${this.product.id}` 
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