import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PhoneNumber } from 'src/app/contracts/user/phoneNumber';
import { ValidationService } from 'src/app/services/common/validation.service';
import * as bootstrap from 'bootstrap';
import { LocationService } from 'src/app/services/common/location.service';
import { Country } from 'src/app/contracts/location/country';

@Component({
  selector: 'app-phone-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './phone-modal.component.html',
  styleUrls: ['./phone-modal.component.scss']
})
export class PhoneModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() currentPhone: PhoneNumber | null = null;

  @Output() savePhone = new EventEmitter<PhoneNumber>();
  @Output() cancelEdit = new EventEmitter<void>();

  phoneForm: FormGroup;
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  selectedCountry: Country | null = null;
  isLoadingCountries: boolean = false;
  showCountryDropdown: boolean = false;
  countrySearchText: string = '';
  private clickListener: any;

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
    const modalElement = document.getElementById('phoneModal');
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
        this.cancelEdit.emit();
      });
    }

    // Set up click listener to close dropdown when clicking outside
    this.setupClickListener();
  }

  ngOnDestroy(): void {
    // Clean up the click listener
    this.removeClickListener();
  }

  private setupClickListener(): void {
    this.clickListener = (event: MouseEvent) => {
      const codeSelector = document.querySelector('.country-code-selector');
      const dropdown = document.querySelector('.country-dropdown');
      
      // Check if click is outside both the selector and dropdown
      if (this.showCountryDropdown && 
          codeSelector && 
          dropdown && 
          !codeSelector.contains(event.target as Node) && 
          !dropdown.contains(event.target as Node)) {
        this.showCountryDropdown = false;
      }
    };
    
    // Add click listener with a small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', this.clickListener);
    }, 100);
  }

  private removeClickListener(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  ngOnChanges(): void {
    if (this.isEditMode && this.currentPhone) {
      this.patchFormValues();
    } else {
      this.resetForm();
    }
  }

  private initializeForm(): void {
    this.phoneForm = this.formBuilder.group({
      name: ['', Validators.required],
      number: ['', [
        Validators.required,
        this.validationService.phoneNumberValidator
      ]],
      isDefault: [false]
    });
  }

  // Toggle country dropdown visibility
  toggleCountryDropdown(event: Event): void {
    // Important: Stop propagation to prevent immediate closing
    event.stopPropagation();
    event.preventDefault();
    
    this.showCountryDropdown = !this.showCountryDropdown;
    
    if (this.showCountryDropdown) {
      this.filterCountries();
      
      // Focus the search input when dropdown opens
      setTimeout(() => {
        const searchInput = document.querySelector('.country-dropdown .search-box input');
        if (searchInput) {
          (searchInput as HTMLInputElement).focus();
        }
      }, 10);
    }
  }

  // Filter countries based on search text
  filterCountries(): void {
    if (!this.countrySearchText) {
      this.filteredCountries = this.countries;
    } else {
      const searchText = this.countrySearchText.toLowerCase();
      this.filteredCountries = this.countries.filter(country => 
        country.name.toLowerCase().includes(searchText) || 
        country.phoneCode.includes(searchText)
      );
    }
  }

  // Handle country search input changes
  onCountrySearchChange(): void {
    this.filterCountries();
  }

  // Select a country from dropdown
  selectCountry(country: Country, event: Event): void {
    event.stopPropagation();
    this.selectedCountry = country;
    this.showCountryDropdown = false;
  }

  private patchFormValues(): void {
    if (this.currentPhone) {
      this.phoneForm.patchValue({
        name: this.currentPhone.name,
        isDefault: this.currentPhone.isDefault ?? false
      });

      // Telefon numarasını ayrıştır
      const phoneNumber = this.currentPhone.number;
      let countryCode = '';
      let localNumber = phoneNumber;

      // Telefon numarasını country code ve local number olarak ayır
      if (phoneNumber.startsWith('+')) {
        const parts = phoneNumber.split(' ');
        if (parts.length > 1) {
          countryCode = parts[0].substring(1); // '+90' -> '90'
          localNumber = parts.slice(1).join('');
        }
      }

      // Ülkeleri yükle ve ülke kodu ile eşleştir
      this.loadCountries().then(() => {

          const selectedCountry = this.countries.find(c => c.phoneCode === countryCode);
          if (selectedCountry) {
            this.selectedCountry = selectedCountry;
          }
        // Telefon numarasının geri kalanını form'a ekle
        this.phoneForm.get('number')?.setValue(localNumber);
      });
    }
  }

  resetForm(): void {
    this.phoneForm.reset();
    this.countrySearchText = '';
    this.showCountryDropdown = false;
    
    // Default değerleri ayarla
    this.phoneForm.patchValue({
      isDefault: false
    });
  }

  onSubmit(): void {
    if (this.phoneForm.valid) {
      const formattedNumber = this.formatPhoneNumber();
      
      const phoneData: PhoneNumber = {
        id: this.isEditMode && this.currentPhone ? this.currentPhone.id : '',
        name: this.phoneForm.get('name')?.value,
        number: formattedNumber,
        isDefault: this.phoneForm.get('isDefault')?.value ?? false
      };

      this.savePhone.emit(phoneData);
      this.closeModal();
    }
  }

  formatPhoneNumber(): string {
    const rawNumber = this.phoneForm.get('number')?.value || '';
    
    // Telefon numarasını temizle (tüm boşlukları ve özel karakterleri kaldır)
    let cleanNumber = rawNumber.replace(/\D/g, '');
    
    // Ülke kodu ekle
    if (this.selectedCountry) {
      return `+${this.selectedCountry.phoneCode} ${cleanNumber}`;
    }
    
    // Varsayılan olarak Türkiye kodu ekle
    return `${cleanNumber}`;
  }

  closeModal(): void {
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('phoneModal'));
    modal.hide();
  }

  // Location loading methods
  loadCountries(): Promise<void> {
    this.isLoadingCountries = true;
    return new Promise<void>((resolve) => {
      this.locationService.getAllCountries().subscribe({
        next: (response) => {
          this.countries = response?.items || [];
          this.filteredCountries = this.countries;
          this.isLoadingCountries = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading countries:', error);
          this.isLoadingCountries = false;
          resolve();
        }
      });
    });
  }
}