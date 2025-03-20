import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserAddress } from 'src/app/contracts/user/userAddress';
import { ValidationService } from 'src/app/services/common/validation.service';
import * as bootstrap from 'bootstrap';
import { LocationService } from 'src/app/services/common/location.service';
import { City } from 'src/app/contracts/location/city';
import { Country } from 'src/app/contracts/location/country';
import { District } from 'src/app/contracts/location/district';


@Component({
  selector: 'app-address-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-modal.component.html',
  styleUrls: ['./address-modal.component.scss']
})
export class AddressModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() currentAddress: UserAddress | null = null;

  @Output() saveAddress = new EventEmitter<UserAddress>();
  @Output() cancelEdit = new EventEmitter<void>();

  addressForm: FormGroup;
  countries: Country[] = [];
  cities: City[] = [];
  districts: District[] = [];
  isLoadingCities: boolean = false;
  isLoadingDistricts: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private validationService: ValidationService,
    private locationService: LocationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Load countries when component initializes
    this.loadCountries();

    // Modal kapatıldığında formu sıfırla
    const modalElement = document.getElementById('addressModal');
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
        this.cancelEdit.emit();
      });
    }

    // Listen for country changes to load cities
    this.addressForm.get('country')?.valueChanges.subscribe(countryId => {
      if (countryId) {
        this.loadCitiesByCountry(countryId);
        this.addressForm.get('city')?.setValue('');
        this.addressForm.get('district')?.setValue('');
        this.districts = [];
      }
    });

    // Listen for city changes to load districts
    this.addressForm.get('city')?.valueChanges.subscribe(cityId => {
      if (cityId) {
        this.loadDistrictsByCity(cityId);
        this.addressForm.get('district')?.setValue('');
      }
    });
  }

  ngOnChanges(): void {
    if (this.isEditMode && this.currentAddress) {
      this.patchFormValues();
    } else {
      this.resetForm();
    }
  }

  private initializeForm(): void {
    this.addressForm = this.formBuilder.group({
      name: ['', Validators.required],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      district: ['', Validators.required],
      postalCode: ['', [
        Validators.required,
        this.validationService.postalCodeValidator
      ]],
      country: ['', Validators.required],
      isDefault: [false]
    });
  }

  resetForm(): void {
    this.addressForm.reset();
    // Default değerleri ayarla
    this.addressForm.patchValue({
      isDefault: false
    });
    this.cities = [];
    this.districts = [];
  }

  private patchFormValues(): void {
    if (this.currentAddress) {
      this.addressForm.patchValue({
        name: this.currentAddress.name,
        addressLine1: this.currentAddress.addressLine1,
        addressLine2: this.currentAddress.addressLine2,
        postalCode: this.currentAddress.postalCode,
        isDefault: this.currentAddress.isDefault ?? false
      });
  
      this.locationService.getAllCountries().subscribe(response => {
        this.countries = response?.items || [];
        if (this.currentAddress?.countryId) {
          const selectedCountry = this.countries.find(c => c.id === this.currentAddress?.countryId);
          if (selectedCountry) {
            this.addressForm.get('country')?.setValue(selectedCountry.id);
            
            this.locationService.getCitiesByCountryId(selectedCountry.id).subscribe(cityResponse => {
              this.cities = cityResponse?.items || [];
              const selectedCity = this.cities.find(c => c.id === this.currentAddress?.cityId);
              if (selectedCity) {
                this.addressForm.get('city')?.setValue(selectedCity.id);
                
                this.locationService.getDistrictsByCityId(selectedCity.id).subscribe(districtResponse => {
                  this.districts = districtResponse?.items || [];
                  const selectedDistrict = this.districts.find(d => d.id === this.currentAddress?.districtId);
                  if (selectedDistrict) {
                    this.addressForm.get('district')?.setValue(selectedDistrict.id);
                  }
                });
              }
            });
          }
        }
      });
    }
  }
  
  onSubmit(): void {
    if (this.addressForm.valid) {
      // Form değerlerini al
      const selectedCountryId = parseInt(this.addressForm.get('country')?.value);
      const selectedCityId = parseInt(this.addressForm.get('city')?.value);
      const selectedDistrictId = parseInt(this.addressForm.get('district')?.value);
      
      const selectedCountry = this.countries.find(c => c.id === selectedCountryId);
      const selectedCity = this.cities.find(c => c.id === selectedCityId);
      const selectedDistrict = this.districts.find(d => d.id === selectedDistrictId);
  
      const addressData: UserAddress = {
        id: this.isEditMode && this.currentAddress ? this.currentAddress.id : '',
        name: this.addressForm.get('name')?.value,
        addressLine1: this.addressForm.get('addressLine1')?.value,
        addressLine2: this.addressForm.get('addressLine2')?.value,
        countryId: selectedCountryId,
        cityId: selectedCityId, 
        districtId: selectedDistrictId,
        postalCode: this.addressForm.get('postalCode')?.value,
        isDefault: this.addressForm.get('isDefault')?.value ?? false,
        // İsim bilgilerini de gönderin ki arayüzde görüntülenebilsin
        countryName: selectedCountry?.name,
        cityName: selectedCity?.name,
        districtName: selectedDistrict?.name
      };
  
      this.saveAddress.emit(addressData);
      this.closeModal();
    }
  }

  closeModal(): void {
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addressModal'));
    modal.hide();
  }

  // Location loading methods
  loadCountries(): void {
    this.locationService.getAllCountries().subscribe({
      next: (response) => {
        this.countries = response?.items || [];
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      }
    });
  }
  
  loadCitiesByCountry(countryId: number): void {
    this.isLoadingCities = true;
    this.locationService.getCitiesByCountryId(countryId).subscribe({
      next: (response) => {
        this.cities = response?.items || [];
        this.isLoadingCities = false;
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.isLoadingCities = false;
      }
    });
  }
  
  loadDistrictsByCity(cityId: number): void {
    this.isLoadingDistricts = true;
    this.locationService.getDistrictsByCityId(cityId).subscribe({
      next: (response) => {
        this.districts = response?.items || [];
        this.isLoadingDistricts = false;
      },
      error: (error) => {
        console.error('Error loading districts:', error);
        this.isLoadingDistricts = false;
      }
    });
  }
}