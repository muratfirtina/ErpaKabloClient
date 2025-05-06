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
import { AnalyticsService } from 'src/app/services/common/analytics.services';
import { DefaultImages } from 'src/app/contracts/defaultImages';
import { SpinnerComponent } from 'src/app/base/spinner/spinner.component';

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
    FooterComponent,
    SpinnerComponent 
  ]
})
export class ProductDetailComponent extends BaseComponent implements OnInit, OnChanges {
  @Input() productId: string;
  @Input() key: number; // Yeni key input'u ekle

  product: Product | null = null;
  randomProducts: GetListResponse<Product>;
  randomProductsForBrands: GetListResponse<Product>;
  user: User;
  currentImageIndex = 0;
  defaultProductImageUrl = DefaultImages.defaultProductImage;
  selectedFeatures: { [key: string]: string } = {};
  sortedAvailableFeatures: { [key: string]: string[] } = {};
  visualFeatures: string[] = [];
  allFeatures: { [key: string]: string[] } = {};
  quantity: number = 1;
  activeTab: string = 'description';
  isImageZoomed: boolean = false;
  isAuthenticated: boolean = false;
  isAdmin: boolean = false;
  likeCount: number = 0;
  randomProductsLoading: boolean = false;
  randomProductsForBrandLoading: boolean = false;
  
  // Yeni değişkenler
  isLoading: boolean = true;
  loadingProgress: number = 0;

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
    private analyticsService: AnalyticsService,
    private spinnerService: SpinnerService // 'spinner' yerine 'private spinnerService' kullan
  ) {
    super(spinnerService);
  }

  async ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated;
    this.isAdmin = this.authService.isAdmin;
  
    this.determineVisualFeatures();
    this.isAuthenticated = this.authService.isAuthenticated;
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['productId'] || changes['key']) && this.productId) {
      this.loadData();
    }
  }

  // Tüm veri yükleme işlemlerini sıralı olarak yönetmek için yeni metod
  async loadData() {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.spinnerService.updateProgress(SpinnerType.SquareLoader, 0);
  
    try {
      // Ana ürün verisini yükle
      await this.loadProduct(this.productId);
      this.loadingProgress = 25;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 25);
      
      // Beğeni sayısını yükle
      await this.loadLikeCount(this.productId);
      this.loadingProgress = 50;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 50);
      
      // Rastgele ürünleri yükle
      await this.loadRandomProducts(this.productId);
      this.loadingProgress = 75;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 75);
      
      // Marka için rastgele ürünleri yükle
      await this.loadRandomProductsForBrand(this.productId);
      this.loadingProgress = 100;
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, 100);
      
      // Görüntülenme istatistiği kaydet
      if (this.authService.isAuthenticated) {
        await this.productService.trackProductView(this.productId);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      this.customToastrService.message(
        "Ürün verisi yüklenirken bir hata oluştu", 
        "Hata", 
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    } finally {
      // İşlem tamamlandıktan sonra küçük bir gecikme ile yükleme durumunu kapat
      setTimeout(() => {
        this.isLoading = false;
      }, 300);
    }
  }

  navigateToProductUpdate(productId: string) {
    if (productId) {
      this.router.navigate(['/admin/products/product-update', productId]);
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
    this.router.navigate(['/' + productId]);
  }
  
  async loadProduct(productId: string) {
    this.showSpinner(SpinnerType.SquareLoader);
    try {
      // URL pattern kontrolü
      if (!productId.includes('-p-')) {
        throw new Error('Invalid product ID format');
      }
  
      // Clear previous data
      this.clearFeatures();
      
      // Load the product and its variants
      this.product = await this.productService.getById(productId, () => {}, () => {});
              
      if (!this.product) {
        throw new Error('Product not found');
      }
    
      // Ensure relatedProducts is an array
      this.product.relatedProducts = Array.isArray(this.product.relatedProducts) 
        ? this.product.relatedProducts 
        : [];
                
      // Initialize product features
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
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  initializeAllFeatures() {    
    if (!this.product) {
      console.warn("Product not found, features couldn't be loaded");
      return;
    }
    
    // Ensure this.allFeatures is initialized
    this.allFeatures = {};
    
    // First add the main product's features
    if (this.product.productFeatureValues && this.product.productFeatureValues.length > 0) {
      this.product.productFeatureValues.forEach(feature => {
        if (!this.allFeatures[feature.featureName]) {
          this.allFeatures[feature.featureName] = [];
        }
        if (!this.allFeatures[feature.featureName].includes(feature.featureValueName)) {
          this.allFeatures[feature.featureName].push(feature.featureValueName);
        }
      });
    }
    
    // Then add features from related products (variants)
    if (this.product.relatedProducts && this.product.relatedProducts.length > 0) {
      
      this.product.relatedProducts.forEach((relatedProduct, index) => {
        if (relatedProduct.productFeatureValues && relatedProduct.productFeatureValues.length > 0) {          
          relatedProduct.productFeatureValues.forEach(feature => {
            if (!this.allFeatures[feature.featureName]) {
              this.allFeatures[feature.featureName] = [];
            }
            if (!this.allFeatures[feature.featureName].includes(feature.featureValueName)) {
              this.allFeatures[feature.featureName].push(feature.featureValueName);
            }
          });
        } else {
          console.warn(`Variant ${index + 1} has no features`);
        }
      });
    } else {
      console.log("No related products (variants) found");
    }
    
    // Sort each feature's values
    Object.keys(this.allFeatures).forEach(featureName => {
      this.allFeatures[featureName] = this.sortFeatureValues(featureName, this.allFeatures[featureName]);
    });
  }

  isFeatureValueCompatible(featureName: string, featureValue: string): boolean {
    // Eğer bu özellik zaten bu değerle seçiliyse, uyumludur
    if (this.selectedFeatures[featureName] === featureValue) {
      return true;
    }
    
    // Mevcut seçimlerin bir kopyasını oluştur ve test et
    const testSelections = { ...this.selectedFeatures };
    testSelections[featureName] = featureValue;
    
    // Tüm ürünleri topla (ana ürün + varyantlar)
    if (!this.product) return false;
    const allProducts = [this.product, ...(this.product.relatedProducts || [])];
    
    // Bu test seçimleriyle eşleşen herhangi bir ürün var mı kontrol et
    return allProducts.some(product => {
      if (!product || !Array.isArray(product.productFeatureValues)) {
        return false;
      }
      
      // Test seçimlerindeki tüm özellik adları
      const featureNames = Object.keys(testSelections);
      
      // Tüm test özelliklerinin bu ürünün özellikleriyle eşleşip eşleşmediğini kontrol et
      return featureNames.every(name => {
        // Bu özellik henüz seçilmemişse kontrolü atla
        if (name !== featureName && !testSelections[name]) {
          return true;
        }
        
        // Üründe eşleşen bir özellik bul
        const productFeature = product.productFeatureValues.find(
          feature => feature.featureName === name
        );
        
        // Özelliğin bulunup bulunmadığını ve doğru değere sahip olup olmadığını kontrol et
        return productFeature && 
               productFeature.featureValueName === testSelections[name];
      });
    });
  }

  onFeatureSelect(featureName: string, featureValue: string) {
    // Zaten seçili olan değeri tekrar seçmeye gerek yok
    if (this.isFeatureValueSelected(featureName, featureValue)) {
      return;
    }
    
    // Ana ürün ve varyantlarını kontrol et
    if (!this.product) {
      console.warn("onFeatureSelect: Ürün yok");
      return;
    }
    
    // ÖNEMLİ: Sadece mevcut ürünün varyantları arasında arama yap
    // Mevcut ürünün varyantlarını topla
    const productVariants = this.product.relatedProducts || [];
    
    // Seçilen özellik değerine sahip bir varyant bul
    const matchingVariant = productVariants.find(variant => {
      if (!variant || !Array.isArray(variant.productFeatureValues)) {
        return false;
      }
      
      // Seçilen özellik değeriyle eşleşen bir varyant ara
      return variant.productFeatureValues.some(
        feature => feature.featureName === featureName && 
                  feature.featureValueName === featureValue
      );
    });
    
    if (matchingVariant) {
      console.log(`Seçilen "${featureValue}" değeriyle eşleşen varyant bulundu:`, matchingVariant.id);
      
      // Bulunan varyanta yönlendir
      this.router.navigate([`/${matchingVariant.id}`]);
    } else {
      // Mevcut ana üründe kontrol et (ana ürünün kendisi de bir varyant olabilir)
      const isFeatureInMainProduct = this.product.productFeatureValues && 
        this.product.productFeatureValues.some(
          feature => feature.featureName === featureName && 
                    feature.featureValueName === featureValue
        );
        
      if (isFeatureInMainProduct) {
        // Ana ürün kendisi bu özelliğe sahip, zaten oradayız
        console.log(`Seçilen "${featureValue}" değeri zaten ana üründe mevcut`);
        return;
      }
      
      console.warn(`"${featureName}: ${featureValue}" ile eşleşen varyant bulunamadı`);
      this.customToastrService.message(
        `"${featureName}: ${featureValue}" özelliği ile eşleşen varyant bulunamadı`,
        "Bilgi",
        {
          toastrMessageType: ToastrMessageType.Info,
          position: ToastrPosition.TopRight
        }
      );
    }
  }

  findMatchingProduct(): Product | null {
    if (!this.product) {
      console.warn("Cannot find matching product - product doesn't exist");
      return null;
    }
        
    // Gather all products (main + variants)
    const allProducts = [this.product, ...(this.product.relatedProducts || [])];
    
    // Look for a product that matches all selected features
    const matchingProduct = allProducts.find(product => {
      if (!product || !Array.isArray(product.productFeatureValues)) {
        return false;
      }
      
      // Get all feature names that need to be matched
      const featureNames = Object.keys(this.selectedFeatures);
      
      // Check if all selected features match this product's features
      const isMatch = featureNames.every(featureName => {
        // Try to find the matching feature in the product
        const productFeature = product.productFeatureValues.find(
          feature => feature.featureName === featureName
        );
        
        // Check if the feature was found and has the correct value
        const featureMatches = productFeature && 
                              productFeature.featureValueName === this.selectedFeatures[featureName];
        
        if (!featureMatches) {
          console.log(`Product ${product.id} doesn't match - ${featureName}: ` + 
                    `${productFeature?.featureValueName || 'not found'} != ${this.selectedFeatures[featureName]}`);
        }
        
        return featureMatches;
      });
      
      if (isMatch) {
        console.log("Found matching product:", product.id);
      }
      
      return isMatch;
    });
    
    return matchingProduct || null;
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
  private determineVisualFeatures() {
    this.visualFeatures = Object.entries(FEATURE_CONFIGS)
      .filter(([_, config]) => config.isVisual)
      .map(([featureName]) => featureName.toLowerCase());
  }

  initializeSelectedFeatures() {
    if (this.product && Array.isArray(this.product.productFeatureValues)) {
      // Clear previous selections
      this.selectedFeatures = {};
      
      // Set initial selections based on current product features
      for (let feature of this.product.productFeatureValues) {
        this.selectedFeatures[feature.featureName] = feature.featureValueName;
      }
    }
  }

  sortAvailableFeatures() {
    this.sortedAvailableFeatures = {};
    
    // If we have availableFeatures from the API response, use those
    if (this.product && this.product.availableFeatures) {      
      for (const [featureName, values] of Object.entries(this.product.availableFeatures)) {
        this.sortedAvailableFeatures[featureName] = this.sortFeatureValues(featureName, values);
      }
    } 
    // Otherwise, use the features we've built from the product + variants
    else if (this.allFeatures) {
      
      for (const [featureName, values] of Object.entries(this.allFeatures)) {
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
  
    // Diğer durumlar için ilgili varyantın resmini bul
    const featureImages = this.getFeatureImages(featureName);
    const matchingImage = featureImages.find(img => img.value === featureValue);
    return matchingImage ? matchingImage.imageUrl : this.defaultProductImageUrl;
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
                   this.defaultProductImageUrl
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
  
      let imageUrl = this.defaultProductImageUrl;
      if (productForFeature) {
        imageUrl = productForFeature.showcaseImage?.url || 
                  productForFeature.productImageFiles?.[0]?.url || 
                  this.defaultProductImageUrl;
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

  isProductAvailable(product: Product): boolean {
    return product.stock === -1 || product.stock > 0;
  }

  // Özellik seçimi ve kontrolü
  private clearFeatures() {
    this.allFeatures = {};
    this.selectedFeatures = {};
    this.sortedAvailableFeatures = {};
  }

  isFeatureValueSelected(featureName: string, featureValue: string): boolean {
    return this.selectedFeatures[featureName] === featureValue;
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
    if (value === undefined || value === 0) return '*Please Request Quote';
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
    return this.defaultProductImageUrl;
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