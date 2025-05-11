// cookie-consent.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Language } from 'src/app/enums/language';
import { AnalyticsService } from 'src/app/services/common/analytics.services';
import { COMPANY_INFO } from 'src/app/config/company-info.config';
import { CookieModalService } from 'src/app/services/common/cookie-modal.service';

// Define interface for cookie settings
interface CookieSettings {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  personalData: boolean; // Explicit consent for personal data processing
  timestamp: string;
  expiryDate: string;
}

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.scss'
})
export class CookieConsentComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() consentGiven = new EventEmitter<void>();

  isConsented = false;
  showSettings = false;
  currentLang: Language = Language.EN; // Default is English
  Language = Language; // For accessing enum in template
  showConsentManager = false; // For the modal
  showBanner = true; // Control the visibility of the consent banner
  consentExpired = false;
  consentExpiry = 365; // Consent validity in days
  companyInfo = COMPANY_INFO; // Company information
  showFloatingButton = false;

  cookieSettings: Partial<CookieSettings> = {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    personalData: false
  };

  // Cookie lifespans by category
  cookieLifespans = {
    necessary: 'Session to 1 year',
    functional: '1 year',
    analytics: '26 months (Google Analytics), 1 year (Yandex Metrika)',
    marketing: '90 days to 2 years'
  };

  // Data retention periods by category
  dataRetentionPeriods = {
    necessary: 'Duration of session or up to 1 year for persistent preferences',
    functional: '1 year after last visit',
    analytics: 'Up to 26 months from collection (anonymized after 14 months)',
    marketing: 'Up to 2 years from collection'
  };

  // Legal basis for processing by category
  legalBasis = {
    necessary: 'Legitimate interest',
    functional: 'Consent',
    analytics: 'Consent',
    marketing: 'Consent'
  };

  translations = {
    [Language.EN]: {
      description: 'This website uses cookies to enhance your experience. We require your consent for certain types of cookies that process your personal data.',
      cookiePolicy: 'Cookie Policy',
      privacyPolicy: 'Privacy Policy',
      customizeSettings: 'Customize Settings',
      acceptAll: 'Accept All',
      manageConsent: 'Manage Cookie Consent',
      cookieExpired: 'Your cookie preferences have expired. Please review and update them.',
      dataProcessingConsent: 'I explicitly consent to the processing of my personal data as described in the Privacy Policy',
      consentRequired: 'Explicit consent is required to enable optional cookies',
      moreInfo: 'More Information',
      settings: {
        title: 'Cookie Settings',
        necessary: 'Necessary Cookies',
        functional: 'Functional Cookies',
        analytics: 'Analytics Cookies',
        marketing: 'Marketing Cookies',
        required: '(Required)',
        lifespan: 'Lifespan:',
        retention: 'Data retention:',
        legalBasis: 'Legal basis:',
        purposes: 'Purposes:',
        save: 'Save Settings',
        accept: 'Accept Selected',
        cancel: 'Cancel',
        descriptions: {
          necessary: 'These cookies are essential for the basic functionality of the website and cannot be disabled. They enable features like security and cart functionality.',
          functional: 'These cookies allow us to remember your preferences and settings to enhance your browsing experience. They enable features like language preferences and login status.',
          analytics: 'These cookies help us understand how visitors use our website by collecting anonymous statistics. This helps us improve site performance and user experience.',
          marketing: 'These cookies track your activity across websites to deliver personalized advertisements relevant to your interests.'
        }
      },
      userRights: {
        title: 'Your Rights',
        access: 'Right to access your data',
        rectification: 'Right to rectify inaccurate data',
        erasure: 'Right to erasure ("right to be forgotten")',
        restriction: 'Right to restrict processing',
        portability: 'Right to data portability',
        objection: 'Right to object to processing',
        withdraw: 'Right to withdraw consent',
        howTo: 'To exercise these rights, please contact our Data Protection Officer at:',
      },
      browserSettings: {
        title: 'Managing Cookies Through Your Browser',
        description: 'You can also control cookies through your browser settings:',
        chrome: 'Google Chrome: Settings → Privacy and Security → Cookies and other site data',
        firefox: 'Firefox: Options → Privacy & Security → Cookies and Site Data',
        safari: 'Safari: Preferences → Privacy → Cookies and website data',
        edge: 'Microsoft Edge: Settings → Cookies and site permissions → Cookies and site data',
        note: 'Note: Blocking all cookies may affect website functionality'
      }
    },
    [Language.TR]: {
      description: 'Bu web sitesi, deneyiminizi geliştirmek için çerezler kullanır. Kişisel verilerinizi işleyen belirli çerez türleri için izninizi gerektirir.',
      cookiePolicy: 'Çerez Politikası',
      privacyPolicy: 'Gizlilik Politikası',
      customizeSettings: 'Ayarları Özelleştir',
      acceptAll: 'Tümünü Kabul Et',
      manageConsent: 'Çerez İzinlerini Yönet',
      cookieExpired: 'Çerez tercihlerinizin süresi doldu. Lütfen gözden geçirin ve güncelleyin.',
      dataProcessingConsent: 'Gizlilik Politikasında açıklandığı şekilde kişisel verilerimin işlenmesine açıkça onay veriyorum',
      consentRequired: 'İsteğe bağlı çerezleri etkinleştirmek için açık rıza gereklidir',
      moreInfo: 'Daha Fazla Bilgi',
      settings: {
        title: 'Çerez Ayarları',
        necessary: 'Gerekli Çerezler',
        functional: 'İşlevsel Çerezler',
        analytics: 'Analitik Çerezler',
        marketing: 'Pazarlama Çerezleri',
        required: '(Zorunlu)',
        lifespan: 'Ömür:',
        retention: 'Veri saklama:',
        legalBasis: 'Hukuki dayanak:',
        purposes: 'Amaçlar:',
        save: 'Ayarları Kaydet',
        accept: 'Seçilenleri Kabul Et',
        cancel: 'İptal',
        descriptions: {
          necessary: 'Bu çerezler, web sitesinin temel işlevleri, güvenlik özellikleri ve sepet işlevselliği için gereklidir. Devre dışı bırakılamazlar.',
          functional: 'Bu çerezler, tarama deneyiminizi geliştirmek için tercihlerinizi ve ayarlarınızı hatırlamamızı sağlar. Dil tercihleri ve oturum durumu gibi özellikleri etkinleştirirler.',
          analytics: 'Bu çerezler, anonim istatistikler toplayarak ziyaretçilerin web sitemizi nasıl kullandıklarını anlamamıza yardımcı olur. Bu, site performansını ve kullanıcı deneyimini iyileştirmemize yardımcı olur.',
          marketing: 'Bu çerezler, ilgi alanlarınızla ilgili kişiselleştirilmiş reklamlar sunmak için web siteleri arasında etkinliğinizi takip eder.'
        }
      },
      userRights: {
        title: 'Haklarınız',
        access: 'Verilerinize erişim hakkı',
        rectification: 'Yanlış verileri düzeltme hakkı',
        erasure: 'Silme hakkı ("unutulma hakkı")',
        restriction: 'İşlemeyi kısıtlama hakkı',
        portability: 'Veri taşınabilirliği hakkı',
        objection: 'İşlemeye itiraz etme hakkı',
        withdraw: 'Rıza geri çekme hakkı',
        howTo: 'Bu hakları kullanmak için lütfen Veri Koruma Görevlimizle iletişime geçin:',
      },
      browserSettings: {
        title: 'Tarayıcınız Üzerinden Çerezleri Yönetme',
        description: 'Ayrıca tarayıcı ayarlarınız aracılığıyla çerezleri kontrol edebilirsiniz:',
        chrome: 'Google Chrome: Ayarlar → Gizlilik ve Güvenlik → Çerezler ve diğer site verileri',
        firefox: 'Firefox: Seçenekler → Gizlilik ve Güvenlik → Çerezler ve Site Verileri',
        safari: 'Safari: Tercihler → Gizlilik → Çerezler ve web sitesi verileri',
        edge: 'Microsoft Edge: Ayarlar → Çerezler ve site izinleri → Çerezler ve site verileri',
        note: 'Not: Tüm çerezleri engellemek web sitesi işlevselliğini etkileyebilir'
      }
    },
    [Language.RU]: {
      description: 'Этот веб-сайт использует файлы cookie для улучшения вашего опыта. Для определенных типов файлов cookie, обрабатывающих ваши персональные данные, требуется ваше согласие.',
      cookiePolicy: 'Политика использования файлов cookie',
      privacyPolicy: 'Политика конфиденциальности',
      customizeSettings: 'Настроить параметры',
      acceptAll: 'Принять все',
      manageConsent: 'Управление согласием на использование файлов cookie',
      cookieExpired: 'Срок действия ваших предпочтений в отношении файлов cookie истек. Пожалуйста, просмотрите и обновите их.',
      dataProcessingConsent: 'Я прямо соглашаюсь на обработку моих персональных данных, как описано в Политике конфиденциальности',
      consentRequired: 'Требуется явное согласие для включения дополнительных файлов cookie',
      moreInfo: 'Дополнительная информация',
      settings: {
        title: 'Настройки файлов cookie',
        necessary: 'Необходимые файлы cookie',
        functional: 'Функциональные файлы cookie',
        analytics: 'Аналитические файлы cookie',
        marketing: 'Маркетинговые файлы cookie',
        required: '(Обязательно)',
        lifespan: 'Срок действия:',
        retention: 'Хранение данных:',
        legalBasis: 'Правовая основа:',
        purposes: 'Цели:',
        save: 'Сохранить настройки',
        accept: 'Принять выбранные',
        cancel: 'Отмена',
        descriptions: {
          necessary: 'Эти файлы cookie необходимы для основных функций веб-сайта, функций безопасности и функциональности корзины. Они не могут быть отключены.',
          functional: 'Эти файлы cookie позволяют нам запоминать ваши предпочтения и настройки для улучшения вашего опыта просмотра. Они включают такие функции, как языковые предпочтения и состояние входа в систему.',
          analytics: 'Эти файлы cookie помогают нам понять, как посетители используют наш веб-сайт, собирая анонимную статистику. Это помогает нам улучшить производительность сайта и опыт пользователей.',
          marketing: 'Эти файлы cookie отслеживают вашу активность на веб-сайтах, чтобы предоставлять персонализированную рекламу, соответствующую вашим интересам.'
        }
      },
      userRights: {
        title: 'Ваши права',
        access: 'Право на доступ к вашим данным',
        rectification: 'Право на исправление неточных данных',
        erasure: 'Право на удаление ("право быть забытым")',
        restriction: 'Право на ограничение обработки',
        portability: 'Право на переносимость данных',
        objection: 'Право на возражение против обработки',
        withdraw: 'Право отозвать согласие',
        howTo: 'Для осуществления этих прав, пожалуйста, свяжитесь с нашим сотрудником по защите данных:',
      },
      browserSettings: {
        title: 'Управление файлами cookie через ваш браузер',
        description: 'Вы также можете управлять файлами cookie через настройки браузера:',
        chrome: 'Google Chrome: нажмите на значок меню (три точки) → Настройки → Конфиденциальность и безопасность → Файлы cookie и другие данные сайтов',
        firefox: 'Firefox: нажмите кнопку меню (три линии) → Настройки → Приватность и защита → Файлы cookie и данные сайтов',
        safari: 'Safari: перейдите в Safari → Настройки → Конфиденциальность → Файлы cookie и данные веб-сайтов',
        edge: 'Microsoft Edge: нажмите значок меню (три точки) → Настройки → Файлы cookie и разрешения сайтов → Файлы cookie и данные сайтов',
        note: 'Примечание: ограничение файлов cookie может повлиять на функциональность веб-сайта'
      }
    }
  };

  // Purpose text for each cookie category by language
  private purposeTexts = {
    [Language.EN]: {
      necessary: 'Website functionality, security, cart management, session tracking',
      functional: 'Remembering preferences, settings, and login status',
      analytics: 'Gathering anonymous statistics, analyzing website usage patterns, improving user experience',
      marketing: 'User profiling, targeted advertising, measuring ad effectiveness'
    },
    [Language.TR]: {
      necessary: 'Web sitesi işlevselliği, güvenlik, sepet yönetimi, oturum takibi',
      functional: 'Tercihleri, ayarları ve oturum durumunu hatırlama',
      analytics: 'Anonim istatistikler toplama, web sitesi kullanım kalıplarını analiz etme, kullanıcı deneyimini iyileştirme',
      marketing: 'Kullanıcı profili oluşturma, hedefli reklam, reklam etkinliğini ölçme'
    },
    [Language.RU]: {
      necessary: 'Функциональность веб-сайта, безопасность, управление корзиной, отслеживание сеанса',
      functional: 'Запоминание предпочтений, настроек и состояния входа',
      analytics: 'Сбор анонимной статистики, анализ моделей использования веб-сайта, улучшение пользовательского опыта',
      marketing: 'Профилирование пользователей, целевая реклама, измерение эффективности рекламы'
    }
  };

  constructor(
    private analyticsService: AnalyticsService,
    private cookieModalService: CookieModalService
  ) {}

  ngOnInit(): void {
    // Check if consent has expired
    if (this.isConsentExpired()) {
      localStorage.removeItem('cookieConsent');
      sessionStorage.removeItem('tempCookieConsent');
      this.isConsented = false;
      this.consentExpired = true;
    } else {
      // Check for existing cookie consent
      const consent = localStorage.getItem('cookieConsent');
      if (consent) {
        const savedSettings = JSON.parse(consent);
        this.cookieSettings = savedSettings;
        this.isConsented = true;
        this.initializeServices(); // Apply settings when page loads
      }
    }

    // Get language preference from localStorage or use English as default
    const savedLang = localStorage.getItem('preferredLanguage');
    this.currentLang = (savedLang as Language) || Language.EN;
  
    // If there's temporary consent in session storage, hide the banner
    const sessionConsent = sessionStorage.getItem('tempCookieConsent');
    if (sessionConsent) {
      this.isConsented = true;
    }

    // Subscribe to the cookie modal service to open the modal when requested
    this.cookieModalService.showModal$.subscribe(show => {
      if (show) {
        this.showConsentManager = true;
        
        // Update settings from localStorage when opening the manager
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
          this.cookieSettings = JSON.parse(consent);
        }
      }
    });

    // Check if cookie settings modal should be shown from cookie policy page
    const showCookieSettings = sessionStorage.getItem('showCookieSettings');
    if (showCookieSettings === 'true') {
      // Open cookie settings modal if requested
      this.showConsentManager = true;
      // Clean up the session storage flag
      sessionStorage.removeItem('showCookieSettings');
    }
  }

  private calculateExpiryDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  // Check if consent has expired
  private isConsentExpired(): boolean {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) return false;
    
    const settings = JSON.parse(consent);
    if (!settings.expiryDate) return false;
    
    return new Date() > new Date(settings.expiryDate);
  }

  acceptAll(): void {
    const settings: CookieSettings = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      personalData: true,
      timestamp: new Date().toISOString(),
      expiryDate: this.calculateExpiryDate(this.consentExpiry)
    };

    // Use localStorage for persistent preferences
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    // Use sessionStorage for temporary session
    sessionStorage.setItem('tempCookieConsent', 'true');
    
    this.cookieSettings = settings;
    this.isConsented = true;
    this.consentExpired = false;

    // Initialize analytics and marketing services
    this.initializeServices();
    
    // Emit event that consent has been given
    this.consentGiven.emit();
  }

  saveSettings(): void {
    // Check if personal data consent is given - if not, disable all non-essential cookies
    if (!this.cookieSettings.personalData) {
      this.cookieSettings.functional = false;
      this.cookieSettings.analytics = false;
      this.cookieSettings.marketing = false;
    }
    
    const settings: CookieSettings = {
      ...this.cookieSettings as CookieSettings,
      timestamp: new Date().toISOString(),
      expiryDate: this.calculateExpiryDate(this.consentExpiry)
    };

    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    sessionStorage.setItem('tempCookieConsent', 'true');
    
    this.isConsented = true;
    this.showSettings = false;
    this.consentExpired = false;

    this.initializeServices();
    
    // Emit events
    this.consentGiven.emit();
    this.modalClosed.emit();
  }

  closeModal(): void {
    this.showSettings = false;
    this.showConsentManager = false;
    this.modalClosed.emit();
  }

  toggleConsentManager(): void {
    this.showConsentManager = !this.showConsentManager;
    if (!this.showConsentManager) {
      this.modalClosed.emit();
    } else {
      // Update settings from localStorage when opening the manager
      const consent = localStorage.getItem('cookieConsent');
      if (consent) {
        this.cookieSettings = JSON.parse(consent);
      }
    }
  }

  // Helper method to toggle expansion of cookie options
  toggleExpand(event: Event, category: string): void {
    // Safe type casting
    const element = event.currentTarget as HTMLElement;
    if (element && element.parentElement && element.parentElement.parentElement) {
      element.parentElement.parentElement.classList.toggle('expanded');
    }
  }

  // Helper method to toggle expansion of sections
  toggleSectionExpand(event: Event, sectionType: string): void {
    // Safe type casting
    const element = event.currentTarget as HTMLElement;
    if (element && element.parentElement) {
      element.parentElement.classList.toggle('expanded');
    }
  }

  // Get purpose text for a specific cookie category based on current language
  getPurposeForCategory(category: string): string {
    return this.purposeTexts[this.currentLang][category];
  }

  private initializeServices(): void {
    // Initialize all services based on consent
    this.initializeFunctionalServices();
    
    // If analytics was previously enabled but is now disabled, disable tracking
    if (!this.cookieSettings.analytics) {
      this.analyticsService.disableTracking();
    } else if (this.cookieSettings.analytics) {
      this.analyticsService.initializeAnalytics({
        analytics: true,
        marketing: this.cookieSettings.marketing
      });
    }
    
    if (this.cookieSettings.marketing) {
      // Initialize marketing cookies/services
      this.initializeMarketingServices();
    } else {
      this.disableMarketingServices();
    }
  }
  
  private initializeFunctionalServices(): void {
    // Initialize functional cookies if enabled
    if (this.cookieSettings.functional) {
      // Here you would implement functionality for remembering user preferences
    } else {
      // Remove functional cookies
      this.removeCookies(['user_preferences', 'ui_settings']);
    }
  }
  
  private initializeMarketingServices(): void {
    // Here you would initialize marketing services like Facebook Pixel    

  }
  
  private disableMarketingServices(): void {
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
      functional: false,
      analytics: false,
      marketing: false,
      personalData: false
    };
    
    console.log('Cookie preferences have been reset');
  }

  changeLanguage(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }

  static resetAllConsent(): void {
    localStorage.removeItem('cookieConsent');
    sessionStorage.removeItem('tempCookieConsent');
    
    // Reload the page to show the consent banner again
    window.location.reload();
  }
}