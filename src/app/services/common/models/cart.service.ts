import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { AuthService } from '../auth.service';
import { CustomToastrService } from '../../ui/custom-toastr.service';
import { Router } from '@angular/router';
import { ProductService } from './product.service';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { CreateCartItem } from 'src/app/contracts/cart/createCartItem';
import { UpdateCartItem } from 'src/app/contracts/cart/updateCarItem';
import { IsCheckedCartItem } from 'src/app/contracts/cart/isCheckedCartItem';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItemsSubject: Subject<CartItem[]> = new Subject<CartItem[]>();

  constructor(private httpClientService: HttpClientService,
    private authService:AuthService,
    private customToastrService:CustomToastrService,
    private router:Router,
    private productService: ProductService) { }

  getCartItemsObservable(): Observable<CartItem[]> {
      return this.cartItemsSubject.asObservable();
    }
  async get(): Promise<CartItem[]>{
    const observable:Observable<CartItem[]> = this.httpClientService.get({
      controller: 'carts',
    });

    const cartItems = await firstValueFrom(observable);
    this.cartItemsSubject.next(cartItems); // Güncel sepet öğelerini yayımla

    return cartItems;
  }

  async add(createCartItem: CreateCartItem,successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<void>{
   
    const observable: Observable<CreateCartItem> = this.httpClientService.post<CreateCartItem>({
      controller: 'carts',

    }, {createCartItem});

    const promiseData = firstValueFrom(observable);
    promiseData.then(value => successCallBack())
      .catch(error => errorCallBack(error));
    
    await promiseData;
    this.get();
    
  }

  async updateQuantity(cartItem:UpdateCartItem): Promise<void>{
    const observable: Observable<any> = this.httpClientService.put({
      controller: 'carts',
    }, cartItem);

    await firstValueFrom(observable);
    this.get(); // Sepeti yeniden almak için get() metodunu çağır
  } 
  
  async remove(cartItemId: string): Promise<void>{
    const observable: Observable<any> = this.httpClientService.delete({
      controller: 'carts',
    },cartItemId);

    await firstValueFrom(observable);
    this.get(); // Sepeti yeniden almak için get() metodunu çağır
  }

  async updateCartItem(cartItem: IsCheckedCartItem): Promise<void> {
    const observable: Observable<any> = this.httpClientService.put({
      controller: 'carts',
      action: 'updateCartItem'
    }, cartItem);

    await firstValueFrom(observable);
    this.get(); // Sepeti yeniden almak için get() metodunu çağır
  }


  /* async addImageUrlToCartItems(cartItems: List_Cart_Item[]): Promise<List_Cart_Item[]> {
    const updatedCartItems: List_Cart_Item[] = [];
    for (const cartItem of cartItems) {
      const imageUrl = await this.getImageUrlForProduct(cartItem.productId);
      cartItem.productImageUrls = imageUrl;
      updatedCartItems.push(cartItem);
    }
    return updatedCartItems;
  }

  async getImageUrlForProduct(productId: string): Promise<string> {
    const productImages = await this.productService.readImages(productId);
    if (productImages && productImages.length > 0) {
      return productImages[0].path; // İlk fotoğrafın yolunu döndürün
    }
    return '../../../../../assets/default_product.png'; // Fotoğraf yoksa boş bir değer döndürün veya varsayılan bir URL tanımlayabilirsiniz
  } */
}
