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
            `${product.name} added to cart`,
            "Successful",
            {
              toastrMessageType: ToastrMessageType.Success,
              position: ToastrPosition.BottomRight
            }
          );
        },
        (errorMessage) => {
          this.spinner.hide(SpinnerType.BallSpinClockwise);
          this.customToasterService.message(
            "You can add products up to the maximum stock number", "Warning",
            {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.BottomRight
            }
          );
        }
      );
    } catch (error) {
      this.spinner.hide(SpinnerType.BallSpinClockwise);
      console.error('Add to cart error:', error);
    }
  }

  async toggleLike(product: Product): Promise<{ isLiked: boolean, likeCount: number }> {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url }
      });
      return { isLiked: false, likeCount: 0 };
    }

    this.spinner.show(SpinnerType.BallSpinClockwise);
    try {
      const isLiked = await this.productLikeService.toggleProductLike(product.id);
      const likeCount = await this.productLikeService.getProductLikeCount(product.id);
      product.isLiked = isLiked;
      
      this.customToasterService.message(
        isLiked ? 'Product liked' : 'Product liked removed', 'Successful',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );

      return { isLiked, likeCount };
    } catch (error) {
      console.error('Error toggling like:', error);
      this.customToasterService.message(
        'An error occurred during the like process','Error',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
      return { isLiked: false, likeCount: 0 };
    } finally {
      this.spinner.hide(SpinnerType.BallSpinClockwise);
    }
  }
}