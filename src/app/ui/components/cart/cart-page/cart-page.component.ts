import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as bootstrap from 'bootstrap';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CartSummary } from 'src/app/contracts/cart/cartSummary';
import { PhoneNumber } from 'src/app/contracts/user/phoneNumber';
import { UserAddress } from 'src/app/contracts/user/userAddress';
import { ErrorService } from 'src/app/services/common/error.service';
import { OrderService } from 'src/app/services/common/models/order.service';
import { CartStateService } from 'src/app/services/common/models/cart-state.service';
import { PhoneNumberService } from 'src/app/services/common/models/phone-number.service';
import { UserAddressService } from 'src/app/services/common/models/user-address.service';
import { ValidationService } from 'src/app/services/common/validation.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { DownbarComponent } from '../../downbar/downbar.component';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { CartService } from 'src/app/services/common/models/cart.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { FooterComponent } from '../../footer/footer.component';
import { AddressModalComponent } from '../../user/address-modal/address-modal.component';
import { PhoneModalComponent } from '../../user/phone-modal/phone-modal.component';


@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    NavbarComponent, 
    MainHeaderComponent, 
    DownbarComponent, 
    FooterComponent,
    AddressModalComponent,
    PhoneModalComponent
  ],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent extends BaseComponent implements OnInit, OnDestroy {
  cartData: CartSummary;
  addresses: UserAddress[] = [];
  phones: PhoneNumber[] = [];
  
  cartForm: FormGroup;
  
  // For modals
  isEditMode: boolean = false;
  currentAddress: UserAddress | null = null;
  currentPhone: PhoneNumber | null = null;

  private subscription = new Subscription();

  constructor(
    spinner: SpinnerService,
    private formBuilder: FormBuilder,
    private router: Router,
    private orderService: OrderService,
    private userAddressService: UserAddressService,
    private phoneNumberService: PhoneNumberService,
    private errorService: ErrorService,
    private validationService: ValidationService,
    private toastrService: CustomToastrService,
    private cartService: CartService,
    private cartStateService: CartStateService
  ) {
    super(spinner);
    this.initializeForms();
  }

  private getModal(id: string): any {
    return document.getElementById(id);
  }

  private initializeForms(): void {
    this.cartForm = this.formBuilder.group({
      addressId: ['', Validators.required],
      phoneNumberId: ['', Validators.required],
      description: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // CartStateService'den veriyi al
      this.cartData = this.cartStateService.getCartData();
      
      // Sepet değişikliklerini dinle
      this.subscription.add(
        this.cartStateService.cartData$.subscribe(data => {
          if (data) {
            
            // Sadece seçili ürünleri filtrele
            const selectedItems = data.selectedItems.filter(item => item.isChecked);
            
            // CartData'yı güncelle - sadece seçili ürünlerle
            this.cartData = {
              selectedItems: selectedItems,
              totalPrice: selectedItems.reduce((sum, item) => 
                sum + (item.quantity * item.unitPrice), 0)
            };
            
            // Eğer hiç seçili ürün kalmadıysa ana sayfaya yönlendir
            if (!selectedItems.length) {
              this.router.navigate(['/']);
              return;
            }
          }
        })
      );

      if (!this.cartData || !this.cartData.selectedItems?.length) {
        this.router.navigate(['/']);
        return;
      }

      await this.loadAddressesAndPhones();
    } catch (error) {
      this.errorService.handleError(error, 'Error loading order information');
    } finally {
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }
  
  private async loadAddressesAndPhones(): Promise<void> {
    try {
      // Paralel olarak her iki veriyi de yükle
      const [addressResponse, phoneResponse] = await Promise.all([
        this.userAddressService.getUserAddresses(),
        this.phoneNumberService.getUserPhones()
      ]);

      this.addresses = addressResponse.items;
      this.phones = phoneResponse.items;

      // Set default values if available
      const defaultAddress = this.addresses.find(a => a.isDefault);
      const defaultPhone = this.phones.find(p => p.isDefault);

      if (defaultAddress) {
        this.cartForm.patchValue({ addressId: defaultAddress.id });
      }

      if (defaultPhone) {
        this.cartForm.patchValue({ phoneNumberId: defaultPhone.id });
      }

      if (this.addresses.length === 0) {
        this.toastrService.message(
          'Please add a delivery address',
          'Warning',
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      }

      if (this.phones.length === 0) {
        this.toastrService.message(
          'Please add a phone number',
          'Warning',
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      }
    } catch (error) {
      this.errorService.handleError(error, 'Error loading addresses and phones');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.cartForm.invalid) {
      this.toastrService.message(
        'Please fill in all required fields',
        'Validation Error',
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
      return;
    }
  
    this.showSpinner(SpinnerType.SquareLoader);
  
    try {
      const createOrderRequest = {
        ...this.cartForm.value,
        cartItems: this.cartData.selectedItems
      };
  
      const response = await this.orderService.create(
        createOrderRequest,
        response => {
          
          // Backend'den güncel sepet verilerini al
          this.cartService.get().then(updatedCart => {
            // State'i güncelle
            this.cartStateService.updateCartData({
              selectedItems: updatedCart,
              totalPrice: updatedCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
            });
            
            this.toastrService.message(
              'Order created successfully',
              'Success',
              {
                toastrMessageType: ToastrMessageType.Success,
                position: ToastrPosition.TopRight
              }
            );
            
            // Explicit timeout ile yönlendirmeyi garantiye alalım
            setTimeout(() => {
              this.router.navigate(['/order-summary', response.orderId]);
            }, 100);
          });
        },
        errorMessage => {
          console.error('Error creating order:', errorMessage);
          this.errorService.handleError(errorMessage, 'Failed to create order. Please try again.');
          this.hideSpinner(SpinnerType.BallSpinClockwise);
        }
      );
    } catch (error) {
      console.error('Exception during order creation:', error);
      this.errorService.handleError(error, 'An unexpected error occurred while creating your order.');
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  // Address Modal Methods
  showAddAddressForm() {
    this.isEditMode = false;
    this.currentAddress = null;
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('addressModal'));
    modal.show();
  }

  async handleSaveAddress(addressData: UserAddress) {
    try {
      if (this.isEditMode && addressData.id) {
        await this.userAddressService.updateAddress(addressData.id, addressData);
        this.toastrService.message('Address update success', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        await this.userAddressService.addAddress(addressData);
        this.toastrService.message('New Address added', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }
      // Reload addresses to get the updated list
      await this.loadAddressesAndPhones();
    } catch (error) {
      this.toastrService.message('Error', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  handleCancelEdit() {
    this.isEditMode = false;
    this.currentAddress = null;
  }

  // Phone Modal Methods
  showAddPhoneForm() {
    this.isEditMode = false;
    this.currentPhone = null;
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('phoneModal'));
    modal.show();
  }

  async handleSavePhone(phoneData: PhoneNumber) {
    try {
      if (this.isEditMode && phoneData.id) {
        await this.phoneNumberService.updatePhone(phoneData.id, phoneData);
        this.toastrService.message('Phone number updated', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        await this.phoneNumberService.addPhone(phoneData);
        this.toastrService.message('New phone number added', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }
      // Reload phones to get the updated list
      await this.loadAddressesAndPhones();
    } catch (error) {
      this.toastrService.message('Error', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }
  
  handleCancelPhoneEdit() {
    this.isEditMode = false;
    this.currentPhone = null;
  }

  async setDefaultAddress(id: string): Promise<void> {
    try {
      await this.userAddressService.setDefaultAddress(id);
      this.toastrService.message(
        'Default address updated',
        'Success',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
      await this.loadAddressesAndPhones();
    } catch (error) {
      this.errorService.handleError(error, 'Error setting default address');
    }
  }

  async setDefaultPhone(id: string): Promise<void> {
    try {
      await this.phoneNumberService.setDefaultPhone(id);
      this.toastrService.message(
        'Default phone updated',
        'Success',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
      await this.loadAddressesAndPhones();
    } catch (error) {
      this.errorService.handleError(error, 'Error setting default phone');
    }
  }
  
  getTotalPrice(): number {
    return this.cartData?.selectedItems
      ?.filter(item => item.isChecked)
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  }
  
  getSelectedItemCount(): number {
    return this.cartData?.selectedItems?.filter(item => item.isChecked).length || 0;
  }

  getSelectedAddress(): UserAddress | undefined {
    return this.addresses.find(a => a.id === this.cartForm.get('addressId')?.value);
  }

  getSelectedPhone(): PhoneNumber | undefined {
    return this.phones.find(p => p.id === this.cartForm.get('phoneNumberId')?.value);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}