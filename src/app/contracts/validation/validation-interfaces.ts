// validation.interfaces.ts
export interface PasswordRequirements {
    uppercase: boolean;
    lowercase: boolean;
    symbol: boolean;
    length: boolean;
  }
  
  export interface PasswordValidationErrors {
    tooShort?: boolean;
    tooLong?: boolean;
    insufficientUppercase?: boolean;
    insufficientLowercase?: boolean;
    insufficientNumbers?: boolean;
    insufficientSymbols?: boolean;
    sqlInjection?: boolean;
    passwordRequirements?: PasswordRequirements;
  }
  
  export interface EmailValidationErrors {
    invalidFormat?: boolean;
    tooShort?: boolean;
    tooLong?: boolean;
    startsWithDot?: boolean;
    endsWithDot?: boolean;
    consecutiveDots?: boolean;
    localPartTooLong?: boolean;
    domainTooLong?: boolean;
    sqlInjection?: boolean;
  }
  
  export interface NameSurnameValidationErrors {
    tooShort?: boolean;
    tooLong?: boolean;
    invalidCharacters?: boolean;
    sqlInjection?: boolean;
  }
  
  export interface UserNameValidationErrors {
    tooShort?: boolean;
    tooLong?: boolean;
    invalidCharacters?: boolean;
    sqlInjection?: boolean;
  }
  
  export interface SecurityValidationErrors {
    sqlInjection?: boolean;
    htmlTags?: boolean;
    scriptTags?: boolean;
    commandInjection?: boolean;
  }