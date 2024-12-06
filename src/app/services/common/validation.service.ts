import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { 
  PasswordValidationErrors, 
  EmailValidationErrors, 
  NameSurnameValidationErrors, 
  UserNameValidationErrors, 
  SecurityValidationErrors 
} from 'src/app/contracts/validation/validation-interfaces';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private sqlInjectionPatterns = [
    /(\s*([\0\b\'\"\n\r\t\%\_\\]*\s*(((select\s*.+\s*from\s*.+)|(insert\s*.+\s*into\s*.+)|(update\s*.+\s*set\s*.+)|(delete\s*.+\s*from\s*.+)|(drop\s*.+)|(truncate\s*.+)|(alter\s*.+)|(exec\s*.+)|(\s*(all|any|not|and|between|in|like|or|some|contains|containsall|containskey)\s*.+[\=\>\<=\!\~]+.*)))))/i,
    /(\%27)|(\-\-)|(\%23)|(#)/i,
    /(([\"\'])(.*?)([\"\']))/i,
    /(union\s+(all|distinct|[(!]\s*)?select)/i,
    /(exec(\s|\+)+(s|x)p\w+)/i
  ];

  // Phone Number Validator - International Format
  phoneNumberValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const value = control.value.toString().trim();
    const errors: ValidationErrors = {};

    if (this.containsSqlInjection(value)) {
      errors['sqlInjection'] = true;
    }

    // Uluslararası format kontrolü: + ile başlayabilir, 7-15 rakam içermeli
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    if (!phoneRegex.test(value.replace(/[\s()-]/g, ''))) {
      errors['invalidPhone'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Postal Code Validator
  postalCodeValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const value = control.value.toString().trim();
    const errors: ValidationErrors = {};

    if (this.containsSqlInjection(value)) {
      errors['sqlInjection'] = true;
    }

    // 3-10 karakter arası alfanümerik postcode'a izin ver
    const postalCodeRegex = /^[A-Z0-9]{3,10}$/i;
    if (!postalCodeRegex.test(value.replace(/[\s-]/g, ''))) {
      errors['invalidPostalCode'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  nameSurnameValidator = (control: AbstractControl): NameSurnameValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
  
    const errors: NameSurnameValidationErrors = {};
  
    if (value.length < 3) errors.tooShort = true;
    if (value.length > 50) errors.tooLong = true;
    if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(value)) errors.invalidCharacters = true;
    if (this.containsSqlInjection(value)) errors.sqlInjection = true;
  
    return Object.keys(errors).length ? errors : null;
  }
  
  passwordValidator = (control: AbstractControl): PasswordValidationErrors | null => {
    const password = control.value;
    if (!password) return null;
  
    const errors: PasswordValidationErrors = {};
    const requirements = {
      minLength: 8,
      maxLength: 128,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1
    };
  
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= requirements.minLength;
  
    if (!isLongEnough) errors.tooShort = true;
    if (password.length > requirements.maxLength) errors.tooLong = true;
    if (!hasUppercase) errors.insufficientUppercase = true;
    if (!hasLowercase) errors.insufficientLowercase = true;
    if (!hasNumbers) errors.insufficientNumbers = true;
    if (!hasSymbols) errors.insufficientSymbols = true;
  
    errors.passwordRequirements = {
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      symbol: hasSymbols,
      length: isLongEnough
    };
  
    if (this.containsSqlInjection(password)) {
      errors.sqlInjection = true;
      return errors;
    }
  
    if (hasUppercase && hasLowercase && hasNumbers && hasSymbols && isLongEnough) {
      return null;
    }
  
    return errors;
  }
  
  emailValidator = (control: AbstractControl): EmailValidationErrors | null => {
    const email = control.value;
    if (!email) return null;
  
    const errors: EmailValidationErrors = {};
  
    if (!email.includes('@') || !email.includes('.')) {
      errors.invalidFormat = true;
      return errors;
    }
  
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      errors.invalidFormat = true;
      return errors;
    }
  
    if (email.length < 3) errors.tooShort = true;
    if (email.length > 320) errors.tooLong = true;
    if (email.startsWith('.')) errors.startsWithDot = true;
    if (email.endsWith('.')) errors.endsWithDot = true;
    if (email.includes('..')) errors.consecutiveDots = true;
  
    if (this.containsSqlInjection(email)) errors.sqlInjection = true;
  
    return Object.keys(errors).length ? errors : null;
  }
  
  userNameValidator = (control: AbstractControl): UserNameValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
  
    const errors: UserNameValidationErrors = {};
  
    if (value.length < 3) errors.tooShort = true;
    if (value.length > 50) errors.tooLong = true;
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) errors.invalidCharacters = true;
    if (this.containsSqlInjection(value)) errors.sqlInjection = true;
  
    return Object.keys(errors).length ? errors : null;
  }
  
  passwordsMatchValidator = (control: AbstractControl): { notSame: boolean } | null => {
    const password = control.root.get('password');
    return password && control.value !== password.value ? { notSame: true } : null;
  }

  inputSanitizer = (control: AbstractControl): SecurityValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
  
    const errors: SecurityValidationErrors = {};
  
    if (this.containsSqlInjection(value)) errors.sqlInjection = true;
    if (/<[^>]*>/.test(value)) errors.htmlTags = true;
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value)) errors.scriptTags = true;
    if (/[;&|`]/.test(value)) errors.commandInjection = true;
  
    return Object.keys(errors).length ? errors : null;
  }
  
  cityValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
  
    const value = control.value.toString().trim();
    const errors: ValidationErrors = {};
  
    if (this.containsSqlInjection(value)) {
      errors['sqlInjection'] = true;
    }
  
    const cityRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
    if (!cityRegex.test(value)) {
      errors['invalidCity'] = true;
    }
  
    return Object.keys(errors).length > 0 ? errors : null;
  }
  
  addressLineValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
  
    const value = control.value.toString().trim();
    const errors: ValidationErrors = {};
  
    if (this.containsSqlInjection(value)) {
      errors['sqlInjection'] = true;
    }
  
    const dangerousChars = /[<>{}]/;
    if (dangerousChars.test(value)) {
      errors['invalidCharacters'] = true;
    }
  
    return Object.keys(errors).length > 0 ? errors : null;
  }
  
  addressNameValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
  
    const value = control.value.toString().trim();
    const errors: ValidationErrors = {};
  
    if (this.containsSqlInjection(value)) {
      errors['sqlInjection'] = true;
    }
  
    const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s\-_]+$/;
    if (!nameRegex.test(value)) {
      errors['invalidName'] = true;
    }
  
    return Object.keys(errors).length > 0 ? errors : null;
  }


  private containsSqlInjection(value: string): boolean {
    if (!value) return false;
    return this.sqlInjectionPatterns.some(pattern => pattern.test(value));
  }
}