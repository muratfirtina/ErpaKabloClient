import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base/base.component';
import { CreateCartItem } from 'src/app/contracts/cart/createCartItem';
import { Product } from 'src/app/contracts/product/product';
import { AuthService } from '../../common/auth.service';
import { CartService } from '../../common/models/cart.service';
import { ProductLikeService } from '../../common/models/product-like.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../custom-toastr.service';

@Injectable({
  providedIn: 'root'
})
export class ProductOperationsService {
  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private productLikeService: ProductLikeService,
    private customToasterService: CustomToastrService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) { }

  async addToCart(product: Product, quantity: number = 1) {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.spinner.show(SpinnerType.BallSpinClockwise);
    
    try {
      const createCartItem = new CreateCartItem();
      createCartItem.productId = product.id;
      createCartItem.quantity = quantity; // Eğer quantity parametresi gönderilmezse default olarak 1 olacak
      createCartItem.isChecked = true;

      await this.cartService.add(
        createCartItem,
        () => {
          this.spinner.hide(SpinnerType.BallSpinClockwise);
          this.customToasterService.message(
            `${product.name} sepete eklendi`,
            "Başarılı",
            {
              toastrMessageType: ToastrMessageType.Success,
              position: ToastrPosition.TopRight
            }
          );
        },
        (errorMessage) => {
          this.spinner.hide(SpinnerType.BallSpinClockwise);
          this.customToasterService.message(
            "En fazla stok sayısı kadar ürün ekleyebilirsiniz",
            "Uyarı",
            {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.TopRight
            }
          );
        }
      );
    } catch (error) {
      this.spinner.hide(SpinnerType.BallSpinClockwise);
      console.error('Add to cart error:', error);
    }
  }

  async toggleLike(product: Product) {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.spinner.show(SpinnerType.BallSpinClockwise);
    try {
      const isLiked = await this.productLikeService.toggleProductLike(product.id);
      product.isLiked = isLiked;
      
      this.customToasterService.message(
        isLiked ? 'Ürün beğenildi' : 'Ürün beğenisi kaldırıldı',
        'Başarılı',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      this.customToasterService.message(
        'Beğeni işlemi sırasında bir hata oluştu',
        'Hata',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    } finally {
      this.spinner.hide(SpinnerType.BallSpinClockwise);
    }
  }
}