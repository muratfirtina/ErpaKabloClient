// cookie-consent.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Language } from 'src/app/enums/language';
import { AnalyticsService } from 'src/app/services/common/analytics.services';
import { environment } from 'src/environments/environment.prod';

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
  currentLang: Language = Language.EN; // Default is English
  Language = Language; // For accessing enum in template

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
        cancel: 'Cancel',
        descriptions: {
          necessary: 'These cookies are essential for the basic functionality of the website and cannot be disabled.',
          analytics: 'These cookies help us understand how visitors use our website. Google Analytics and Yandex Metrika are used.',
          marketing: 'These cookies are used to deliver more relevant advertisements to you.'
        }
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
        cancel: 'İptal',
        descriptions: {
          necessary: 'Bu çerezler, web sitemizin temel işlevleri için gereklidir ve devre dışı bırakılamazlar.',
          analytics: 'Bu çerezler, ziyaretçilerimizin web sitemizi nasıl kullandıklarını anlamamıza yardımcı olur. Google Analytics ve Yandex Metrika kullanılır.',
          marketing: 'Bu çerezler, size daha alakalı reklamlar sunmak için kullanılır.'
        }
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
        cancel: 'Отмена',
        descriptions: {
          necessary: 'Эти файлы cookie необходимы для основных функций веб-сайта и не могут быть отключены.',
          analytics: 'Эти файлы cookie помогают нам понять, как посетители используют наш веб-сайт. Используются Google Analytics и Яндекс Метрика.',
          marketing: 'Эти файлы cookie используются для показа более релевантной рекламы.'
        }
      }
    }
  };

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    // Check for existing cookie consent
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      this.isConsented = true;
      this.cookieSettings = JSON.parse(consent);
      this.initializeServices(); // Apply settings when page loads
    }

    // Get language preference from localStorage or use English as default
    const savedLang = localStorage.getItem('preferredLanguage');
    this.currentLang = (savedLang as Language) || Language.EN;
  
    // If there's temporary consent in session storage, hide the banner
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

    // Use localStorage for persistent preferences
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    // Use sessionStorage for temporary session
    sessionStorage.setItem('tempCookieConsent', 'true');
    
    this.cookieSettings = settings;
    this.isConsented = true;

    // Initialize analytics and marketing services
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
    // If analytics was previously enabled but is now disabled, disable tracking
    if (!this.cookieSettings.analytics) {
      this.analyticsService.disableTracking();
    }
    
    // Initialize all enabled services
    this.analyticsService.initializeAnalytics(this.cookieSettings);
    
    if (this.cookieSettings.marketing) {
      // Initialize marketing cookies/services
      this.initializeMarketingServices();
    } else {
      this.disableMarketingServices();
    }
  }
  
  private initializeMarketingServices(): void {
    // Here you would initialize marketing services like Facebook Pixel    
    // Example: Initialize Facebook Pixel
    // if (typeof fbq === 'function') {
    //   fbq('consent', 'grant');
    // } else {
    //   // Load Facebook Pixel code
    // }
  }
  
  private disableMarketingServices(): void {
    // Here you would disable marketing services
    console.log('Marketing services disabled');
    
    // Example: Disable Facebook Pixel
    // if (typeof fbq === 'function') {
    //   fbq('consent', 'revoke');
    // }
    
    // Remove marketing cookies
    const marketingCookies = ['_fbp', '_fbc']; // Add all marketing cookies here
    this.removeCookies(marketingCookies);
  }
  
  private removeCookies(cookieNames: string[]): void {
    cookieNames.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

  resetCookieConsent(): void {
    // Reset cookie preferences (for testing or resetting settings)
    localStorage.removeItem('cookieConsent');
    sessionStorage.removeItem('tempCookieConsent');
    
    // Disable all services that were previously enabled
    this.analyticsService.disableTracking();
    this.disableMarketingServices();
    
    this.isConsented = false;
    this.cookieSettings = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    
    console.log('Cookie preferences have been reset');
  }

  changeLanguage(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }
}