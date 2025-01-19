import { Language } from "src/app/enums/language";

export interface LanguageOption {
    code: Language;
    name: string;
    flag: string;
    direction: 'ltr' | 'rtl';
  }