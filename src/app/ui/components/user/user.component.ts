// user.component.ts (Updated)
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { UserAddress } from 'src/app/contracts/user/userAddress';
import { UserDto } from 'src/app/contracts/user/userDto';
import { UserAddressService } from 'src/app/services/common/models/user-address.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import * as bootstrap from 'bootstrap'; 
import { MainHeaderComponent } from '../main-header/main-header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserSidebarComponent } from './user-sidebar/user-sidebar.component';
import { DownbarComponent } from '../downbar/downbar.component';
import { PhoneNumber } from 'src/app/contracts/user/phoneNumber';
import { PhoneNumberService } from 'src/app/services/common/models/phone-number.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { DesktopUserSidebarComponent } from './desktop-user-sidebar/desktop-user-sidebar.component';
import { ValidationService } from 'src/app/services/common/validation.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { AddressModalComponent } from './address-modal/address-modal.component';
import { PhoneModalComponent } from './phone-modal/phone-modal.component';
import { DeleteConfirmModalComponent } from '../delete-confirm-modal/delete-confirm-modal.component';
import { FooterComponent } from '../footer/footer.component';

declare var $: any;

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MainHeaderComponent, 
    NavbarComponent, 
    DesktopUserSidebarComponent, 
    DownbarComponent, 
    BreadcrumbComponent,
    AddressModalComponent,
    PhoneModalComponent,
    DeleteConfirmModalComponent,
    FooterComponent
  ],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent extends BaseComponent implements OnInit {
  user: UserDto | null = null;
  addresses: UserAddress[] = [];
  phoneNumbers: PhoneNumber[] = [];
  
  passwordForm: FormGroup;
  phoneForm: FormGroup;
  
  isSidebarOpen: boolean = false;
  isEditMode = false;
  currentAddress: UserAddress | null = null;
  currentPhone: PhoneNumber | null = null;
  deleteConfirmMessage = '';
  deleteItemType: 'address' | 'phone' | null = null;
  deleteItemId: string | null = null;

  isLoadingUser: boolean = true;
  isLoadingAddresses: boolean = true;
  isLoadingPhones: boolean = true;
  
  passwordRequirements = {
    uppercase: false,
    lowercase: false,
    symbol: false,
    length: false
  };

  submitted: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private addressService: UserAddressService,
    private phoneService: PhoneNumberService,
    private toastr: CustomToastrService,
    private breadcrumbService: BreadcrumbService,
    private validationService: ValidationService,
    spinner: SpinnerService
  ) {
    super(spinner);
    this.initializeForms();
  }

  private getModal(id: string): any {
    return document.getElementById(id);
  }
  
  private initializeForms() {
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
          Validators.required,
          this.passwordStrengthValidator.bind(this)
      ]],
      confirmPassword: ['', [
          Validators.required,
          this.passwordsMatchValidator.bind(this)
      ]]
    });

    this.phoneForm = this.formBuilder.group({
      name: ['', Validators.required],
      number: ['', [
        Validators.required,
        this.validationService.phoneNumberValidator
      ]],
      isDefault: [false]
    });
  }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'User', url: '/user' }
    ]);
    this.loadUserData();
    this.loadAddresses();
    this.loadPhoneNumbers();
  }

  get component() { return this.passwordForm.controls; }

  updatePasswordRequirements(password: string) {
    this.passwordRequirements = {
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password),
        length: password.length >= 8
    };
  }

  passwordsMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.root.get('newPassword');
    return password && control.value !== password.value ? { 'notSame': true } : null;
  }

  passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value: string = control.value || '';
    
    if (!value && !control.hasValidator(Validators.required)) {
        return null;
    }

    const hasUpperCase = /[A-Z]+/.test(value);
    const hasLowerCase = /[a-z]+/.test(value);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
    const isLongEnough = value.length >= 8;
  
    const valid = hasUpperCase && hasLowerCase && hasSymbol && isLongEnough;
    
    this.passwordRequirements = {
        uppercase: hasUpperCase,
        lowercase: hasLowerCase,
        symbol: hasSymbol,
        length: isLongEnough
    };

    return valid ? null : { 'passwordStrength': true };
  }

  async loadUserData() {
    try {
      this.isLoadingUser = true;
      this.user = await this.userService.getCurrentUser();
    } catch (error) {
      this.toastr.message('User datas not loaded', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.isLoadingUser = false;
    }
  }

  async loadAddresses() {
    try {
      this.isLoadingAddresses = true;
      const response = await this.addressService.getUserAddresses();
      this.addresses = response.items;
    } catch (error) {
      this.toastr.message('Addresses not loaded', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.isLoadingAddresses = false;
    }
  }

  async loadPhoneNumbers() {
    try {
      this.isLoadingPhones = true;
      const response = await this.phoneService.getUserPhones();
      this.phoneNumbers = response.items;
    } catch (error) {
      this.toastr.message('Phone numbers not loaded', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.isLoadingPhones = false;
    }
  }
  
  async onPasswordSubmit() {
    this.submitted = true;
    if (this.passwordForm.invalid) return;

    try {
        this.showSpinner(SpinnerType.BallSpinClockwise);
        const { currentPassword, newPassword } = this.passwordForm.value;
        
        await this.userService.changePassword(currentPassword, newPassword);
        
        this.toastr.message('Password changed successfully', 'Success', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
        });
        
        this.passwordForm.reset();
        this.submitted = false;

    } catch (error: any) {
        console.error('Password change error:', error);
        
        const errorMessage = error.error?.message || 'Failed to change password';
        
        this.toastr.message(errorMessage, 'Error', {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
        });
        this.submitted = false;
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

  editAddress(address: UserAddress) {
    this.isEditMode = true;
    this.currentAddress = address;
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('addressModal'));
    modal.show();
  }

  async handleSaveAddress(addressData: UserAddress) {
    try {
      if (this.isEditMode && addressData.id) {
        await this.addressService.updateAddress(addressData.id, addressData);
        this.toastr.message('Address update success', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        await this.addressService.addAddress(addressData);
        this.toastr.message('New Address added', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }
      this.loadAddresses();
    } catch (error) {
      this.toastr.message('Error', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  handleCancelEdit() {
    this.isEditMode = false;
    this.currentAddress = null;
  }

  async setDefaultAddress(id: string) {
    try {
      await this.addressService.setDefaultAddress(id);
      this.toastr.message('Default address updated successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      this.loadAddresses();
    } catch (error) {
      this.toastr.message('Failed to update default address', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  showAddPhoneForm() {
    this.isEditMode = false;
    this.currentPhone = null;
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('phoneModal'));
    modal.show();
  }

  editPhone(phone: PhoneNumber) {
    this.isEditMode = true;
    this.currentPhone = phone;
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('phoneModal'));
    modal.show();
  }
  
  async handleSavePhone(phoneData: PhoneNumber) {
    try {
      if (this.isEditMode && phoneData.id) {
        await this.phoneService.updatePhone(phoneData.id, phoneData);
        this.toastr.message('Phone number updated', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      } else {
        await this.phoneService.addPhone(phoneData);
        this.toastr.message('New phone number added', 'Success', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
      }
      await this.loadPhoneNumbers();
    } catch (error) {
      this.toastr.message('Error', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }
  
  handleCancelPhoneEdit() {
    this.isEditMode = false;
    this.currentPhone = null;
  }

  confirmDeleteAddress(addressId: string) {
    this.deleteItemType = 'address';
    this.deleteItemId = addressId;
    this.deleteConfirmMessage = 'Are you sure you want to delete this address?';
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('deleteConfirmModal'));
    modal.show();
  }

  confirmDeletePhone(phoneId: string) {
    this.deleteItemType = 'phone';
    this.deleteItemId = phoneId;
    this.deleteConfirmMessage = 'Are you sure you want to delete this numbers?';
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('deleteConfirmModal'));
    modal.show();
  }



  async handleDeleteConfirm() {
    if (this.deleteItemId && this.deleteItemType) {
      try {
        if (this.deleteItemType === 'address') {
          await this.addressService.deleteAddress(this.deleteItemId);
          this.loadAddresses();
          this.toastr.message('Address deleted', 'Success', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
        } else if (this.deleteItemType === 'phone') {
          await this.phoneService.deletePhone(this.deleteItemId);
          this.loadPhoneNumbers();
          this.toastr.message('Phone number deleted', 'Success', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
        }
      } catch (error) {
        this.toastr.message('Error', 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    }
  }
  
  handleCancelDelete() {
    this.deleteItemId = null;
    this.deleteItemType = null;
    this.deleteConfirmMessage = '';
  }

  async setDefaultPhone(id: string) {
    try {
      await this.phoneService.setDefaultPhone(id);
      
      this.toastr.message('Default phone number updated successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      
      await this.loadPhoneNumbers();
    } catch (error) {
      console.error('Error setting default phone:', error);
      this.toastr.message('Failed to update default phone number', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    if (this.isSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (window.innerWidth > 991 && this.isSidebarOpen) {
      this.isSidebarOpen = false;
      document.body.classList.remove('sidebar-open');
    }
  }
  
  ngOnDestroy() {
    document.body.classList.remove('sidebar-open');
  }


}