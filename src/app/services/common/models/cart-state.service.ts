import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { CartSummary } from 'src/app/contracts/cart/cartSummary';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../ui/custom-toastr.service';

export interface CartMetrics {
  totalItems: number;
  selectedItems: number;
  totalPrice: number;
  selectedItemsPrice: number;
  hasSelectedItems: boolean;
}

export interface CartHistoryEntry {
  timestamp: Date;
  action: string;
  details: string;
  affectedItems?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CartStateService {
  // Ana sepet verisi için BehaviorSubject
  private cartDataSubject = new BehaviorSubject<CartSummary | null>(null);
  cartData$ = this.cartDataSubject.asObservable();

  // Sepet metrikleri için computed observable
  private _cartMetrics$ = this.cartData$.pipe(
    map(cartData => this.calculateCartMetrics(cartData)),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  // Sepet değişiklik geçmişi için
  private cartHistorySubject = new BehaviorSubject<CartHistoryEntry[]>([]);
  cartHistory$ = this.cartHistorySubject.asObservable();

  // LocalStorage key
  private readonly CART_STORAGE_KEY = 'cart_data';
  private readonly CART_HISTORY_KEY = 'cart_history';

  constructor(private toastrService: CustomToastrService) {
    // LocalStorage'dan verileri yükle
    this.loadFromLocalStorage();

    // Sepet değişikliklerini izle ve kaydet
    this.cartData$.subscribe(data => {
      if (data) {
        this.saveToLocalStorage();
        this.logCartChange('Cart Updated', 'Cart data has been modified');
      }
    });
  }

  // LocalStorage İşlemleri
  private loadFromLocalStorage(): void {
    try {
      const savedCart = localStorage.getItem(this.CART_STORAGE_KEY);
      const savedHistory = localStorage.getItem(this.CART_HISTORY_KEY);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        this.cartDataSubject.next(parsedCart);
      }

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        this.cartHistorySubject.next(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading cart data from localStorage:', error);
      this.toastrService.message(
        'Error loading cart data',
        'Error',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    }
  }

  private saveToLocalStorage(): void {
    try {
      const cartData = this.cartDataSubject.value;
      const historyData = this.cartHistorySubject.value;

      if (cartData) {
        localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cartData));
      }

      if (historyData) {
        localStorage.setItem(this.CART_HISTORY_KEY, JSON.stringify(historyData));
      }
    } catch (error) {
      console.error('Error saving cart data to localStorage:', error);
    }
  }

  // Sepet Veri Yönetimi
  updateCartData(cartData: CartSummary) {
    try {
      // CartItem'ları doğrula ve quantityPrice'ı hesapla
      const validatedItems = cartData.selectedItems.map(item => ({
        ...item,
        quantityPrice: item.unitPrice * item.quantity,
      }));

      const updatedCartData = {
        ...cartData,
        selectedItems: validatedItems,
        totalPrice: this.calculateTotalPrice(validatedItems)
      };

      this.cartDataSubject.next(updatedCartData);
      this.saveToLocalStorage();
    } catch (error) {
      console.error('Error updating cart data:', error);
      this.toastrService.message(
        'Error updating cart',
        'Error',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    }
  }

  getCartData(): CartSummary | null {
    return this.cartDataSubject.value;
  }

  // Metrik Hesaplamaları
  private calculateCartMetrics(cartData: CartSummary | null): CartMetrics {
    if (!cartData || !cartData.selectedItems) {
      return {
        totalItems: 0,
        selectedItems: 0,
        totalPrice: 0,
        selectedItemsPrice: 0,
        hasSelectedItems: false
      };
    }

    const selectedItems = cartData.selectedItems.filter(item => item.isChecked);

    return {
      totalItems: cartData.selectedItems.length,
      selectedItems: selectedItems.length,
      totalPrice: this.calculateTotalPrice(cartData.selectedItems),
      selectedItemsPrice: this.calculateTotalPrice(selectedItems),
      hasSelectedItems: selectedItems.length > 0
    };
  }

  private calculateTotalPrice(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + (item.quantityPrice || 0), 0);
  }

  // Observable Getters
  getCartMetrics(): Observable<CartMetrics> {
    return this._cartMetrics$;
  }

  getSelectedItemsTotal(): Observable<number> {
    return this._cartMetrics$.pipe(
      map(metrics => metrics.selectedItemsPrice)
    );
  }

  getSelectedItemsCount(): Observable<number> {
    return this._cartMetrics$.pipe(
      map(metrics => metrics.selectedItems)
    );
  }

  hasSelectedItems(): Observable<boolean> {
    return this._cartMetrics$.pipe(
      map(metrics => metrics.hasSelectedItems)
    );
  }

  // Ürün Yönetimi
  updateItemQuantity(itemId: string, quantity: number) {
    const currentCart = this.getCartData();
    if (currentCart && currentCart.selectedItems) {
      const updatedItems = currentCart.selectedItems.map(item => {
        if (item.cartItemId === itemId) {
          const updatedItem = {
            ...item,
            quantity,
            quantityPrice: item.unitPrice * quantity
          };
          return updatedItem;
        }
        return item;
      });

      this.updateCartData({
        ...currentCart,
        selectedItems: updatedItems
      });

      this.logCartChange(
        'Quantity Updated',
        `Item ${itemId} quantity changed to ${quantity}`,
        [itemId]
      );
    }
  }

  toggleItemSelection(itemId: string, isChecked: boolean) {
    const currentCart = this.getCartData();
    if (currentCart && currentCart.selectedItems) {
      const updatedItems = currentCart.selectedItems.map(item => {
        if (item.cartItemId === itemId) {
          return { ...item, isChecked };
        }
        return item;
      });

      this.updateCartData({
        ...currentCart,
        selectedItems: updatedItems
      });

      this.logCartChange(
        'Selection Updated',
        `Item ${itemId} selection changed to ${isChecked}`,
        [itemId]
      );
    }
  }

  removeItem(itemId: string) {
    const currentCart = this.getCartData();
    if (currentCart && currentCart.selectedItems) {
      const updatedItems = currentCart.selectedItems.filter(
        item => item.cartItemId !== itemId
      );

      this.updateCartData({
        ...currentCart,
        selectedItems: updatedItems
      });

      this.logCartChange(
        'Item Removed',
        `Item ${itemId} removed from cart`,
        [itemId]
      );
    }
  }

  // Değişiklik Geçmişi
  private logCartChange(action: string, details: string, affectedItems?: string[]) {
    const currentHistory = this.cartHistorySubject.value;
    const newEntry: CartHistoryEntry = {
      timestamp: new Date(),
      action,
      details,
      affectedItems
    };

    const updatedHistory = [...currentHistory, newEntry].slice(-50); // Son 50 değişikliği tut
    this.cartHistorySubject.next(updatedHistory);
    this.saveToLocalStorage();
  }

  getCartHistory(): Observable<CartHistoryEntry[]> {
    return this.cartHistory$;
  }

  // Hata Kontrolleri
  validateCartItem(item: CartItem): boolean {
    return (
      item.cartItemId != null &&
      item.productId != null &&
      item.quantity > 0 &&
      item.unitPrice > 0
    );
  }

  // Sepet Temizleme
  clearCart() {
    this.cartDataSubject.next(null);
    localStorage.removeItem(this.CART_STORAGE_KEY);
    
    this.logCartChange('Cart Cleared', 'All cart data has been cleared');
    
    this.toastrService.message(
      'Cart has been cleared',
      'Success',
      {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      }
    );
  }

  // Sepet İstatistikleri
  getCartStatistics(): Observable<{
    averageItemPrice: number;
    totalItems: number;
    totalValue: number;
    selectedPercentage: number;
  }> {
    return this.cartData$.pipe(
      map(cartData => {
        if (!cartData || !cartData.selectedItems.length) {
          return {
            averageItemPrice: 0,
            totalItems: 0,
            totalValue: 0,
            selectedPercentage: 0
          };
        }

        const totalItems = cartData.selectedItems.length;
        const totalValue = this.calculateTotalPrice(cartData.selectedItems);
        const selectedItems = cartData.selectedItems.filter(item => item.isChecked).length;

        return {
          averageItemPrice: totalValue / totalItems,
          totalItems,
          totalValue,
          selectedPercentage: (selectedItems / totalItems) * 100
        };
      })
    );
  }
}