import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavigationExtras, Router, RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { PhoneNumber } from 'src/app/contracts/user/phoneNumber';
import { UserAddress } from 'src/app/contracts/user/userAddress';
import { OrderService } from 'src/app/services/common/models/order.service';
import { UserAddressService } from 'src/app/services/common/models/user-address.service';
import { PhoneNumberService } from 'src/app/services/common/models/phone-number.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { ErrorService } from 'src/app/services/common/error.service';
import { ValidationService } from 'src/app/services/common/validation.service';
import { OrderSummary } from 'src/app/contracts/order/orderSummary';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { DownbarComponent } from '../../downbar/downbar.component';

@Component({
  selector: 'app-order-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule ,NavbarComponent,MainHeaderComponent,DownbarComponent],
  templateUrl: './order-page.component.html',
  styleUrl: './order-page.component.scss'
})
export class OrderPageComponent extends BaseComponent implements OnInit {
  orderData: OrderSummary;
  addresses: UserAddress[] = [];
  phones: PhoneNumber[] = [];
  
  orderForm: FormGroup;
  addressForm: FormGroup;
  phoneForm: FormGroup;

  showAddressModal: boolean = false;
  showPhoneModal: boolean = false;

  constructor(
    spinner: NgxSpinnerService,
    private formBuilder: FormBuilder,
    private router: Router,
    private orderService: OrderService,
    private userAddressService: UserAddressService,
    private phoneNumberService: PhoneNumberService,
    private errorService: ErrorService,
    private validationService: ValidationService,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
    
    const navigation = this.router.getCurrentNavigation();
    this.orderData = navigation?.extras?.state?.['orderData'];

    this.initializeForms();
  }

  private initializeForms(): void {
    this.orderForm = this.formBuilder.group({
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
    if (!this.orderData) {
      this.router.navigate(['/cart']);
      return;
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      await this.loadAddressesAndPhones();
    } catch (error) {
      this.errorService.handleError(error, 'Error loading order information');
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  private async loadAddressesAndPhones(): Promise<void> {
    try {
      const addressResponse = await this.userAddressService.getUserAddresses();
      const phoneResponse = await this.phoneNumberService.getUserPhones();

      this.addresses = addressResponse.items;
      this.phones = phoneResponse.items;

      // Set default values if available
      const defaultAddress = this.addresses.find(a => a.isDefault);
      const defaultPhone = this.phones.find(p => p.isDefault);

      if (defaultAddress) {
        this.orderForm.patchValue({ addressId: defaultAddress.id });
      }

      if (defaultPhone) {
        this.orderForm.patchValue({ phoneNumberId: defaultPhone.id });
      }
    } catch (error) {
      this.errorService.handleError(error, 'Error loading addresses and phones');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.orderForm.invalid) {
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
        ...this.orderForm.value,
        orderItems: this.orderData.selectedItems
      };
  
      await this.orderService.create(
        createOrderRequest,
        (response) => {
          this.toastrService.message(
            'Order created successfully',
            'Success',
            {
              toastrMessageType: ToastrMessageType.Success,
              position: ToastrPosition.TopRight
            }
          );
      
          // URL parametresi olarak orderId'yi gönder
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
      return;
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);

    try {
      const newAddress = await this.userAddressService.addAddress(this.addressForm.value);
      this.addresses.push(newAddress);
      this.orderForm.patchValue({ addressId: newAddress.id });
      
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
      return;
    }

    this.showSpinner(SpinnerType.BallSpinClockwise);

    try {
      const newPhone = await this.phoneNumberService.addPhone(this.phoneForm.value);
      this.phones.push(newPhone);
      this.orderForm.patchValue({ phoneNumberId: newPhone.id });
      
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
    } catch (error) {
      this.errorService.handleError(error, 'Error setting default phone');
    }
  }

  getSelectedAddress(): UserAddress | undefined {
    return this.addresses.find(a => a.id === this.orderForm.get('addressId')?.value);
  }

  getSelectedPhone(): PhoneNumber | undefined {
    return this.phones.find(p => p.id === this.orderForm.get('phoneNumberId')?.value);
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
}