// cookie-consent.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Language } from 'src/app/enums/language';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.scss'
})
export class CookieConsentComponent implements OnInit {
  isConsented = false;
  showSettings = false;
  currentLang: Language = Language.EN; // Varsayılan İngilizce
  Language = Language; // Template'de enum'a erişim için

  cookieSettings = {
    necessary: true,
    analytics: false,
    marketing: false
  };

  translations = {
    [Language.EN]: {
      description: 'This website uses cookies to enhance your experience. By continuing to use our site, you consent to our use of cookies.',
      cookiePolicy: 'Cookie Policy',
      customizeSettings: 'Customize Settings',
      acceptAll: 'Accept All',
      settings: {
        title: 'Cookie Settings',
        necessary: 'Necessary Cookies',
        analytics: 'Analytics Cookies',
        marketing: 'Marketing Cookies',
        required: '(Required)',
        save: 'Save Settings',
        cancel: 'Cancel'
      }
    },
    [Language.TR]: {
      description: 'Bu web sitesi deneyiminizi geliştirmek için çerezleri kullanmaktadır. Sitemizi kullanmaya devam ederek çerez kullanımına izin vermiş olursunuz.',
      cookiePolicy: 'Çerez Politikası',
      customizeSettings: 'Ayarları Özelleştir',
      acceptAll: 'Tümünü Kabul Et',
      settings: {
        title: 'Çerez Ayarları',
        necessary: 'Gerekli Çerezler',
        analytics: 'Analitik Çerezler',
        marketing: 'Pazarlama Çerezleri',
        required: '(Zorunlu)',
        save: 'Ayarları Kaydet',
        cancel: 'İptal'
      }
    },
    [Language.RU]: {
      description: 'Этот веб-сайт использует файлы cookie для улучшения вашего опыта. Продолжая использовать наш сайт, вы соглашаетесь на использование файлов cookie.',
      cookiePolicy: 'Политика использования файлов cookie',
      customizeSettings: 'Настроить параметры',
      acceptAll: 'Принять все',
      settings: {
        title: 'Настройки файлов cookie',
        necessary: 'Необходимые файлы cookie',
        analytics: 'Аналитические файлы cookie',
        marketing: 'Маркетинговые файлы cookie',
        required: '(Обязательно)',
        save: 'Сохранить настройки',
        cancel: 'Отмена'
      }
    }
  };

  ngOnInit(): void {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      this.isConsented = true;
      this.cookieSettings = JSON.parse(consent);
    }

    // Dil tercihini localStorage'dan al veya varsayılan olarak İngilizce kullan
    const savedLang = localStorage.getItem('preferredLanguage');
    this.currentLang = savedLang as Language || Language.EN;
  
    // Eğer session storage'da geçici onay yoksa, banner'ı göster
    const sessionConsent = sessionStorage.getItem('tempCookieConsent');
    if (sessionConsent) {
      this.isConsented = true;
    }
  }

  acceptAll(): void {
    const settings = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };

    // Kalıcı tercih için localStorage kullan
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    // Geçici oturum için sessionStorage kullan
    sessionStorage.setItem('tempCookieConsent', 'true');
    
    this.cookieSettings = settings;
    this.isConsented = true;

    // Analytics ve Marketing çerezlerini aktifleştir
    this.initializeServices();
  }

  saveSettings(): void {
    const settings = {
      ...this.cookieSettings,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    sessionStorage.setItem('tempCookieConsent', 'true');
    
    this.isConsented = true;
    this.showSettings = false;

    this.initializeServices();
  }

  private initializeServices(): void {
    if (this.cookieSettings.analytics) {
      // Google Analytics veya benzeri servisleri başlat
      console.log('Analytics initialized');
    }

    if (this.cookieSettings.marketing) {
      // Marketing çerezlerini başlat
      console.log('Marketing cookies initialized');
    }
  }
  changeLanguage(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }
}