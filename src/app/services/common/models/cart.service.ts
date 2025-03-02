import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { AuthService } from '../auth.service';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { CreateCartItem } from 'src/app/contracts/cart/createCartItem';
import { UpdateCartItem } from 'src/app/contracts/cart/updateCarItem';
import { IsCheckedCartItem } from 'src/app/contracts/cart/isCheckedCartItem';
import { AnalyticsService } from '../analytics.services';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);

  constructor(
    private httpClientService: HttpClientService,
    private authService: AuthService,
    private analyticsService: AnalyticsService
  ) {
    // Only load initial cart items if user is authenticated
    if (this.authService.isAuthenticated) {
      this.loadInitialCartItems();
    }
  }

  private async loadInitialCartItems() {
    try {
      const cartItems = await this.fetchCartItems();
      this.cartItemsSubject.next(cartItems);
    } catch (error) {
      console.error('Error loading initial cart items:', error);
    }
  }

  private async fetchCartItems(): Promise<CartItem[]> {
    if (!this.authService.isAuthenticated) {
      return [];
    }
    
    const observable = this.httpClientService.get<CartItem[]>({
      controller: 'carts'
    });
    return await firstValueFrom(observable);
  }

  getCartItemsObservable(): Observable<CartItem[]> {
    if (!this.authService.isAuthenticated) {
      return new BehaviorSubject<CartItem[]>([]).asObservable();
    }
    return this.cartItemsSubject.asObservable();
  }

  async get(): Promise<CartItem[]> {
    if (!this.authService.isAuthenticated) {
      return [];
    }
    const cartItems = await this.fetchCartItems();
    this.cartItemsSubject.next(cartItems);
    return cartItems;
  }

  async add(createCartItem: CreateCartItem, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<void> {
    if (!this.authService.isAuthenticated) {
      if (errorCallBack) errorCallBack('User not authenticated');
      return;
    }

    try {
      await firstValueFrom(
        this.httpClientService.post<CreateCartItem>({
          controller: 'carts'
        }, { createCartItem })
      );
      
      

      const updatedCart = await this.fetchCartItems();
      this.cartItemsSubject.next(updatedCart);

      if (successCallBack) successCallBack();
    } catch (error) {
      if (errorCallBack) errorCallBack(error as string);
    }
  }

  async updateQuantity(cartItem: UpdateCartItem): Promise<void> {
    if (!this.authService.isAuthenticated) {
      return;
    }

    try {
      await firstValueFrom(
        this.httpClientService.put({
          controller: 'carts'
        }, cartItem)
      );

      const updatedCart = await this.fetchCartItems();
      this.cartItemsSubject.next(updatedCart);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }

  async remove(cartItemId: string): Promise<void> {
    if (!this.authService.isAuthenticated) {
      return;
    }

    try {
      await firstValueFrom(
        this.httpClientService.delete({
          controller: 'carts'
        }, cartItemId)
      );

      const updatedCart = await this.fetchCartItems();
      this.cartItemsSubject.next(updatedCart);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  async updateCartItem(cartItem: IsCheckedCartItem): Promise<void> {
    if (!this.authService.isAuthenticated) {
      return;
    }

    try {
      await firstValueFrom(
        this.httpClientService.put({
          controller: 'carts',
          action: 'updateCartItem'
        }, cartItem)
      );

      const updatedCart = await this.fetchCartItems();
      this.cartItemsSubject.next(updatedCart);
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  }
}