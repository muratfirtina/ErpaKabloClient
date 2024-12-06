// cookie-policy.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Language } from 'src/app/enums/language';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-cookie-policy',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './cookie-policy.component.html',
  styleUrl: './cookie-policy.component.scss'
})
export class CookiePolicyComponent implements OnInit {
  currentLang: Language = Language.EN;
  Language = Language;
  currentConsent: any = null;

  translations = {
    [Language.EN]: {
      title: 'Cookie Policy',
      lastUpdated: 'Last updated',
      sections: {
        whatAreCookies: {
          title: '1. What Are Cookies?',
          content: 'Cookies are small text files stored on your device when you visit our website. These files help us provide you with a better user experience and remember your preferences.'
        },
        typesOfCookies: {
          title: '2. Types of Cookies We Use',
          necessary: {
            title: 'Necessary Cookies',
            content: 'These cookies are essential for the basic functionality of the website and cannot be disabled. They are used for session management and security purposes.'
          },
          analytics: {
            title: 'Analytics Cookies',
            content: 'These cookies help us understand how visitors use our website. The data collected is anonymous and is used to improve our site performance.'
          },
          marketing: {
            title: 'Marketing Cookies',
            content: 'These cookies are used to deliver more relevant advertisements to you. They allow us to show customized content and ads based on your interests.'
          }
        },
        howToManage: {
          title: '3. How to Manage Your Cookie Preferences',
          content: 'You can control or delete cookies through your browser settings. However, disabling necessary cookies may affect the functionality of our website.'
        },
        contactUs: {
          title: '4. Contact Us',
          content: 'If you have any questions about our cookie policy, please contact us:',
          email: 'Email: global@tumtrading.com',
          phone: 'Phone: +90 212 438 0 333'
        }
      }
    },
    [Language.TR]: {
      title: 'Çerez Politikası',
      lastUpdated: 'Son güncelleme',
      sections: {
        whatAreCookies: {
          title: '1. Çerez Nedir?',
          content: 'Çerezler, web sitemizi ziyaret ettiğinizde cihazınızda saklanan küçük metin dosyalarıdır. Bu dosyalar, size daha iyi bir kullanıcı deneyimi sunmamıza ve tercihlerinizi hatırlamamıza yardımcı olur.'
        },
        typesOfCookies: {
          title: '2. Hangi Çerezleri Kullanıyoruz?',
          necessary: {
            title: 'Gerekli Çerezler',
            content: 'Bu çerezler, web sitesinin temel işlevleri için gereklidir ve devre dışı bırakılamazlar. Oturum yönetimi ve güvenlik için kullanılırlar.'
          },
          analytics: {
            title: 'Analitik Çerezler',
            content: 'Bu çerezler, ziyaretçilerimizin web sitemizi nasıl kullandığını anlamamıza yardımcı olur. Toplanan veriler anonimdir ve site performansımızı iyileştirmek için kullanılır.'
          },
          marketing: {
            title: 'Pazarlama Çerezleri',
            content: 'Bu çerezler, size daha alakalı reklamlar sunmak için kullanılır. İlgi alanlarınıza göre özelleştirilmiş içerik ve reklamlar görmemizi sağlarlar.'
          }
        },
        howToManage: {
          title: '3. Çerez Tercihlerinizi Nasıl Yönetebilirsiniz?',
          content: 'Tarayıcı ayarlarınızdan çerezleri kontrol edebilir veya silebilirsiniz. Ancak, gerekli çerezleri devre dışı bırakmanız durumunda web sitemizin bazı özellikleri düzgün çalışmayabilir.'
        },
        contactUs: {
          title: '4. İletişim',
          content: 'Çerez politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:',
          email: 'E-posta: global@tumtrading.com',
          phone: 'Telefon: +90 212 438 0 333'
        }
      }
    },
    [Language.RU]: {
      title: 'Политика использования файлов cookie',
      lastUpdated: 'Последнее обновление',
      sections: {
        whatAreCookies: {
          title: '1. Что такое файлы cookie?',
          content: 'Файлы cookie - это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении нашего сайта. Эти файлы помогают нам обеспечить вам лучший пользовательский опыт и запомнить ваши предпочтения.'
        },
        typesOfCookies: {
          title: '2. Какие файлы cookie мы используем?',
          necessary: {
            title: 'Необходимые файлы cookie',
            content: 'Эти файлы cookie необходимы для базовой функциональности веб-сайта и не могут быть отключены. Они используются для управления сессией и обеспечения безопасности.'
          },
          analytics: {
            title: 'Аналитические файлы cookie',
            content: 'Эти файлы cookie помогают нам понять, как посетители используют наш веб-сайт. Собранные данные анонимны и используются для улучшения производительности сайта.'
          },
          marketing: {
            title: 'Маркетинговые файлы cookie',
            content: 'Эти файлы cookie используются для показа более релевантной рекламы. Они позволяют нам показывать персонализированный контент и рекламу на основе ваших интересов.'
          }
        },
        howToManage: {
          title: '3. Как управлять настройками файлов cookie?',
          content: 'Вы можете управлять файлами cookie через настройки браузера. Однако отключение необходимых файлов cookie может повлиять на функциональность сайта.'
        },
        contactUs: {
          title: '4. Свяжитесь с нами',
          content: 'Если у вас есть вопросы о нашей политике использования файлов cookie, пожалуйста, свяжитесь с нами:',
          email: 'Email: global@tumtrading.com',
          phone: 'Телефон: +90 212 438 0 333'
        }
      }
    }
  };

  ngOnInit(): void {
    // Get saved language preference or use default (English)
    const savedLang = localStorage.getItem('preferredLanguage');
    this.currentLang = (savedLang as Language) || Language.EN;

    // Get current cookie consent settings
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      this.currentConsent = JSON.parse(consent);
    }
  }

  changeLanguage(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }
}
