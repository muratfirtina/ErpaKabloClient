import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { LanguageOption } from 'src/app/contracts/language/languageOptions';
import { Language } from 'src/app/enums/language';


@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'selectedLanguage';
  private currentLanguage = new BehaviorSubject<Language>(this.getStoredLanguage());
  private translations = new Map<string, any>();

  readonly languageOptions: LanguageOption[] = [
    { code: Language.TR, name: 'Türkçe', flag: '🇹🇷', direction: 'ltr' },
    { code: Language.EN, name: 'English', flag: '🇬🇧', direction: 'ltr' },
    { code: Language.RU, name: 'Русский', flag: '🇷🇺', direction: 'ltr' },
  ];

  constructor(private http: HttpClient) {
    this.loadTranslations(this.currentLanguage.value);
  }

  getCurrentLanguage(): Observable<Language> {
    return this.currentLanguage.asObservable();
  }

  async setLanguage(language: Language): Promise<void> {
    if (language !== this.currentLanguage.value) {
      await this.loadTranslations(language);
      localStorage.setItem(this.LANGUAGE_KEY, language);
      this.currentLanguage.next(language);
      document.documentElement.lang = language;
      document.documentElement.dir = this.getLanguageDirection(language);
    }
  }

  private getStoredLanguage(): Language {
    const storedLang = localStorage.getItem(this.LANGUAGE_KEY);
    const browserLang = navigator.language.split('-')[0];
    
    if (storedLang && Object.values(Language).includes(storedLang as Language)) {
      return storedLang as Language;
    }
    
    // Browser diline göre varsayılan dil seçimi
    if (browserLang && Object.values(Language).includes(browserLang as Language)) {
      return browserLang as Language;
    }
    
    return Language.EN; // Varsayılan dil
  }

  private getLanguageDirection(language: Language): 'ltr' | 'rtl' {
    const option = this.languageOptions.find(opt => opt.code === language);
    return option?.direction || 'ltr';
  }

  private async loadTranslations(language: Language): Promise<void> {
    if (!this.translations.has(language)) {
      try {
        const translations = await firstValueFrom(
          this.http.get<any>(`assets/i18n/${language}.json`)
        );
        this.translations.set(language, translations);
      } catch (error) {
        console.error(`Error loading translations for ${language}:`, error);
      }
    }
  }

  translate(key: string, params?: { [key: string]: string }): string {
    const translations = this.translations.get(this.currentLanguage.value);
    if (!translations) return key;

    let translation = this.getNestedTranslation(translations, key);
    if (!translation) return key;

    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }

    return translation;
  }

  private getNestedTranslation(translations: any, key: string): string {
    return key.split('.').reduce((obj, path) => obj?.[path], translations) || key;
  }
}