// cookie-policy.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Language } from 'src/app/enums/language';
import { RouterModule } from '@angular/router';
import { COMPANY_INFO } from 'src/app/config/company-info.config';
import { CookieModalService } from 'src/app/services/common/cookie-modal.service';

@Component({
  selector: 'app-cookie-policy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cookie-policy.component.html',
  styleUrl: './cookie-policy.component.scss'
})
export class CookiePolicyComponent implements OnInit {

  constructor(private cookieModalService: CookieModalService) {}

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
  currentLang: Language = Language.EN;
  Language = Language;
  currentConsent: any = null;
  lastUpdatedDate = '2025-04-06'; // Update this when you make changes to the policy
  showCookieModal = false;

  // Data controller information
  dataController = {
    company: COMPANY_INFO.Name,
    address: COMPANY_INFO.Address,
    representative: COMPANY_INFO.representative,
    email: COMPANY_INFO.Email,
    phone: COMPANY_INFO.Phone,
    kvkkReg: COMPANY_INFO.kvkkReg
  };

  // Cookie information organized by category
  cookieDetails = {
    necessary: [
      { name: 'PHPSESSID', provider: 'TUMDEX.com', purpose: 'Session management', expiry: 'Session' },
      { name: 'cookieConsent', provider: 'TUMDEX.com', purpose: 'Store cookie consent choices', expiry: '1 year' },
      { name: 'auth_token', provider: 'TUMDEX.com', purpose: 'Authentication', expiry: '30 days' }
    ],
    functional: [
      { name: 'ui_settings', provider: 'TUMDEX.com', purpose: 'Store user interface preferences', expiry: '1 year' },
      { name: 'preferred_language', provider: 'TUMDEX.com', purpose: 'Store language preferences', expiry: '1 year' }
    ],
    analytics: [
      { name: '_ga', provider: 'Google Analytics', purpose: 'Distinguish users', expiry: '2 years' },
      { name: '_gid', provider: 'Google Analytics', purpose: 'Distinguish users', expiry: '24 hours' },
      { name: '_gat', provider: 'Google Analytics', purpose: 'Throttle request rate', expiry: '1 minute' },
      { name: '_ym_uid', provider: 'Yandex Metrika', purpose: 'User identification', expiry: '1 year' },
      { name: '_ym_d', provider: 'Yandex Metrika', purpose: 'Date of first site visit', expiry: '1 year' }
    ],
    marketing: [
      { name: '_fbp', provider: 'Facebook', purpose: 'Store and track visits across websites', expiry: '90 days' }
    ]
  };

  translations = {
    [Language.EN]: {
      title: 'Cookie Policy',
      lastUpdated: 'Last updated',
      manageCookies: 'Manage Cookie Preferences',
      sections: {
        introduction: {
          title: '1. Introduction',
          content: 'This Cookie Policy explains how TUMDEX.com ("we", "us", or "our"), operated by Tum Trading, uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.'
        },
        whatAreCookies: {
          title: '2. What Are Cookies?',
          content: 'Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work efficiently and provide analytical information. Cookies set by the website owner (in this case, TUMDEX.com) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (such as advertising, interactive content, and analytics).'
        },
        howWeUseCookies: {
          title: '3. How We Use Cookies',
          content: 'We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons necessary for our website to operate, and we refer to these as "essential" or "necessary" cookies. Other cookies enable us to enhance the performance and functionality of our services but are non-essential to their use. Others are used to track your behavior on our website and gather analytics data such as how long you spend on our pages. Finally, some cookies are placed by third parties for marketing purposes.'
        },
        typesOfCookies: {
          title: '4. Types of Cookies We Use',
          necessaryTitle: 'Necessary Cookies',
          necessaryContent: 'These cookies are essential for the basic functionality of the website and cannot be disabled. They are typically set in response to actions you make which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms. These cookies do not store any personally identifiable information.',
          functionalTitle: 'Functional Cookies',
          functionalContent: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages. If you disable these cookies, some or all of these services may not function properly.',
          analyticsTitle: 'Analytics Cookies',
          analyticsContent: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you disable these cookies, we will not know when you have visited our site.',
          marketingTitle: 'Marketing Cookies',
          marketingContent: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites. They do not directly store personal information but are based on uniquely identifying your browser and internet device. If you disable these cookies, you will experience less targeted advertising.'
        },
        cookieList: {
          title: '5. Specific Cookies We Use',
          name: 'Name',
          provider: 'Provider',
          purpose: 'Purpose',
          expiry: 'Expiry',
          category: 'Category'
        },
        dataRetention: {
          title: '6. Data Retention and Cookie Lifespans',
          content: 'Different cookies have different lifespans. Some cookies, called session cookies, are erased when you close your browser. Others, called persistent cookies, can remain on your device for a fixed period which can be months or even years. We strive to use cookies with reasonable lifespans:',
          necessary: 'Necessary cookies: Typically session cookies or up to 1 year for persistent authentication preferences',
          functional: 'Functional cookies: Up to 1 year to preserve your site preferences',
          analytics: 'Analytics cookies: Up to 26 months (Google Analytics), though we anonymize the data after 14 months',
          marketing: 'Marketing cookies: Typically between 90 days and 2 years depending on the third-party provider',
          dataRetention: 'Data collected through cookies is retained in accordance with our Privacy Policy. Generally, we retain data only as long as necessary for the purposes specified in this Cookie Policy and our Privacy Policy.'
        },
        legalBasis: {
          title: '7. Legal Basis for Processing',
          content: 'We process data collected by cookies based on different legal grounds depending on the type of cookie:',
          necessary: 'Necessary cookies: Processed based on legitimate interest (Article 6(1)(f) of the GDPR and similar provisions in the KVKK) as they are required for the provision of our services',
          other: 'Functional, analytics, and marketing cookies: Processed based on your consent (Article 6(1)(a) of the GDPR and similar provisions in the KVKK)'
        },
        howToManage: {
          title: '8. How to Manage Your Cookie Preferences',
          content: 'You can set and modify your cookie preferences at any time using our cookie consent tool, which is accessible via the "Manage Cookie Consent" button in the bottom right corner of our website. Additionally, most web browsers allow some control of most cookies through the browser settings.',
          browserInstructions: 'Here\'s how to manage cookies in major browsers:',
          chrome: 'Google Chrome: Click the menu icon (three dots) → Settings → Privacy and Security → Cookies and other site data',
          firefox: 'Firefox: Click the menu button (three lines) → Options → Privacy & Security → Cookies and Site Data',
          safari: 'Safari: Go to Safari → Preferences → Privacy → Cookies and website data',
          edge: 'Microsoft Edge: Click the menu icon (three dots) → Settings → Cookies and site permissions → Cookies and site data',
          note: 'Note: Restricting cookies may impact the functionality of our website. If you delete or block necessary cookies, you may not be able to use some features on the site.'
        },
        gdprCompliance: {
          title: '9. GDPR and KVKK Compliance',
          content: 'We are committed to complying with the General Data Protection Regulation (GDPR) and Turkish Personal Data Protection Law (KVKK). In accordance with these regulations:',
          rights: 'Your rights under GDPR and KVKK include:',
          rightsList: [
            'Right to be informed about how your personal data is used',
            'Right to access your personal data that we hold',
            'Right to request the correction of inaccurate personal data',
            'Right to request the erasure of your personal data in certain situations',
            'Right to restrict processing of your personal data',
            'Right to data portability',
            'Right to object to the processing of your personal data',
            'Right to withdraw consent at any time where we rely on consent to process your personal data'
          ],
          exerciseRights: 'To exercise your rights or if you have any questions about our use of cookies, please contact our Data Protection Officer at the details provided below.'
        },
        crossBorderData: {
          title: '10. Cross-Border Data Transfers',
          content: 'Some of our third-party cookie providers may process your data outside of the European Economic Area (EEA) or Turkey. When such transfers occur, we ensure appropriate safeguards are in place, such as using providers who are certified under the EU-US Privacy Shield, Standard Contractual Clauses, or other applicable data transfer mechanisms.'
        },
        children: {
          title: '11. Children\'s Privacy',
          content: 'Our website is not intended for children under the age of 16. We do not knowingly collect personal data from children under 16. If you are under 16, please do not use cookies that require consent on our website.'
        },
        changes: {
          title: '12. Changes to This Cookie Policy',
          content: 'We may update our Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We will notify you of any significant changes by placing a prominent notice on our website.'
        },
        contactUs: {
          title: '13. Contact Us',
          content: 'If you have any questions about our Cookie Policy, please contact us:',
          dataController: 'Data Controller Information:',
          company: 'Company Name:',
          address: 'Address:',
          representative: 'Data Protection Representative:',
          email: 'Email for Privacy Inquiries:',
          phone: 'Phone:'
        }
      }
    },
    [Language.TR]: {
      title: 'Çerez Politikası',
      lastUpdated: 'Son güncelleme',
      manageCookies: 'Çerez Tercihlerini Yönet',

      sections: {
        introduction: {
          title: '1. Giriş',
          content: 'Bu Çerez Politikası, Tum Trading tarafından işletilen TUMDEX.com ("biz", "bize" veya "bizim") olarak web sitemizi ziyaret ettiğinizde sizi tanımak için çerezleri ve benzer teknolojileri nasıl kullandığımızı açıklar. Bu politika, bu teknolojilerin ne olduğunu ve neden kullandığımızı, ayrıca bunların kullanımını kontrol etme haklarınızı açıklamaktadır.'
        },
        whatAreCookies: {
          title: '2. Çerezler Nedir?',
          content: 'Çerezler, bir web sitesini ziyaret ettiğinizde bilgisayarınıza veya mobil cihazınıza yerleştirilen küçük veri dosyalarıdır. Çerezler, web sitesi sahipleri tarafından web sitelerinin verimli çalışmasını sağlamak ve analitik bilgiler sağlamak için yaygın olarak kullanılır. Web sitesi sahibi (bu durumda TUMDEX.com) tarafından ayarlanan çerezler "birinci taraf çerezleri" olarak adlandırılır. Web sitesi sahibi dışındaki taraflarca ayarlanan çerezler "üçüncü taraf çerezleri" olarak adlandırılır. Üçüncü taraf çerezleri, web sitesi üzerinde veya aracılığıyla üçüncü taraf özelliklerinin veya işlevselliğinin sağlanmasını mümkün kılar (reklam, etkileşimli içerik ve analiz gibi).'
        },
        howWeUseCookies: {
          title: '3. Çerezleri Nasıl Kullanıyoruz',
          content: 'Birinci taraf ve üçüncü taraf çerezleri çeşitli nedenlerle kullanıyoruz. Bazı çerezler, web sitemizin çalışması için gerekli teknik nedenlerden dolayı gereklidir ve bunları "temel" veya "gerekli" çerezler olarak adlandırırız. Diğer çerezler, hizmetlerimizin performansını ve işlevselliğini geliştirmemizi sağlar, ancak kullanımları için zorunlu değildir. Diğerleri, sayfalarımızda ne kadar zaman geçirdiğiniz gibi web sitemizdeki davranışınızı izlemek ve analitik verileri toplamak için kullanılır. Son olarak, bazı çerezler pazarlama amaçlı olarak üçüncü taraflarca yerleştirilir.'
        },
        typesOfCookies: {
          title: '4. Kullandığımız Çerez Türleri',
          necessaryTitle: 'Gerekli Çerezler',
          necessaryContent: 'Bu çerezler, web sitesinin temel işlevselliği için gereklidir ve devre dışı bırakılamazlar. Genellikle, gizlilik tercihlerinizi ayarlama, oturum açma veya formları doldurma gibi hizmet talepleri anlamına gelen eylemlerinize yanıt olarak ayarlanırlar. Bu çerezler kişisel olarak tanımlanabilir bilgileri saklamazlar.',
          functionalTitle: 'İşlevsel Çerezler',
          functionalContent: 'Bu çerezler, web sitesinin gelişmiş işlevsellik ve kişiselleştirme sağlamasını mümkün kılar. Bunlar, tarafımızdan veya sayfalarımıza eklediğimiz hizmetleri sağlayan üçüncü taraf sağlayıcılar tarafından ayarlanabilir. Bu çerezleri devre dışı bırakırsanız, bu hizmetlerin bazıları veya tümü düzgün çalışmayabilir.',
          analyticsTitle: 'Analitik Çerezler',
          analyticsContent: 'Bu çerezler, ziyaretleri ve trafik kaynaklarını saymamıza ve sitemizin performansını ölçüp iyileştirmemize olanak tanır. Hangi sayfaların en popüler ve en az popüler olduğunu bilmemize ve ziyaretçilerin site içinde nasıl dolaştığını görmemize yardımcı olurlar. Bu çerezlerin topladığı tüm bilgiler toplu halde ve dolayısıyla anonimdir. Bu çerezleri devre dışı bırakırsanız, sitemizi ne zaman ziyaret ettiğinizi bilemeyiz.',
          marketingTitle: 'Pazarlama Çerezleri',
          marketingContent: 'Bu çerezler, reklam ortaklarımız tarafından sitemiz aracılığıyla ayarlanabilir. Bu şirketler tarafından ilgi alanlarınızın profilini oluşturmak ve sizlere diğer sitelerde ilgili reklamlar göstermek için kullanılabilirler. Doğrudan kişisel bilgileri saklamazlar, ancak tarayıcınızı ve internet cihazınızı benzersiz bir şekilde tanımaya dayalıdırlar. Bu çerezleri devre dışı bırakırsanız, daha az hedefli reklam göreceksiniz.'
        },
        cookieList: {
          title: '5. Kullandığımız Belirli Çerezler',
          name: 'İsim',
          provider: 'Sağlayıcı',
          purpose: 'Amaç',
          expiry: 'Süre',
          category: 'Kategori'
        },
        dataRetention: {
          title: '6. Veri Saklama ve Çerez Ömürleri',
          content: 'Farklı çerezlerin farklı ömürleri vardır. Oturum çerezleri olarak adlandırılan bazı çerezler, tarayıcınızı kapattığınızda silinir. Kalıcı çerezler olarak adlandırılan diğerleri, aylar hatta yıllar olabilen sabit bir süre boyunca cihazınızda kalabilir. Makul ömürlere sahip çerezler kullanmaya çalışıyoruz:',
          necessary: 'Gerekli çerezler: Genellikle oturum çerezleri veya kalıcı kimlik doğrulama tercihleri için en fazla 1 yıl',
          functional: 'İşlevsel çerezler: Site tercihlerinizi korumak için en fazla 1 yıl',
          analytics: 'Analitik çerezler: En fazla 26 ay (Google Analytics), ancak 14 ay sonra verileri anonimleştiriyoruz',
          marketing: 'Pazarlama çerezleri: Üçüncü taraf sağlayıcıya bağlı olarak genellikle 90 gün ile 2 yıl arasında',
          dataRetention: 'Çerezler aracılığıyla toplanan veriler, Gizlilik Politikamıza uygun olarak saklanır. Genel olarak, verileri yalnızca bu Çerez Politikasında ve Gizlilik Politikamızda belirtilen amaçlar için gerekli olduğu sürece saklarız.'
        },
        legalBasis: {
          title: '7. İşleme için Hukuki Dayanak',
          content: 'Çerezler tarafından toplanan verileri, çerez türüne bağlı olarak farklı yasal dayanaklara göre işliyoruz:',
          necessary: 'Gerekli çerezler: Hizmetlerimizin sağlanması için gerekli olduklarından, meşru menfaat (GDPR\'nin 6(1)(f) maddesi ve KVKK\'daki benzer hükümler) temelinde işlenirler',
          other: 'İşlevsel, analitik ve pazarlama çerezleri: Rızanıza dayanarak işlenirler (GDPR\'nin 6(1)(a) maddesi ve KVKK\'daki benzer hükümler)'
        },
        howToManage: {
          title: '8. Çerez Tercihlerinizi Nasıl Yönetebilirsiniz',
          content: 'Çerez tercihlerinizi, web sitemizin sağ alt köşesindeki "Çerez İzinlerini Yönet" düğmesi aracılığıyla erişilebilen çerez izin aracımızı kullanarak istediğiniz zaman ayarlayabilir ve değiştirebilirsiniz. Ek olarak, çoğu web tarayıcısı, tarayıcı ayarları aracılığıyla çoğu çerezin bir miktar kontrolüne izin verir.',
          browserInstructions: 'Büyük tarayıcılarda çerezleri yönetme yolları:',
          chrome: 'Google Chrome: Menü simgesine (üç nokta) tıklayın → Ayarlar → Gizlilik ve Güvenlik → Çerezler ve diğer site verileri',
          firefox: 'Firefox: Menü düğmesine (üç çizgi) tıklayın → Seçenekler → Gizlilik ve Güvenlik → Çerezler ve Site Verileri',
          safari: 'Safari: Safari → Tercihler → Gizlilik → Çerezler ve web sitesi verileri',
          edge: 'Microsoft Edge: Menü simgesine (üç nokta) tıklayın → Ayarlar → Çerezler ve site izinleri → Çerezler ve site verileri',
          note: 'Not: Çerezleri kısıtlamak web sitemizin işlevselliğini etkileyebilir. Gerekli çerezleri silerseniz veya engellerseniz, sitedeki bazı özellikleri kullanamayabilirsiniz.'
        },
        gdprCompliance: {
          title: '9. GDPR ve KVKK Uyumu',
          content: 'Genel Veri Koruma Yönetmeliği (GDPR) ve Türk Kişisel Verilerin Korunması Kanunu (KVKK) ile uyumlu olmayı taahhüt ediyoruz. Bu düzenlemelere uygun olarak:',
          rights: 'GDPR ve KVKK kapsamındaki haklarınız şunları içerir:',
          rightsList: [
            'Kişisel verilerinizin nasıl kullanıldığı hakkında bilgilendirilme hakkı',
            'Sakladığımız kişisel verilerinize erişim hakkı',
            'Yanlış kişisel verilerin düzeltilmesini talep etme hakkı',
            'Belirli durumlarda kişisel verilerinizin silinmesini talep etme hakkı',
            'Kişisel verilerinizin işlenmesini kısıtlama hakkı',
            'Veri taşınabilirliği hakkı',
            'Kişisel verilerinizin işlenmesine itiraz etme hakkı',
            'Kişisel verilerinizi işlemek için rızanıza güvendiğimiz durumlarda istediğiniz zaman rızanızı geri çekme hakkı'
          ],
          exerciseRights: 'Haklarınızı kullanmak veya çerez kullanımımız hakkında sorularınız varsa, lütfen aşağıda belirtilen iletişim bilgilerinden Veri Koruma Görevlimizle iletişime geçin.'
        },
        crossBorderData: {
          title: '10. Sınır Ötesi Veri Transferleri',
          content: 'Bazı üçüncü taraf çerez sağlayıcılarımız, verilerinizi Avrupa Ekonomik Alanı (AEA) veya Türkiye dışında işleyebilir. Bu tür transferler gerçekleştiğinde, AB-ABD Gizlilik Kalkanı kapsamında sertifikalı sağlayıcılar kullanma, Standart Sözleşme Maddeleri veya diğer geçerli veri aktarım mekanizmaları gibi uygun güvenlik önlemlerinin alındığından emin oluruz.'
        },
        children: {
          title: '11. Çocukların Gizliliği',
          content: 'Web sitemiz 16 yaşın altındaki çocuklar için tasarlanmamıştır. 16 yaşın altındaki çocuklardan bilerek kişisel veri toplamıyoruz. 16 yaşın altındaysanız, lütfen web sitemizde rıza gerektiren çerezleri kullanmayın.'
        },
        changes: {
          title: '12. Bu Çerez Politikasındaki Değişiklikler',
          content: 'Çerez Politikamızı zaman zaman güncelleyebiliriz. Herhangi bir değişiklik, güncellenmiş bir revizyon tarihi ile bu sayfada yayınlanacaktır. Önemli değişiklikler hakkında web sitemize belirgin bir bildirim yerleştirerek sizi bilgilendireceğiz.'
        },
        contactUs: {
          title: '13. Bize Ulaşın',
          content: 'Çerez Politikamız hakkında herhangi bir sorunuz varsa, lütfen bizimle iletişime geçin:',
          dataController: 'Veri Sorumlusu Bilgileri:',
          company: 'Şirket Adı:',
          address: 'Adres:',
          representative: 'Veri Koruma Temsilcisi:',
          email: 'Gizlilik Soruları için E-posta:',
          phone: 'Telefon:'
        }
      }
    },
    [Language.RU]: {
      title: 'Политика использования файлов cookie',
      lastUpdated: 'Последнее обновление',
      manageCookies: 'Управление настройками файлов cookie',
      sections: {
        introduction: {
          title: '1. Введение',
          content: 'Эта Политика использования файлов cookie объясняет, как TUMDEX.com («мы», «нас» или «наш»), управляемый компанией Tum Trading, использует файлы cookie и аналогичные технологии для распознавания вас при посещении нашего веб-сайта. В ней объясняется, что представляют собой эти технологии и почему мы их используем, а также ваши права на контроль над их использованием.'
        },
        whatAreCookies: {
          title: '2. Что такое файлы cookie?',
          content: 'Файлы cookie — это небольшие файлы данных, которые помещаются на ваш компьютер или мобильное устройство при посещении веб-сайта. Файлы cookie широко используются владельцами веб-сайтов для обеспечения эффективной работы своих веб-сайтов и предоставления аналитической информации. Файлы cookie, установленные владельцем веб-сайта (в данном случае TUMDEX.com), называются файлами cookie «первой стороны». Файлы cookie, установленные сторонами, отличными от владельца веб-сайта, называются «сторонними файлами cookie». Сторонние файлы cookie позволяют предоставлять сторонние функции или функциональность на веб-сайте или через него (например, рекламу, интерактивный контент и аналитику).'
        },
        howWeUseCookies: {
          title: '3. Как мы используем файлы cookie',
          content: 'Мы используем файлы cookie первой и третьей стороны по нескольким причинам. Некоторые файлы cookie необходимы по техническим причинам для работы нашего веб-сайта, и мы называем их «основными» или «необходимыми» файлами cookie. Другие файлы cookie позволяют нам улучшать производительность и функциональность наших услуг, но не являются необходимыми для их использования. Другие используются для отслеживания вашего поведения на нашем веб-сайте и сбора аналитических данных, таких как, сколько времени вы проводите на наших страницах. Наконец, некоторые файлы cookie размещаются третьими сторонами в маркетинговых целях.'
        },
        typesOfCookies: {
          title: '4. Типы используемых нами файлов cookie',
          necessaryTitle: 'Необходимые файлы cookie',
          necessaryContent: 'Эти файлы cookie необходимы для базовой функциональности веб-сайта и не могут быть отключены. Они обычно устанавливаются в ответ на действия, которые вы совершаете, что равносильно запросу услуг, например настройке ваших предпочтений конфиденциальности, входу в систему или заполнению форм. Эти файлы cookie не хранят никакой личной информации.',
          functionalTitle: 'Функциональные файлы cookie',
          functionalContent: 'Эти файлы cookie позволяют веб-сайту обеспечивать расширенную функциональность и персонализацию. Они могут быть установлены нами или сторонними поставщиками, чьи услуги мы добавили на наши страницы. Если вы отключите эти файлы cookie, некоторые или все эти услуги могут работать неправильно.',
          analyticsTitle: 'Аналитические файлы cookie',
          analyticsContent: 'Эти файлы cookie позволяют нам подсчитывать посещения и источники трафика, чтобы мы могли измерять и улучшать производительность нашего сайта. Они помогают нам узнать, какие страницы наиболее и наименее популярны, и увидеть, как посетители перемещаются по сайту. Вся информация, которую собирают эти файлы cookie, агрегируется и поэтому анонимна. Если вы отключите эти файлы cookie, мы не будем знать, когда вы посетили наш сайт.',
          marketingTitle: 'Маркетинговые файлы cookie',
          marketingContent: 'Эти файлы cookie могут быть установлены через наш сайт нашими рекламными партнерами. Они могут использоваться этими компаниями для создания профиля ваших интересов и показа вам релевантной рекламы на других сайтах. Они не хранят непосредственно персональные данные, но основаны на уникальной идентификации вашего браузера и интернет-устройства. Если вы отключите эти файлы cookie, вы будете видеть менее таргетированную рекламу.'
        },
        cookieList: {
          title: '5. Конкретные используемые нами файлы cookie',
          name: 'Название',
          provider: 'Поставщик',
          purpose: 'Цель',
          expiry: 'Срок действия',
          category: 'Категория'
        },
        dataRetention: {
          title: '6. Хранение данных и сроки действия файлов cookie',
          content: 'Различные файлы cookie имеют разные сроки действия. Некоторые файлы cookie, называемые сеансовыми файлами cookie, удаляются при закрытии браузера. Другие, называемые постоянными файлами cookie, могут оставаться на вашем устройстве в течение фиксированного периода, который может составлять месяцы или даже годы. Мы стремимся использовать файлы cookie с разумными сроками действия:',
          necessary: 'Необходимые файлы cookie: обычно сеансовые файлы cookie или до 1 года для постоянных предпочтений аутентификации',
          functional: 'Функциональные файлы cookie: до 1 года для сохранения ваших предпочтений сайта',
          analytics: 'Аналитические файлы cookie: до 26 месяцев (Google Analytics), хотя мы анонимизируем данные через 14 месяцев',
          marketing: 'Маркетинговые файлы cookie: обычно от 90 дней до 2 лет, в зависимости от стороннего провайдера',
          dataRetention: 'Данные, собранные через файлы cookie, хранятся в соответствии с нашей Политикой конфиденциальности. Как правило, мы храним данные только до тех пор, пока это необходимо для целей, указанных в настоящей Политике использования файлов cookie и нашей Политике конфиденциальности.'
        },
        legalBasis: {
          title: '7. Правовая основа обработки',
          content: 'Мы обрабатываем данные, собранные файлами cookie, на основе различных правовых оснований в зависимости от типа файла cookie:',
          necessary: 'Необходимые файлы cookie: обрабатываются на основе законного интереса (статья 6(1)(f) GDPR и аналогичные положения в KVKK), поскольку они необходимы для предоставления наших услуг',
          other: 'Функциональные, аналитические и маркетинговые файлы cookie: обрабатываются на основе вашего согласия (статья 6(1)(a) GDPR и аналогичные положения в KVKK)'
        },
        howToManage: {
          title: '8. Как управлять вашими предпочтениями в отношении файлов cookie',
          content: 'Вы можете устанавливать и изменять ваши предпочтения в отношении файлов cookie в любое время, используя наш инструмент согласия на использование файлов cookie, который доступен через кнопку «Управление согласием на использование файлов cookie» в правом нижнем углу нашего веб-сайта. Кроме того, большинство веб-браузеров позволяют осуществлять некоторый контроль над большинством файлов cookie через настройки браузера.',
          browserInstructions: 'Вот как управлять файлами cookie в основных браузерах:',
          chrome: 'Google Chrome: нажмите на значок меню (три точки) → Настройки → Конфиденциальность и безопасность → Файлы cookie и другие данные сайтов',
          firefox: 'Firefox: нажмите кнопку меню (три линии) → Настройки → Приватность и защита → Файлы cookie и данные сайтов',
          safari: 'Safari: перейдите в Safari → Настройки → Конфиденциальность → Файлы cookie и данные веб-сайтов',
          edge: 'Microsoft Edge: нажмите значок меню (три точки) → Настройки → Файлы cookie и разрешения сайтов → Файлы cookie и данные сайтов',
          note: 'Примечание: ограничение файлов cookie может повлиять на функциональность нашего веб-сайта. Если вы удалите или заблокируете необходимые файлы cookie, вы не сможете использовать некоторые функции на сайте.'
        },
        gdprCompliance: {
          title: '9. Соответствие GDPR и KVKK',
          content: 'Мы стремимся соблюдать Общий регламент по защите данных (GDPR) и Турецкий закон о защите персональных данных (KVKK). В соответствии с этими правилами:',
          rights: 'Ваши права согласно GDPR и KVKK включают:',
          rightsList: [
            'Право быть информированным о том, как используются ваши персональные данные',
            'Право на доступ к вашим персональным данным, которые мы храним',
            'Право требовать исправления неточных персональных данных',
            'Право требовать удаления ваших персональных данных в определенных ситуациях',
            'Право ограничивать обработку ваших персональных данных',
            'Право на переносимость данных',
            'Право возражать против обработки ваших персональных данных',
            'Право отозвать согласие в любое время, когда мы полагаемся на согласие для обработки ваших персональных данных'
          ],
          exerciseRights: 'Для осуществления ваших прав или если у вас есть вопросы об использовании нами файлов cookie, пожалуйста, свяжитесь с нашим сотрудником по защите данных по указанным ниже контактным данным.'
        },
        crossBorderData: {
          title: '10. Трансграничная передача данных',
          content: 'Некоторые из наших сторонних поставщиков файлов cookie могут обрабатывать ваши данные за пределами Европейской экономической зоны (ЕЭЗ) или Турции. Когда происходят такие передачи, мы обеспечиваем наличие соответствующих гарантий, таких как использование поставщиков, сертифицированных в рамках программы ЕС-США Privacy Shield, Стандартных договорных условий или других применимых механизмов передачи данных.'
        },
        children: {
          title: '11. Конфиденциальность детей',
          content: 'Наш веб-сайт не предназначен для детей младше 16 лет. Мы сознательно не собираем персональные данные от детей младше 16 лет. Если вам меньше 16 лет, пожалуйста, не используйте файлы cookie, требующие согласия, на нашем веб-сайте.'
        },
        changes: {
          title: '12. Изменения в настоящей Политике использования файлов cookie',
          content: 'Мы можем время от времени обновлять нашу Политику использования файлов cookie. Любые изменения будут размещены на этой странице с обновленной датой редакции. Мы уведомим вас о любых существенных изменениях, разместив заметное уведомление на нашем веб-сайте.'
        },
        contactUs: {
          title: '13. Свяжитесь с нами',
          content: 'Если у вас есть какие-либо вопросы о нашей Политике использования файлов cookie, пожалуйста, свяжитесь с нами:',
          dataController: 'Информация о контролере данных:',
          company: 'Название компании:',
          address: 'Адрес:',
          representative: 'Представитель по защите данных:',
          email: 'Электронная почта для вопросов конфиденциальности:',
          phone: 'Телефон:'
        }
      }
    }
  };

   changeLanguage(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }

  resetConsent(): void {
    localStorage.removeItem('cookieConsent');
    sessionStorage.removeItem('tempCookieConsent');
    this.currentConsent = null;
    
    // Reload the page to show the consent banner again
    window.location.reload();
  }
  
  openCookieModal(): void {
    // Use the CookieModalService to open the cookie settings modal
    this.cookieModalService.openCookieModal();
  }
}