import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    const valid = /^[0-9]{10}$/.test(control.value);
    return valid ? null : { invalidPhone: true };
  }

  postalCodeValidator(control: AbstractControl): ValidationErrors | null {
    const valid = /^[0-9]{5}$/.test(control.value);
    return valid ? null : { invalidPostalCode: true };
  }
}