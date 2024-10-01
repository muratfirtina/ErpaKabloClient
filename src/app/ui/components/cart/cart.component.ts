import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { BaseUrl } from 'src/app/contracts/baseUrl';
import { CartItem } from 'src/app/contracts/cart/cartItem';
import { IsCheckedCartItem } from 'src/app/contracts/cart/isCheckedCartItem';
import { UpdateCartItem } from 'src/app/contracts/cart/updateCarItem';
import { CreateOrder } from 'src/app/contracts/order/createOrder';
import { DialogService } from 'src/app/services/common/dialog.service';
import { CartService } from 'src/app/services/common/models/cart.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

declare var $: any;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent extends BaseComponent implements OnInit {
  constructor(
    spinner: NgxSpinnerService,
    private cartService: CartService,
    
    //private orderService: OrderService,
    private toastrService: CustomToastrService,
    private router: Router,
    private dialogService: DialogService
  ) {
    super(spinner);
  }

  totalItemCount: number;
  totalSelectedCartPrice: number;
  baseUrl: BaseUrl;
  cartItems: CartItem[];
  isCartPriceModalActive = false;
  selectedItemCount: number = 0;
  cartIsEmptyMessage: string;

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    await this.getCartItems();
    this.updateSelectedItemCount();
    this.hideSpinner(SpinnerType.BallSpinClockwise);
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
      cartItem.quantity = quantity; // Güncellenen quantity değerini ata
    }

    this.updateTotalCartPrice();
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  async removeCartItem(cartItemId: string) {
    
    /* this.dialogService.openDialog({
      componentType: CartItemRemoveDialogComponent,
      data: CartItemRemoveDialogState.Yes,
      afterClosed: async () => {
        this.showSpinner(SpinnerType.BallSpinClockwise);

        try {
          await this.cartService.remove(cartItemId);
          this.cartItems = this.cartItems.filter(
            (item) => item.cartItemId !== cartItemId
          );
          this.updateSelectedItemCount();
          this.updateTotalCartPrice();
          this.totalItemCount = this.cartItems.length;
        } catch (error) {
          console.log('Error occurred while removing cart item:', error);
        } finally {
          this.hideSpinner(SpinnerType.BallSpinClockwise);
        }
        
      },
    }); */
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
        ? 'Sepetiniz boş'
        : 'Seçili ürün bulunmamaktadır.';
    }
  }

  async shoppingCompleting() {
    if (this.selectedItemCount === 0) {
      this.toastrService.message(
        'Lütfen sepetinizden en az bir ürün seçiniz.',
        'Sepetinizde seçili ürün bulunmamaktadır.',
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight,
        }
      );
      $('#cartModal').modal('show');
      return;
    }
    /* this.dialogService.openDialog({
      componentType: ShoppingCompleteDialogComponent,
      data: ShoppingCompleteDialogState.Yes,
      afterClosed: async () => {
        this.showSpinner(SpinnerType.BallSpinClockwise);
        const order: CreateOrder = new CreateOrder();
        order.address = '----- ----/İstanbul, Türkiye';
        order.description = 'Hediye Paketi yapılsın.';
        await this.orderService.create(order);
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        this.toastrService.message(
          'Siparişiniz başarıyla oluşturuldu.',
          'Siparişiniz alındı',
          {
            toastrMessageType: ToastrMessageType.Info,
            position: ToastrPosition.TopRight,
          }
        );
        $('#cartModal').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
        this.router.navigate(['/']).then(() => {
          window.location.reload();
        });
      },
    }); */
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const modal = document.getElementById('cartPriceModal');
    const windowHeight = window.innerHeight;
    const modalHeight = modal.offsetHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop + windowHeight - event.clientY > modalHeight) {
      this.isCartPriceModalActive = true;
    } else {
      this.isCartPriceModalActive = false;
    }
  }
}
