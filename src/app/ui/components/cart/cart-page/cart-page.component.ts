import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
import { TranslatePipe } from "../../../../pipes/translate.pipe";

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent, MainHeaderComponent, DownbarComponent, FooterComponent, TranslatePipe],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent extends BaseComponent implements OnInit, OnDestroy {
  cartData: CartSummary;
  addresses: UserAddress[] = [];
  phones: PhoneNumber[] = [];
  
  cartForm: FormGroup;
  addressForm: FormGroup;
  phoneForm: FormGroup;

  showAddressModal: boolean = false;
  showPhoneModal: boolean = false;

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

  private initializeForms(): void {
    this.cartForm = this.formBuilder.group({
      addressId: ['', Validators.required],
      phoneNumberId: ['', Validators.required],
      description: ['']
    });

    this.addressForm = this.formBuilder.group({
      name: ['', Validators.required],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', [Validators.required, this.validationService.postalCodeValidator]],
      country: ['', Validators.required],
      isDefault: [false]
    });

    this.phoneForm = this.formBuilder.group({
      name: ['', Validators.required],
      number: ['', [Validators.required, this.validationService.phoneNumberValidator]],
      isDefault: [false]
    });
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      // CartStateService'den veriyi al
      this.cartData = this.cartStateService.getCartData();
      
      // Sepet değişikliklerini dinle
      this.subscription.add(
        this.cartStateService.cartData$.subscribe(data => {
          if (data) {
            console.log("Cart data updated:", data);
            
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
              this.toastrService.message(
                'No items selected in cart',
                'Warning',
                {
                  toastrMessageType: ToastrMessageType.Warning,
                  position: ToastrPosition.TopRight
                }
              );
              this.router.navigate(['/']);
              return;
            }
          }
        })
      );

      if (!this.cartData || !this.cartData.selectedItems?.length) {
        this.toastrService.message(
          'No items selected in cart',
          'Warning',
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
        this.router.navigate(['/']);
        return;
      }

      await this.loadAddressesAndPhones();
    } catch (error) {
      this.errorService.handleError(error, 'Error loading order information');
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
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
  
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    try {
      const createOrderRequest = {
        ...this.cartForm.value,
        cartItems: this.cartData.selectedItems
      };
  
      await this.orderService.create(
        createOrderRequest,
        async (response) => {
          // Backend'den güncel sepet verilerini al
          const updatedCart = await this.cartService.get();
          
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
  
          this.router.navigate(['/order-summary', response.orderId]);
        },
        errorMessage => {
          this.errorService.handleError(errorMessage);
        }
      );
    } catch (error) {
      this.errorService.handleError(error);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  async onAddressSubmit(): Promise<void> {
    if (this.addressForm.invalid) {
      this.toastrService.message(
        'Please check the address form fields',
        'Validation Error',
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
      return;
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);

    try {
      const newAddress = await this.userAddressService.addAddress(this.addressForm.value);
      this.addresses.push(newAddress);
      this.cartForm.patchValue({ addressId: newAddress.id });
      
      this.toastrService.message(
        'Address added successfully',
        'Success',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
      
      this.showAddressModal = false;
      this.addressForm.reset();
    } catch (error) {
      this.errorService.handleError(error, 'Error adding new address');
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  async onPhoneSubmit(): Promise<void> {
    if (this.phoneForm.invalid) {
      this.toastrService.message(
        'Please check the phone form fields',
        'Validation Error',
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
      return;
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);

    try {
      const newPhone = await this.phoneNumberService.addPhone(this.phoneForm.value);
      this.phones.push(newPhone);
      this.cartForm.patchValue({ phoneNumberId: newPhone.id });
      
      this.toastrService.message(
        'Phone number added successfully',
        'Success',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
      
      this.showPhoneModal = false;
      this.phoneForm.reset();
    } catch (error) {
      this.errorService.handleError(error, 'Error adding new phone');
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  async setDefaultAddress(id: string): Promise<void> {
    try {
      await this.userAddressService.setDefaultAddress(id);
      this.addresses = this.addresses.map(address => ({
        ...address,
        isDefault: address.id === id
      }));

      this.toastrService.message(
        'Default address updated',
        'Success',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
    } catch (error) {
      this.errorService.handleError(error, 'Error setting default address');
    }
  }

  async setDefaultPhone(id: string): Promise<void> {
    try {
      await this.phoneNumberService.setDefaultPhone(id);
      this.phones = this.phones.map(phone => ({
        ...phone,
        isDefault: phone.id === id
      }));

      this.toastrService.message(
        'Default phone updated',
        'Success',
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
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

  openAddressModal(): void {
    this.showAddressModal = true;
    document.body.classList.add('modal-open');
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
    document.body.classList.remove('modal-open');
    this.addressForm.reset();
  }

  openPhoneModal(): void {
    this.showPhoneModal = true;
    document.body.classList.add('modal-open');
  }

  closePhoneModal(): void {
    this.showPhoneModal = false;
    document.body.classList.remove('modal-open');
    this.phoneForm.reset();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    document.body.classList.remove('modal-open');
  }
}