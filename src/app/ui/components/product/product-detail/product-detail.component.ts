import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from 'src/app/contracts/product/product';
import { ProductService } from 'src/app/services/common/models/product.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProductDetailComponent extends BaseComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  currentImageIndex = 0;
  defaultProductImage = 'assets/product/ecommerce-default-product.png';
  private routeSubscription: Subscription;

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
    this.routeSubscription = this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      } else {
        this.customToastrService.message("Ürün ID'si bulunamadı", "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  async loadProduct(id: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      this.product = await this.productService.getById(id, () => {}, () => {});
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    } catch (error) {
      this.customToastrService.message("Ürün yüklenemedi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  nextImage() {
    if (this.product && this.currentImageIndex < this.product.productImageFiles.length - 1) {
      this.currentImageIndex++;
    }
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  getProductImage(product: any): string {
    return product.showcaseImage?.url || this.defaultProductImage;
  }

  getFeatureValueByName(featureName: string): string | undefined {
    return this.product?.productFeatureValues.find(f => f.featureName === featureName)?.featureValueName;
  }

  navigateToRelatedProduct(productId: string) {
    this.router.navigate(['/product', productId]);
  }
}
