// user.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
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


declare var $: any;

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainHeaderComponent,NavbarComponent,UserSidebarComponent,DownbarComponent],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent extends BaseComponent implements OnInit {
  user: UserDto | null = null;
  addresses: UserAddress[] = [];
  phoneNumbers: PhoneNumber[] = [];
  
  passwordForm: FormGroup;
  addressForm: FormGroup;
  phoneForm: FormGroup;
  
  isSidebarOpen: boolean = false;
  isEditMode = false;
  currentItemId: string | null = null;
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
    spinner: NgxSpinnerService
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

    this.passwordForm.get('newPassword').valueChanges.subscribe(
      (password: string) => {
        this.updatePasswordRequirements(password);
      }
    );

    this.addressForm = this.formBuilder.group({
      name: ['', Validators.required],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: [''],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      isDefault: [false]
    });

    this.phoneForm = this.formBuilder.group({
      name: ['', Validators.required],
      number: ['', [Validators.required, Validators.pattern('^05[0-9]{9}$')]],
      isDefault: [false]
    });
  }

  ngOnInit() {
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
    const value: string = control.value;
    const hasUpperCase = /[A-Z]+/.test(value);
    const hasLowerCase = /[a-z]+/.test(value);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
    const isLongEnough = value.length >= 8;
  
    const valid = hasUpperCase && hasLowerCase && hasSymbol && isLongEnough;
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
      
      this.toastr.message('Password Changed', 'Succes', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      
      this.passwordForm.reset();
      this.submitted = false;
      $('#passwordModal').modal('hide');
    } catch (error) {
      this.toastr.message('Password not changed', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  
  showAddAddressForm() {
    this.isEditMode = false;
    this.currentItemId = null;
    this.addressForm.reset();
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('addressModal'));
    modal.show();
  }

  editAddress(address: UserAddress) {
    this.isEditMode = true;
    this.currentItemId = address.id;
    this.addressForm.patchValue({
      name: address.name,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault ?? false 
    });
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('addressModal'));
    modal.show();
  }

  async saveAddress() {
    if (this.addressForm.valid) {
      try {
        const addressData: Omit<UserAddress, 'id'> = {
          name: this.addressForm.get('name')?.value,
          addressLine1: this.addressForm.get('addressLine1')?.value,
          addressLine2: this.addressForm.get('addressLine2')?.value,
          city: this.addressForm.get('city')?.value,
          state: this.addressForm.get('state')?.value,
          postalCode: this.addressForm.get('postalCode')?.value,
          country: this.addressForm.get('country')?.value,
          isDefault: this.addressForm.get('isDefault')?.value ?? false 
        };
        
        if (this.isEditMode && this.currentItemId) {
          await this.addressService.updateAddress(this.currentItemId, {
            ...addressData,
            id: this.currentItemId
          });
          this.toastr.message('Address update success', 'Success', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
        } else {
          await this.addressService.addAddress(addressData as UserAddress);
          this.toastr.message('New Address added', 'Success', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
        }
        
        const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('addressModal'));
        modal.hide();
        this.loadAddresses();
        this.addressForm.reset();
      } catch (error) {
        this.toastr.message('Error', 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    }
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
    this.currentItemId = null;
    this.phoneForm.reset();
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('phoneModal'));
    modal.show();
  }

  editPhone(phone: PhoneNumber) {
    this.isEditMode = true;
    this.currentItemId = phone.id;
    this.phoneForm.patchValue({
      name: phone.name,
      number: phone.number,
      isDefault: phone.isDefault ?? false
    });
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('phoneModal'));
    modal.show();
  }

  // Diğer modal işlemleri için de aynı şekilde güncelleyin:
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

  async confirmDelete() {
    if (this.deleteItemId && this.deleteItemType) {
      try {
        if (this.deleteItemType === 'address') {
          await this.addressService.deleteAddress(this.deleteItemId);
          this.loadAddresses();
          this.toastr.message('Addess deleted', 'Success', {
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
        
        const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('deleteConfirmModal'));
        modal.hide();
      } catch (error) {
        this.toastr.message('Error', 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    }
  }


  async savePhone() {
    if (this.phoneForm.valid) {
      try {
        const phoneData: Omit<PhoneNumber, 'id'> = {
          name: this.phoneForm.get('name')?.value,
          number: this.phoneForm.get('number')?.value,
          isDefault: this.phoneForm.get('isDefault')?.value ?? false
        };
        
        if (this.isEditMode && this.currentItemId) {
          await this.phoneService.updatePhone(this.currentItemId, {
            ...phoneData,
            id: this.currentItemId
          });
          this.toastr.message('Phone number updated', 'Success', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
        } else {
          await this.phoneService.addPhone(phoneData as PhoneNumber);
          this.toastr.message('New phone number added', 'Success', {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
        }
        
        const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('phoneModal'));
        modal.hide();
        this.loadPhoneNumbers();
        this.phoneForm.reset();
      } catch (error) {
        this.toastr.message('Error', 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    }
  }

  async setDefaultPhone(id: string) {
    try {
      await this.phoneService.setDefaultPhone(id);
      this.toastr.message('Default phone number updated successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      this.loadPhoneNumbers();
    } catch (error) {
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

  close() {
    this.deleteItemId = null;
    this.deleteItemType = null;
    this.deleteConfirmMessage = '';
    const modal = bootstrap.Modal.getOrCreateInstance(this.getModal('deleteConfirmModal'));
    modal.hide();
  }

}