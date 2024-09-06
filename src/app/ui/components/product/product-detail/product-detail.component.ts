import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from 'src/app/contracts/product/product';
import { ProductService } from 'src/app/services/common/models/product.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { ProductImageFile } from 'src/app/contracts/product/productImageFile';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from "../../navbar/navbar.component";
import { SafeHtmlPipe } from "../../../../pipes/safe-html.pipe";

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, MainHeaderComponent, NavbarComponent, SafeHtmlPipe]
})
export class ProductDetailComponent extends BaseComponent implements OnInit {
  product: Product | null = null;
  currentImageIndex = 0;
  defaultProductImage = 'assets/product/ecommerce-default-product.png';
  selectedFeatures: { [key: string]: string } = {};
  sortedAvailableFeatures: { [key: string]: string[] } = {};
  visualFeatures: string[] = [];
  allFeatures: { [key: string]: string[] } = {};
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private customToastrService: CustomToastrService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    } else {
      this.customToastrService.message("Ürün ID'si bulunamadı", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
    this.determineVisualFeatures();

    
  }

  async loadProduct(id: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      this.product = await this.productService.getById(id, () => {}, () => {});
      if (this.product) {
        this.product.relatedProducts = Array.isArray(this.product.relatedProducts) ? this.product.relatedProducts : [];
        this.initializeSelectedFeatures();
        this.initializeAllFeatures();
        this.sortAvailableFeatures();
        this.resetCurrentImageIndex();
      }
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    } catch (error) {
      // Hata işleme kodu...
    }
  }
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

  getFeatureImage(featureName: string, featureValue: string): string {
    if (this.visualFeatures.includes(featureName.toLowerCase())) {
      const featureImages = this.getFeatureImages(featureName);
      const matchingImage = featureImages.find(img => img.value === featureValue);
      return matchingImage ? matchingImage.imageUrl : this.defaultProductImage;
    }
    return '';
  }

  determineVisualFeatures() {
    // Bu metod, hangi özelliklerin görsel içereceğini belirler
    // Şu an sadece 'renk' özelliğini içeriyor, ancak daha fazla eklenebilir
    this.visualFeatures = ['renk'];
  }

  getFeatureImages(featureName: string): { value: string, imageUrl: string }[] {
    if (!this.product || !this.product.relatedProducts || !this.sortedAvailableFeatures[featureName]) return [];

    const selectedNumara = this.selectedFeatures['Numara'];
    const allProducts = [this.product, ...this.product.relatedProducts];

    // Renk seçeneklerini sabit sırada tutmak için sortedAvailableFeatures kullanıyoruz
    const sortedFeatureValues = this.sortedAvailableFeatures[featureName];

    return sortedFeatureValues.map(featureValue => {
      const matchingProduct = allProducts.find(product => 
        product.productFeatureValues.some(f => f.featureName === 'Numara' && f.featureValueName === selectedNumara) &&
        product.productFeatureValues.some(f => f.featureName.toLowerCase() === featureName.toLowerCase() && f.featureValueName === featureValue)
      );

      let imageUrl = this.defaultProductImage;
      if (matchingProduct) {
        imageUrl = this.findShowcaseImage(matchingProduct.productImageFiles) || 
                   (matchingProduct.showcaseImage ? matchingProduct.showcaseImage.url : this.defaultProductImage);
      }

      return { value: featureValue, imageUrl };
    });
  }

  findShowcaseImage(productImageFiles: any[]): string {
    if (!productImageFiles) {
      return '';
    }
    const showcaseImage = productImageFiles.find(img => img.showcase === true);
    if (showcaseImage) {
      return showcaseImage.url;
    } else {
      return '';
    }
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
      return values.sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        return numA - numB;
      });
    } else {
      return values.sort();
    }
  }

  onFeatureSelect(featureName: string, featureValue: string) {
    if (this.isFeatureValueSelected(featureName, featureValue)) {
      return;
    }
    
    this.selectedFeatures[featureName] = featureValue;
    const matchingProduct = this.findMatchingProduct();
    if (matchingProduct) {
      this.loadProduct(matchingProduct.id);
    } else {
      this.customToastrService.message("Seçilen özelliklere uygun ürün bulunamadı", "Bilgi", {
        toastrMessageType: ToastrMessageType.Info,
        position: ToastrPosition.TopRight
      });
    }
  }

  isFeatureValueSelected(featureName: string, featureValue: string): boolean {
    return this.selectedFeatures[featureName] === featureValue;
  }

  isFeatureValueAvailable(featureName: string, featureValue: string): boolean {
    if (this.product) {
      const allProducts = [this.product, ...(Array.isArray(this.product.relatedProducts) ? this.product.relatedProducts : [])];
      return allProducts.some(variant =>
        variant.productFeatureValues.some(feature =>
          feature.featureName === featureName && feature.featureValueName === featureValue
        )
      );
    }
    return false;
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

  resetCurrentImageIndex() {
    this.currentImageIndex = 0;
    if (this.product && (!this.product.productImageFiles || this.product.productImageFiles.length === 0)) {
      this.currentImageIndex = -1;
    }
  }

  onRelatedProductClick(relatedProduct: Product) {
    this.loadProduct(relatedProduct.id);
  }


  nextImage() {
    if (this.product && this.product.productImageFiles && this.currentImageIndex < this.product.productImageFiles.length - 1) {
      this.currentImageIndex++;
    }
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  selectImage(index: number) {
    if (this.product && this.product.productImageFiles && index >= 0 && index < this.product.productImageFiles.length) {
      this.currentImageIndex = index;
    }
  }

  getProductImage(product: Product): string {
    if (product.productImageFiles && product.productImageFiles.length > 0) {
      return product.productImageFiles[0].url;
    }
    return this.defaultProductImage;
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }
}