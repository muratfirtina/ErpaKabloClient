import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { AuthService } from '../auth.service';
import { CustomToastrService } from '../../ui/custom-toastr.service';
import { Router } from '@angular/router';
import { ProductService } from './product.service';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { BehaviorSubject, Observable, Subject, firstValueFrom } from 'rxjs';
import { CreateCartItem } from 'src/app/contracts/cart/createCartItem';
import { UpdateCartItem } from 'src/app/contracts/cart/updateCarItem';
import { IsCheckedCartItem } from 'src/app/contracts/cart/isCheckedCartItem';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);

  constructor(private httpClientService: HttpClientService,
    private authService:AuthService,
    private customToastrService:CustomToastrService,
    private router:Router,
    private productService: ProductService) { 
      this.loadInitialCartItems();
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
      const observable = this.httpClientService.get<CartItem[]>({
        controller: 'carts'
      });
      return await firstValueFrom(observable);
    }

  getCartItemsObservable(): Observable<CartItem[]> {
      return this.cartItemsSubject.asObservable();
    }
    async get(): Promise<CartItem[]> {
      const cartItems = await this.fetchCartItems();
      this.cartItemsSubject.next(cartItems);
      return cartItems;
    }
  
    async add(createCartItem: CreateCartItem, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<void> {
      try {
        await firstValueFrom(
          this.httpClientService.post<CreateCartItem>({
            controller: 'carts'
          }, { createCartItem })
        );
  
        // Sepeti güncelle ve yeni değerleri yayınla
        const updatedCart = await this.fetchCartItems();
        this.cartItemsSubject.next(updatedCart);
  
        if (successCallBack) successCallBack();
      } catch (error) {
        if (errorCallBack) errorCallBack(error as string);
      }
    }
  
    async updateQuantity(cartItem: UpdateCartItem): Promise<void> {
      try {
        await firstValueFrom(
          this.httpClientService.put({
            controller: 'carts'
          }, cartItem)
        );
  
        // Sepeti güncelle ve yeni değerleri yayınla
        const updatedCart = await this.fetchCartItems();
        this.cartItemsSubject.next(updatedCart);
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  
    async remove(cartItemId: string): Promise<void> {
      try {
        await firstValueFrom(
          this.httpClientService.delete({
            controller: 'carts'
          }, cartItemId)
        );
  
        // Sepeti güncelle ve yeni değerleri yayınla
        const updatedCart = await this.fetchCartItems();
        this.cartItemsSubject.next(updatedCart);
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }
  
    async updateCartItem(cartItem: IsCheckedCartItem): Promise<void> {
      try {
        await firstValueFrom(
          this.httpClientService.put({
            controller: 'carts',
            action: 'updateCartItem'
          }, cartItem)
        );
  
        // Sepeti güncelle ve yeni değerleri yayınla
        const updatedCart = await this.fetchCartItems();
        this.cartItemsSubject.next(updatedCart);
      } catch (error) {
        console.error('Error updating cart item:', error);
      }
    }
  }