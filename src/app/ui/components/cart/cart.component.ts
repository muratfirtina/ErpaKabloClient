import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { IsCheckedCartItem } from 'src/app/contracts/cart/isCheckedCartItem';
import { UpdateCartItem } from 'src/app/contracts/cart/updateCarItem';
import { CartItemRemoveDialogComponent, CartItemRemoveDialogState } from 'src/app/dialogs/cart-item-remove-dialog/cart-item-remove-dialog.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { CartService } from 'src/app/services/common/models/cart.service';
import { CartStateService } from 'src/app/services/common/models/cart-state.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { DrawerService } from 'src/app/services/common/drawer.service';
import { ThemeService } from 'src/app/services/common/theme.service';
import { BaseDrawerComponent } from '../base-drawer.component';
import { AnimationService } from 'src/app/services/common/animation.service';
import { Subscription } from 'rxjs';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent extends BaseDrawerComponent implements OnInit, OnDestroy {
  @Output() closeCart = new EventEmitter<void>();
  
  totalItemCount: number;
  totalSelectedCartPrice: number;
  cartItems: CartItem[];
  selectedItemCount: number = 0;
  cartIsEmptyMessage: string;
  
  private cartMetricsSubscription: Subscription;

  constructor(
    private cartService: CartService,
    private cartStateService: CartStateService,
    private toastrService: CustomToastrService,
    private router: Router,
    private dialogService: DialogService,
    private drawerService: DrawerService,
    elementRef: ElementRef,
    animationService: AnimationService,
    themeService: ThemeService,
    spinner: SpinnerService
  ) {
    super(spinner, elementRef, animationService, themeService);
    
    // Sepet metriklerini dinle
    this.cartMetricsSubscription = this.cartStateService.getCartMetrics()
      .subscribe(metrics => {
        this.totalItemCount = metrics.totalItems;
        this.selectedItemCount = metrics.selectedItems;
        this.totalSelectedCartPrice = metrics.selectedItemsPrice;
      });
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    await this.getCartItems();
    this.updateSelectedItemCount();
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  override close() {
    this.isOpen = false;
    this.closeCart.emit();
    document.body.style.overflow = 'auto';
    this.drawerService.close();
  }

  async getCartItems(): Promise<void> {
    this.cartItems = await this.cartService.get();
    this.totalItemCount = this.cartItems.length;

    // CartItem'ları güncelle ve CartStateService'e kaydet
    this.cartItems.forEach((cartItem) => {
      cartItem.quantityPrice = cartItem.unitPrice * cartItem.quantity;
    });

    // Cart State'i başlangıçta güncelle
    this.cartStateService.updateCartData({
      selectedItems: this.cartItems,
      totalPrice: this.calculateTotalPrice(this.cartItems)
    });

    this.totalSelectedCartPrice = this.cartItems
      .filter((cartItem) => cartItem.isChecked)
      .reduce((sum, cartItem) => sum + cartItem.quantityPrice, 0);
  }

  private calculateTotalPrice(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantityPrice, 0);
  }

  toggleItemChecked(event: any, cartItem: CartItem) {
    cartItem.isChecked = event.target.checked;
    
    // Önce CartStateService'i güncelle
    const currentCart = this.cartStateService.getCartData();
    if (currentCart) {
      const updatedItems = currentCart.selectedItems.map(item => 
        item.cartItemId === cartItem.cartItemId ? { ...item, isChecked: event.target.checked } : item
      );
  
      this.cartStateService.updateCartData({
        ...currentCart,
        selectedItems: updatedItems
      });
    }
  
    // Sonra backend'e gönder
    const isCheckedCartItem: IsCheckedCartItem = new IsCheckedCartItem();
    isCheckedCartItem.cartItemId = cartItem.cartItemId;
    isCheckedCartItem.isChecked = cartItem.isChecked;
    this.cartService.updateCartItem(isCheckedCartItem);
    
    this.updateSelectedItemCount();
    this.updateTotalCartPrice();
  }
  
  updateTotalCartPrice() {
    this.totalSelectedCartPrice = this.cartItems
      .filter((cartItem) => cartItem.isChecked)
      .reduce((sum, cartItem) => sum + cartItem.quantityPrice, 0);
  }

  async changeQuantity(change: number, cartItem: CartItem) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const quantity: number = cartItem.quantity + change;

    if (quantity >= 1) {
      this.cartStateService.updateItemQuantity(cartItem.cartItemId, quantity);
      
      const updateCartItem: UpdateCartItem = new UpdateCartItem();
      updateCartItem.cartItemId = cartItem.cartItemId;
      updateCartItem.quantity = quantity;

      await this.cartService.updateQuantity(updateCartItem);
      cartItem.quantityPrice = cartItem.unitPrice * quantity;
      cartItem.quantity = quantity;
    }

    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onQuantityInput(event: any, cartItem: CartItem) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const inputValue = event.target.value;
    const parsedValue = parseInt(inputValue, 10);

    if (!isNaN(parsedValue) && parsedValue > 0) {
      this.cartStateService.updateItemQuantity(cartItem.cartItemId, parsedValue);
      cartItem.quantity = parsedValue;
      cartItem.quantityPrice = cartItem.unitPrice * cartItem.quantity;
    } else {
      cartItem.quantity = 1;
    }
    
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  async removeCartItem(cartItemId: string) {
    this.dialogService.openDialog({
      componentType: CartItemRemoveDialogComponent,
      data: CartItemRemoveDialogState.Yes,
      options: {
        width: '400px'
      },
      afterClosed: async (result) => {
        if (result === CartItemRemoveDialogState.Yes) {
          this.showSpinner(SpinnerType.BallSpinClockwise);
          
          try {
            await this.cartService.remove(cartItemId);
            this.cartItems = this.cartItems.filter(item => item.cartItemId !== cartItemId);
            
            // CartState'i güncelle
            this.cartStateService.updateCartData({
              selectedItems: this.cartItems,
              totalPrice: this.calculateTotalPrice(this.cartItems)
            });
            
            this.updateSelectedItemCount();
            this.totalItemCount = this.cartItems.length;
            
            this.toastrService.message(
              'The product has been successfully removed from the cart',
              'Success',
              {
                toastrMessageType: ToastrMessageType.Success,
                position: ToastrPosition.TopRight
              }
            );
          } catch (error) {
            this.toastrService.message(
              'An error occurred while removing the product from the cart.',
              'Error',
              {
                toastrMessageType: ToastrMessageType.Error,
                position: ToastrPosition.TopRight
              }
            );
          } finally {
            this.hideSpinner(SpinnerType.BallSpinClockwise);
          }
        }
      }
    });
  }

  updateSelectedItemCount() {
    this.selectedItemCount = this.cartItems.filter(cartItem => cartItem.isChecked).length;

    if (this.selectedItemCount === 0) {
      const cartIsEmpty = this.cartItems.length === 0;
      this.cartIsEmptyMessage = cartIsEmpty
        ? 'Cart is Empty'
        : 'The selected product is not available.';
    }
  }

  async shoppingCompleting() {
    if (this.selectedItemCount === 0) {
      this.toastrService.message(
        'Please select at least one product from your cart.',
        'There are no selected products in your cart.',
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight,
        }
      );
      return;
    }

    const selectedItems = this.cartItems.filter(item => item.isChecked);
    const cartData = {
      selectedItems,
      totalPrice: this.totalSelectedCartPrice
    };

    // State service'i güncelle
    this.cartStateService.updateCartData(cartData);
    
    // Navigate et
    this.router.navigate(['/cart-page']);
    
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.isOpen) {
      this.close();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('cart-drawer-backdrop')) {
      this.close();
    }
  }

  setPageScroll() {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  ngOnDestroy() {
    if (this.cartMetricsSubscription) {
      this.cartMetricsSubscription.unsubscribe();
    }
    
    document.body.style.overflow = 'auto';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    this.drawerService.close();
  }
}