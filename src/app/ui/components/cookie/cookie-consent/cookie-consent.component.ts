// cookie-consent.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Language } from 'src/app/enums/language';
import { AnalyticsService } from 'src/app/services/common/analytics.services';
import { environment } from 'src/enviroments/enviroment.prod';

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
    analytics: true,
    marketing: true
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
          analytics: 'These cookies help us understand how visitors use our website. Google Analytics is used.',
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
          analytics: 'Bu çerezler, ziyaretçilerimizin web sitemizi nasıl kullandıklarını anlamamıza yardımcı olur. Google Analytics kullanılır.',
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
          analytics: 'Эти файлы cookie помогают нам понять, как посетители используют наш веб-сайт. Используется Google Analytics.',
          marketing: 'Эти файлы cookie используются для показа более релевантной рекламы.'
        }
      }
    }
  };

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      this.isConsented = true;
      this.cookieSettings = JSON.parse(consent);
      this.initializeServices(); // Sayfa yüklendiğinde ayarları uygula
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
    // Analytics servisleri başlat
    if (this.cookieSettings.analytics) {
      this.analyticsService.initGoogleAnalytics(environment.googleAnalyticsId);
      console.log('Analytics initialized with user consent');
    }

    if (this.cookieSettings.marketing) {
      // Marketing çerezlerini başlat
      console.log('Marketing cookies initialized');
      // Burada Facebook Pixel veya diğer pazarlama araçlarını başlatabilirsiniz
    }
  }

  resetCookieConsent(): void {
    // Çerez tercihlerini sıfırlama (test veya ayar sıfırlama için)
    localStorage.removeItem('cookieConsent');
    sessionStorage.removeItem('tempCookieConsent');
    this.isConsented = false;
    this.cookieSettings = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    
    // Kullanıcıya tercihlerin sıfırlandığı bilgisini verebilirsiniz
    console.log('Cookie preferences have been reset');
  }

  changeLanguage(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }
}