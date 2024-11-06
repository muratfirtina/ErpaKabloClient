import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { IsCheckedCartItem } from 'src/app/contracts/cart/isCheckedCartItem';
import { UpdateCartItem } from 'src/app/contracts/cart/updateCarItem';
import { CreateOrder } from 'src/app/contracts/order/createOrder';
import { CartItemRemoveDialogComponent, CartItemRemoveDialogState } from 'src/app/dialogs/cart-item-remove-dialog/cart-item-remove-dialog.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { CartService } from 'src/app/services/common/models/cart.service';
import { OrderService } from 'src/app/services/common/models/order.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { OrderStatus } from 'src/app/contracts/order/orderStatus';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent extends BaseComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeCart = new EventEmitter<void>();

  constructor(
    spinner: NgxSpinnerService,
    private cartService: CartService,
    private orderService: OrderService,
    private toastrService: CustomToastrService,
    private router: Router,
    private dialogService: DialogService
  ) {
    super(spinner);
  }

  totalItemCount: number;
  totalSelectedCartPrice: number;
  cartItems: CartItem[];
  selectedItemCount: number = 0;
  cartIsEmptyMessage: string;

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    await this.getCartItems();
    this.updateSelectedItemCount();
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  close() {
    this.isOpen = false;
    this.closeCart.emit();
  }

  async getCartItems(): Promise<void> {
    this.cartItems = await this.cartService.get();
    this.totalItemCount = this.cartItems.length;

    this.cartItems.forEach((cartItem) => {
      cartItem.quantityPrice = cartItem.unitPrice * cartItem.quantity;
    });

    this.totalSelectedCartPrice = this.cartItems
      .filter((cartItem) => cartItem.isChecked)
      .reduce((sum, cartItem) => sum + cartItem.quantityPrice, 0);
  }

  toggleItemChecked(event: any, cartItem: CartItem) {
    cartItem.isChecked = event.target.checked;
    this.updateTotalCartPrice();
    this.updateSelectedItemCount();

    const isCheckedCartItem: IsCheckedCartItem = new IsCheckedCartItem();
    isCheckedCartItem.cartItemId = cartItem.cartItemId;
    isCheckedCartItem.isChecked = cartItem.isChecked;
    this.cartService.updateCartItem(isCheckedCartItem);
  }

  async changeQuantity(change: number, cartItem: CartItem) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const quantity: number = cartItem.quantity + change;

    if (quantity >= 1) {
      const updateCartItem: UpdateCartItem = new UpdateCartItem();
      updateCartItem.cartItemId = cartItem.cartItemId;
      updateCartItem.quantity = quantity;

      await this.cartService.updateQuantity(updateCartItem);
      cartItem.quantityPrice = cartItem.unitPrice * quantity;
      cartItem.quantity = quantity;
    }

    this.updateTotalCartPrice();
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  onQuantityInput(event: any, cartItem: CartItem) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const inputValue = event.target.value;
    const parsedValue = parseInt(inputValue, 10);

    if (!isNaN(parsedValue) && parsedValue > 0) {
      cartItem.quantity = parsedValue;
      cartItem.quantityPrice = cartItem.unitPrice * cartItem.quantity;
      this.updateTotalCartPrice();
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
            this.cartItems = this.cartItems.filter(
              (item) => item.cartItemId !== cartItemId
            );
            this.updateSelectedItemCount();
            this.updateTotalCartPrice();
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

  updateTotalCartPrice() {
    this.totalSelectedCartPrice = this.cartItems
      .filter((cartItem) => cartItem.isChecked)
      .reduce((sum, cartItem) => sum + cartItem.quantityPrice, 0);
  }

  updateSelectedItemCount() {
    this.selectedItemCount = this.cartItems.filter(
      (cartItem) => cartItem.isChecked
    ).length;

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
  
    // Seçili ürünleri ve toplam fiyatı OrderPage'e geçirelim
    const selectedItems = this.cartItems.filter(item => item.isChecked);
    const orderData = {
      selectedItems: selectedItems,
      totalPrice: this.totalSelectedCartPrice
    };
  
    // OrderPage'e yönlendirme yaparken verileri state üzerinden geçirelim
    this.router.navigate(['/order-page'], { 
      state: { orderData }
    });
  
    // Cart drawer'ı kapatalım
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.close();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    // Drawer dışına tıklandığında kapatma işlevi
    const target = event.target as HTMLElement;
    if (target.classList.contains('cart-drawer-backdrop')) {
      this.close();
    }
  }
}