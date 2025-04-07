import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Language } from 'src/app/enums/language';
import { PolicyModalComponent } from '../policy-modal/policy-modal.component';
import { COMPANY_INFO } from 'src/app/config/company-info.config';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, PolicyModalComponent, RouterModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent implements OnInit {
  isOpen: boolean = false;
  currentLang: Language = Language.EN;
  Language = Language;
  lastUpdatedDate = '2025-04-06'; // Update this when the policy changes
  
  dataController = {
    company: COMPANY_INFO.Name,
    address: COMPANY_INFO.Address,
    representative: COMPANY_INFO.representative,
    email: COMPANY_INFO.Email,
    phone: COMPANY_INFO.Phone,
    kvkkReg: COMPANY_INFO.kvkkReg,
    dpo: COMPANY_INFO.dpo
  };
  
  // Data processing purposes categorized
  processingPurposes = {
    essential: [
      'Providing the services you request',
      'Processing your orders and transactions',
      'Managing your account and preferences',
      'Ensuring the security of our website and services'
    ],
    analytical: [
      'Analyzing website usage patterns',
      'Improving our website and services',
      'Creating anonymous statistics about user behavior',
      'Testing and optimizing website performance'
    ],
    marketing: [
      'Sending promotional materials if you have consented',
      'Personalizing content and advertisements',
      'Measuring advertising effectiveness',
      'Social media integration and sharing'
    ]
  };
  
  // Data retention periods
  retentionPeriods = {
    accountData: '5 years after account closure',
    orderData: '10 years for legal and tax purposes',
    marketingData: '2 years after last interaction',
    cookieData: 'See Cookie Policy for details',
    anonymizedData: 'Indefinitely (as anonymized data is not personal data)'
  };
  
  translations = {
    [Language.EN]: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated',
      buttonText: 'Privacy Policy',
      sections: {
        introduction: {
          title: '1. Introduction',
          content: 'At TUMDEX.com ("TUMDEX", "we", "us", or "our"), owned and operated by Tum Trading, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, protect, and share your information when you use our platform.'
        },
        definitions: {
          title: '2. Definitions',
          content: 'In this Privacy Policy, the following terms shall have the following meanings:',
          terms: [
            { term: 'Personal Data', definition: 'Any information relating to an identified or identifiable natural person.' },
            { term: 'Processing', definition: 'Any operation performed on personal data, such as collection, recording, organization, structuring, storage, adaptation or alteration, retrieval, consultation, use, disclosure, dissemination, or otherwise making available.' },
            { term: 'Data Controller', definition: 'The natural or legal person, public authority, agency or other body which determines the purposes and means of the processing of personal data.' },
            { term: 'Data Processor', definition: 'A natural or legal person, public authority, agency or other body which processes personal data on behalf of the controller.' },
            { term: 'Data Subject', definition: 'An identified or identifiable natural person whose personal data is being processed.' },
            { term: 'Consent', definition: 'Any freely given, specific, informed and unambiguous indication of the data subject\'s wishes by which they signify agreement to the processing of their personal data.' }
          ]
        },
        dataController: {
          title: '3. Data Controller Information',
          content: 'Tum Trading is the data controller responsible for your personal data.',
          details: 'For questions or concerns about data protection, please contact our Data Protection Officer:'
        },
        collectInfo: {
          title: '4. Information We Collect',
          content: 'We collect the following types of information:',
          categories: {
            personal: {
              title: 'Personal Information',
              items: [
                'Identity information (name, username, etc.)',
                'Contact information (email address, phone number, address)',
                'Account information (login credentials, preferences)',
                'Transaction information (purchase history, payment details)',
                'Technical information (IP address, device information, browser type)'
              ]
            },
            usage: {
              title: 'Usage Data',
              items: [
                'Information about how you interact with our platform',
                'Pages visited and features used',
                'Time spent on pages and action sequences',
                'Search queries and filter selections',
                'Click patterns and navigation paths'
              ]
            },
            marketing: {
              title: 'Marketing and Communications Data',
              items: [
                'Preferences for receiving marketing communications',
                'Communication preferences',
                'Responses to surveys or feedback'
              ]
            }
          }
        },
        sources: {
          title: '5. Sources of Personal Data',
          content: 'We collect personal data from these sources:',
          direct: {
            title: 'Directly from you:',
            items: [
              'When you create an account',
              'When you make a purchase',
              'When you contact our customer service',
              'When you subscribe to newsletters',
              'When you respond to surveys'
            ]
          },
          automated: {
            title: 'Automated technologies:',
            items: [
              'Cookies and similar tracking technologies',
              'Server logs and usage data',
              'Analytics tools'
            ]
          },
          thirdParty: {
            title: 'Third parties:',
            items: [
              'Business partners and vendors',
              'Analytics providers',
              'Advertising networks',
              'Social media platforms (if you choose to connect your accounts)'
            ]
          }
        },
        purposes: {
          title: '6. How We Use Your Information',
          content: 'We use your information for the following purposes:',
          essential: {
            title: 'Essential Processing:',
            legalBasis: 'Based on contractual necessity or legitimate interests:'
          },
          analytical: {
            title: 'Analytical Processing:',
            legalBasis: 'Based on your consent or our legitimate interests:'
          },
          marketing: {
            title: 'Marketing Processing:',
            legalBasis: 'Based on your consent:'
          }
        },
        lawfulBasis: {
          title: '7. Legal Basis for Processing',
          content: 'Under GDPR and KVKK, we process your personal data on the following legal grounds:',
          basis: [
            { 
              name: 'Consent', 
              explanation: 'When you have given clear consent for us to process your personal data for a specific purpose (e.g., marketing communications).' 
            },
            { 
              name: 'Contractual Necessity', 
              explanation: 'When processing is necessary for the performance of a contract with you (e.g., to deliver products you have purchased).' 
            },
            { 
              name: 'Legal Obligation', 
              explanation: 'When processing is necessary for compliance with a legal obligation (e.g., tax regulations).' 
            },
            { 
              name: 'Legitimate Interests', 
              explanation: 'When processing is necessary for our legitimate interests or those of a third party, provided your fundamental rights and freedoms do not override those interests (e.g., security measures, fraud prevention).' 
            }
          ]
        },
        disclosure: {
          title: '8. Sharing Your Information',
          content: 'We may share your information with:',
          categories: [
            {
              title: 'Service Providers',
              description: 'Third-party vendors who assist us in providing our services (e.g., payment processors, hosting providers, customer support services).'
            },
            {
              title: 'Business Partners',
              description: 'Companies with whom we collaborate to offer integrated services.'
            },
            {
              title: 'Legal Requirements',
              description: 'When required by law, court order, or governmental authority.'
            },
            {
              title: 'Business Transfers',
              description: 'In connection with a merger, acquisition, or sale of all or a portion of our assets.'
            }
          ],
          thirdParties: 'We require all third parties to respect the security of your data and to treat it in accordance with the law. We do not allow our third-party service providers to use your personal data for their own purposes.'
        },
        retention: {
          title: '9. Data Retention',
          content: 'We retain your personal data only for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements.'
        },
        international: {
          title: '10. International Data Transfers',
          content: 'Your information may be transferred to and processed in countries other than your country of residence. When we transfer your information outside of the European Economic Area (EEA) or Turkey, we ensure appropriate safeguards are in place, such as:',
          safeguards: [
            'Using Standard Contractual Clauses approved by the European Commission',
            'Transfers to countries with adequacy decisions',
            'Transfers to organizations under binding corporate rules',
            'Transfers based on appropriate contractual clauses'
          ]
        },
        security: {
          title: '11. Data Security',
          content: 'We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. Our security measures include:',
          measures: [
            'Encryption of personal data',
            'Regular security assessments',
            'Access controls and authentication procedures',
            'Regular staff training on data protection',
            'Data breach detection and response protocols'
          ]
        },
        rights: {
          title: '12. Your Data Protection Rights',
          content: 'Under GDPR and KVKK, you have the following rights:',
          rightsList: [
            {
              name: 'Right to Access',
              description: 'You can request a copy of the personal data we hold about you.'
            },
            {
              name: 'Right to Rectification',
              description: 'You can ask us to correct inaccurate or incomplete data.'
            },
            {
              name: 'Right to Erasure',
              description: 'You can ask us to delete your personal data in certain circumstances.'
            },
            {
              name: 'Right to Restrict Processing',
              description: 'You can ask us to restrict the processing of your data in certain circumstances.'
            },
            {
              name: 'Right to Data Portability',
              description: 'You can ask us to transfer your data to another organization or directly to you.'
            },
            {
              name: 'Right to Object',
              description: 'You can object to the processing of your personal data in certain circumstances.'
            },
            {
              name: 'Rights Related to Automated Decision Making',
              description: 'You can request human intervention in automated decisions that significantly affect you.'
            },
            {
              name: 'Right to Withdraw Consent',
              description: 'You can withdraw your consent at any time where we rely on consent to process your personal data.'
            }
          ],
          exercising: 'To exercise these rights, please contact us using the details provided in the "Contact Us" section. We will respond to your request within 30 days.'
        },
        children: {
          title: '13. Children\'s Privacy',
          content: 'Our service is not intended for children under the age of 16, and we do not knowingly collect personal information from children under 16. If you believe we have collected information from a child under 16, please contact us immediately.'
        },
        cookies: {
          title: '14. Cookies and Similar Technologies',
          content: 'We use cookies and similar tracking technologies to collect information about your browsing activities. For more information on how we use cookies, please see our Cookie Policy.'
        },
        changes: {
          title: '15. Changes to This Privacy Policy',
          content: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes.'
        },
        complaints: {
          title: '16. Complaints',
          content: 'If you have concerns about our handling of your personal data, please contact us first. You also have the right to lodge a complaint with a supervisory authority:',
          euAuthority: 'For EU residents: The supervisory authority in your EU member state',
          turkishAuthority: 'For Turkish residents: The Turkish Data Protection Authority (KVKK)'
        },
        contactUs: {
          title: '17. Contact Us',
          content: 'If you have any questions about this Privacy Policy or our data practices, please contact us:',
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
      title: 'Gizlilik Politikası',
      lastUpdated: 'Son güncelleme',
      buttonText: 'Gizlilik Politikası',
      sections: {
        introduction: {
          title: '1. Giriş',
          content: 'TUMDEX.com ("TUMDEX", "biz", "bize" veya "bizim") olarak, Tum Trading tarafından sahip olunan ve işletilen platforma hoş geldiniz. Gizliliğinize saygı duyuyoruz ve kişisel verilerinizi korumaya kararlıyız. Bu Gizlilik Politikası, platformumuzu kullandığınızda bilgilerinizi nasıl topladığımızı, kullandığımızı, sakladığımızı, koruduğumuzu ve paylaştığımızı açıklar.'
        },
        definitions: {
          title: '2. Tanımlar',
          content: 'Bu Gizlilik Politikasında, aşağıdaki terimler aşağıdaki anlamlara sahip olacaktır:',
          terms: [
            { term: 'Kişisel Veri', definition: 'Kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi.' },
            { term: 'İşleme', definition: 'Kişisel verilerin toplama, kaydetme, düzenleme, yapılandırma, saklama, uyarlama veya değiştirme, geri alma, danışma, kullanma, açıklama, yayma veya başka şekilde erişilebilir kılma gibi üzerinde gerçekleştirilen her türlü işlem.' },
            { term: 'Veri Sorumlusu', definition: 'Kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen gerçek veya tüzel kişi, kamu otoritesi, ajans veya diğer kurum.' },
            { term: 'Veri İşleyen', definition: 'Veri sorumlusu adına kişisel verileri işleyen gerçek veya tüzel kişi, kamu otoritesi, ajans veya diğer kurum.' },
            { term: 'Veri Sahibi', definition: 'Kişisel verileri işlenen kimliği belirli veya belirlenebilir gerçek kişi.' },
            { term: 'Açık Rıza', definition: 'Belirli bir konuya ilişkin, bilgilendirilmeye dayanan ve özgür iradeyle açıklanan, kişisel verilerinin işlenmesine izin veren onaydır.' }
          ]
        },
        dataController: {
          title: '3. Veri Sorumlusu Bilgileri',
          content: 'Tum Trading, kişisel verilerinizden sorumlu veri sorumlusudur.',
          details: 'Veri koruma ile ilgili sorularınız veya endişeleriniz için lütfen Veri Koruma Görevlimiz ile iletişime geçin:'
        },
        collectInfo: {
          title: '4. Topladığımız Bilgiler',
          content: 'Aşağıdaki türde bilgileri topluyoruz:',
          categories: {
            personal: {
              title: 'Kişisel Bilgiler',
              items: [
                'Kimlik bilgileri (ad, kullanıcı adı vb.)',
                'İletişim bilgileri (e-posta adresi, telefon numarası, adres)',
                'Hesap bilgileri (giriş bilgileri, tercihler)',
                'İşlem bilgileri (satın alma geçmişi, ödeme detayları)',
                'Teknik bilgiler (IP adresi, cihaz bilgileri, tarayıcı türü)'
              ]
            },
            usage: {
              title: 'Kullanım Verileri',
              items: [
                'Platformumuzla nasıl etkileşimde bulunduğunuza dair bilgiler',
                'Ziyaret edilen sayfalar ve kullanılan özellikler',
                'Sayfalarda geçirilen süre ve eylem dizileri',
                'Arama sorguları ve filtre seçimleri',
                'Tıklama desenleri ve navigasyon yolları'
              ]
            },
            marketing: {
              title: 'Pazarlama ve İletişim Verileri',
              items: [
                'Pazarlama iletişimleri alma tercihleri',
                'İletişim tercihleri',
                'Anketlere veya geri bildirimlere verilen yanıtlar'
              ]
            }
          }
        },
        sources: {
          title: '5. Kişisel Veri Kaynakları',
          content: 'Kişisel verileri bu kaynaklardan topluyoruz:',
          direct: {
            title: 'Doğrudan sizden:',
            items: [
              'Bir hesap oluşturduğunuzda',
              'Bir satın alma yaptığınızda',
              'Müşteri hizmetlerimizle iletişime geçtiğinizde',
              'Bültenlere abone olduğunuzda',
              'Anketlere yanıt verdiğinizde'
            ]
          },
          automated: {
            title: 'Otomatik teknolojiler:',
            items: [
              'Çerezler ve benzer izleme teknolojileri',
              'Sunucu günlükleri ve kullanım verileri',
              'Analitik araçlar'
            ]
          },
          thirdParty: {
            title: 'Üçüncü taraflar:',
            items: [
              'İş ortakları ve tedarikçiler',
              'Analitik sağlayıcılar',
              'Reklam ağları',
              'Sosyal medya platformları (hesaplarınızı bağlamayı seçerseniz)'
            ]
          }
        },
        purposes: {
          title: '6. Bilgilerinizi Nasıl Kullanıyoruz',
          content: 'Bilgilerinizi aşağıdaki amaçlar için kullanıyoruz:',
          essential: {
            title: 'Temel İşleme:',
            legalBasis: 'Sözleşmesel gereklilik veya meşru menfaatlere dayanarak:'
          },
          analytical: {
            title: 'Analitik İşleme:',
            legalBasis: 'Onayınıza veya meşru menfaatlerimize dayanarak:'
          },
          marketing: {
            title: 'Pazarlama İşleme:',
            legalBasis: 'Onayınıza dayanarak:'
          }
        },
        lawfulBasis: {
          title: '7. İşleme için Yasal Dayanak',
          content: 'GDPR ve KVKK kapsamında, kişisel verilerinizi aşağıdaki yasal dayanaklara göre işliyoruz:',
          basis: [
            { 
              name: 'Açık Rıza', 
              explanation: 'Belirli bir amaç için kişisel verilerinizin işlenmesine açık rıza verdiğinizde (örn., pazarlama iletişimleri).' 
            },
            { 
              name: 'Sözleşmenin İfası', 
              explanation: 'Sizinle olan bir sözleşmenin ifası için işlemenin gerekli olduğu durumlarda (örn., satın aldığınız ürünleri teslim etmek için).' 
            },
            { 
              name: 'Yasal Yükümlülük', 
              explanation: 'Bir yasal yükümlülüğe uymak için işlemenin gerekli olduğu durumlarda (örn., vergi düzenlemeleri).' 
            },
            { 
              name: 'Meşru Menfaatler', 
              explanation: 'Temel hak ve özgürlüklerinizin bu menfaatlerin önüne geçmediği durumlarda, bizim veya bir üçüncü tarafın meşru menfaatleri için işlemenin gerekli olduğu durumlarda (örn., güvenlik önlemleri, dolandırıcılık önleme).' 
            }
          ]
        },
        disclosure: {
          title: '8. Bilgilerinizi Paylaşma',
          content: 'Bilgilerinizi şunlarla paylaşabiliriz:',
          categories: [
            {
              title: 'Hizmet Sağlayıcılar',
              description: 'Hizmetlerimizi sağlamamıza yardımcı olan üçüncü taraf satıcılar (örn., ödeme işlemcileri, barındırma sağlayıcıları, müşteri destek hizmetleri).'
            },
            {
              title: 'İş Ortakları',
              description: 'Entegre hizmetler sunmak için işbirliği yaptığımız şirketler.'
            },
            {
              title: 'Yasal Gereklilikler',
              description: 'Yasa, mahkeme kararı veya hükümet yetkilisi tarafından gerekli olduğunda.'
            },
            {
              title: 'İş Transferleri',
              description: 'Birleşme, satın alma veya varlıklarımızın tamamının veya bir kısmının satışı ile bağlantılı olarak.'
            }
          ],
          thirdParties: 'Tüm üçüncü tarafların verilerinizin güvenliğine saygı göstermesini ve bunları yasalara uygun şekilde ele almasını talep ediyoruz. Üçüncü taraf hizmet sağlayıcılarımızın kişisel verilerinizi kendi amaçları için kullanmalarına izin vermiyoruz.'
        },
        retention: {
          title: '9. Veri Saklama',
          content: 'Kişisel verilerinizi, topladığımız amaçları yerine getirmek için gerekli olduğu sürece, herhangi bir yasal, muhasebe veya raporlama gereksinimini karşılamak da dahil olmak üzere yalnızca gerekli süre boyunca saklarız.'
        },
        international: {
          title: '10. Uluslararası Veri Transferleri',
          content: 'Bilgileriniz, ikamet ettiğiniz ülke dışındaki ülkelere aktarılabilir ve buralarda işlenebilir. Bilgilerinizi Avrupa Ekonomik Alanı (AEA) veya Türkiye dışına aktardığımızda, şu gibi uygun güvenlik önlemlerinin alındığından emin oluruz:',
          safeguards: [
            'Avrupa Komisyonu tarafından onaylanan Standart Sözleşme Maddelerini kullanma',
            'Yeterlilik kararı olan ülkelere transferler',
            'Bağlayıcı kurumsal kurallar altındaki kuruluşlara transferler',
            'Uygun sözleşme maddelerine dayalı transferler'
          ]
        },
        security: {
          title: '11. Veri Güvenliği',
          content: 'Kişisel bilgilerinizi yetkisiz erişime, ifşaya, değiştirilmeye veya imha edilmeye karşı korumak için uygun teknik ve organizasyonel önlemler uyguluyoruz. Güvenlik önlemlerimiz şunları içerir:',
          measures: [
            'Kişisel verilerin şifrelenmesi',
            'Düzenli güvenlik değerlendirmeleri',
            'Erişim kontrolleri ve kimlik doğrulama prosedürleri',
            'Personelin düzenli veri koruma eğitimi',
            'Veri ihlali tespit ve müdahale protokolleri'
          ]
        },
        rights: {
          title: '12. Veri Koruma Haklarınız',
          content: 'GDPR ve KVKK kapsamında aşağıdaki haklara sahipsiniz:',
          rightsList: [
            {
              name: 'Erişim Hakkı',
              description: 'Hakkınızda tuttuğumuz kişisel verilerin bir kopyasını talep edebilirsiniz.'
            },
            {
              name: 'Düzeltme Hakkı',
              description: 'Yanlış veya eksik verilerin düzeltilmesini talep edebilirsiniz.'
            },
            {
              name: 'Silme Hakkı',
              description: 'Belirli durumlarda kişisel verilerinizin silinmesini talep edebilirsiniz.'
            },
            {
              name: 'İşlemeyi Kısıtlama Hakkı',
              description: 'Belirli durumlarda verilerinizin işlenmesinin kısıtlanmasını talep edebilirsiniz.'
            },
            {
              name: 'Veri Taşınabilirliği Hakkı',
              description: 'Verilerinizin başka bir kuruluşa veya doğrudan size aktarılmasını talep edebilirsiniz.'
            },
            {
              name: 'İtiraz Hakkı',
              description: 'Belirli durumlarda kişisel verilerinizin işlenmesine itiraz edebilirsiniz.'
            },
            {
              name: 'Otomatik Karar Vermeyle İlgili Haklar',
              description: 'Sizi önemli ölçüde etkileyen otomatik kararlarda insan müdahalesi talep edebilirsiniz.'
            },
            {
              name: 'Onayı Geri Çekme Hakkı',
              description: 'Kişisel verilerinizi işlemek için onayınıza güvendiğimiz durumlarda, onayınızı istediğiniz zaman geri çekebilirsiniz.'
            }
          ],
          exercising: 'Bu hakları kullanmak için lütfen "Bize Ulaşın" bölümünde belirtilen ayrıntıları kullanarak bizimle iletişime geçin. Talebinize 30 gün içinde yanıt vereceğiz.'
        },
        children: {
          title: '13. Çocukların Gizliliği',
          content: 'Hizmetimiz 16 yaşın altındaki çocuklar için tasarlanmamıştır ve 16 yaşın altındaki çocuklardan bilerek kişisel bilgi toplamıyoruz. 16 yaşın altındaki bir çocuktan bilgi topladığımıza inanıyorsanız, lütfen hemen bizimle iletişime geçin.'
        },
        cookies: {
          title: '14. Çerezler ve Benzer Teknolojiler',
          content: 'Göz atma etkinlikleriniz hakkında bilgi toplamak için çerezleri ve benzer izleme teknolojilerini kullanıyoruz. Çerezleri nasıl kullandığımız hakkında daha fazla bilgi için lütfen Çerez Politikamıza bakın.'
        },
        changes: {
          title: '15. Bu Gizlilik Politikasındaki Değişiklikler',
          content: 'Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikleri, yeni Gizlilik Politikasını bu sayfada yayınlayarak ve "Son Güncelleme" tarihini güncelleyerek size bildireceğiz. Herhangi bir değişiklik için bu Gizlilik Politikasını periyodik olarak gözden geçirmenizi öneririz.'
        },
        complaints: {
          title: '16. Şikayetler',
          content: 'Kişisel verilerinizin ele alınmasıyla ilgili endişeleriniz varsa, lütfen önce bizimle iletişime geçin. Ayrıca bir denetim makamına şikayette bulunma hakkına sahipsiniz:',
          euAuthority: 'AB sakinleri için: AB üye ülkenizdeki denetim makamı',
          turkishAuthority: 'Türkiye sakinleri için: Türkiye Kişisel Verileri Koruma Kurumu (KVKK)'
        },
        contactUs: {
          title: '17. Bize Ulaşın',
          content: 'Bu Gizlilik Politikası veya veri uygulamalarımız hakkında sorularınız varsa, lütfen bizimle iletişime geçin:',
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
      title: 'Политика конфиденциальности',
      lastUpdated: 'Последнее обновление',
      buttonText: 'Политика конфиденциальности',
      sections: {
        introduction: {
          title: '1. Введение',
          content: 'В TUMDEX.com ("TUMDEX", "мы", "нас" или "наш"), принадлежащем и управляемом компанией Tum Trading, мы уважаем вашу конфиденциальность и стремимся защищать ваши персональные данные. Эта Политика конфиденциальности объясняет, как мы собираем, используем, храним, защищаем и передаем вашу информацию, когда вы используете нашу платформу.'
        },
        definitions: {
          title: '2. Определения',
          content: 'В настоящей Политике конфиденциальности следующие термины имеют следующие значения:',
          terms: [
            { term: 'Персональные данные', definition: 'Любая информация, относящаяся к идентифицированному или идентифицируемому физическому лицу.' },
            { term: 'Обработка', definition: 'Любая операция, выполняемая с персональными данными, такая как сбор, запись, организация, структурирование, хранение, адаптация или изменение, извлечение, консультирование, использование, раскрытие, распространение или иное предоставление доступа.' },
            { term: 'Контроллер данных', definition: 'Физическое или юридическое лицо, государственный орган, агентство или другой орган, который определяет цели и средства обработки персональных данных.' },
            { term: 'Обработчик данных', definition: 'Физическое или юридическое лицо, государственный орган, агентство или другой орган, который обрабатывает персональные данные от имени контроллера.' },
            { term: 'Субъект данных', definition: 'Идентифицированное или идентифицируемое физическое лицо, чьи персональные данные обрабатываются.' },
            { term: 'Согласие', definition: 'Любое свободно данное, конкретное, информированное и недвусмысленное указание на желания субъекта данных, которым он или она сигнализирует о согласии на обработку своих персональных данных.' }
          ]
        },
        dataController: {
          title: '3. Информация о контроллере данных',
          content: 'Tum Trading является контроллером данных, ответственным за ваши персональные данные.',
          details: 'По вопросам или проблемам, связанным с защитой данных, пожалуйста, свяжитесь с нашим сотрудником по защите данных:'
        },
        collectInfo: {
          title: '4. Информация, которую мы собираем',
          content: 'Мы собираем следующие типы информации:',
          categories: {
            personal: {
              title: 'Личная информация',
              items: [
                'Идентификационная информация (имя, имя пользователя и т.д.)',
                'Контактная информация (адрес электронной почты, номер телефона, адрес)',
                'Информация учетной записи (учетные данные для входа, предпочтения)',
                'Информация о транзакциях (история покупок, платежные данные)',
                'Техническая информация (IP-адрес, информация об устройстве, тип браузера)'
              ]
            },
            usage: {
              title: 'Данные об использовании',
              items: [
                'Информация о том, как вы взаимодействуете с нашей платформой',
                'Посещенные страницы и используемые функции',
                'Время, проведенное на страницах, и последовательности действий',
                'Поисковые запросы и выбор фильтров',
                'Шаблоны кликов и пути навигации'
              ]
            },
            marketing: {
              title: 'Маркетинговые и коммуникационные данные',
              items: [
                'Предпочтения по получению маркетинговых сообщений',
                'Предпочтения по коммуникации',
                'Ответы на опросы или отзывы'
              ]
            }
          }
        },
        sources: {
          title: '5. Источники персональных данных',
          content: 'Мы собираем персональные данные из следующих источников:',
          direct: {
            title: 'Непосредственно от вас:',
            items: [
              'Когда вы создаете учетную запись',
              'Когда вы совершаете покупку',
              'Когда вы обращаетесь в нашу службу поддержки',
              'Когда вы подписываетесь на новостные рассылки',
              'Когда вы отвечаете на опросы'
            ]
          },
          automated: {
            title: 'Автоматизированные технологии:',
            items: [
              'Файлы cookie и аналогичные технологии отслеживания',
              'Серверные логи и данные об использовании',
              'Аналитические инструменты'
            ]
          },
          thirdParty: {
            title: 'Третьи стороны:',
            items: [
              'Бизнес-партнеры и поставщики',
              'Поставщики аналитики',
              'Рекламные сети',
              'Платформы социальных сетей (если вы решите подключить свои учетные записи)'
            ]
          }
        },
        purposes: {
          title: '6. Как мы используем вашу информацию',
          content: 'Мы используем вашу информацию для следующих целей:',
          essential: {
            title: 'Основная обработка:',
            legalBasis: 'На основе договорной необходимости или законных интересов:'
          },
          analytical: {
            title: 'Аналитическая обработка:',
            legalBasis: 'На основе вашего согласия или наших законных интересов:'
          },
          marketing: {
            title: 'Маркетинговая обработка:',
            legalBasis: 'На основе вашего согласия:'
          }
        },
        lawfulBasis: {
          title: '7. Правовая основа обработки',
          content: 'В соответствии с GDPR и KVKK, мы обрабатываем ваши персональные данные на следующих правовых основаниях:',
          basis: [
            { 
              name: 'Согласие', 
              explanation: 'Когда вы дали четкое согласие на обработку ваших персональных данных для конкретной цели (например, маркетинговые коммуникации).' 
            },
            { 
              name: 'Договорная необходимость', 
              explanation: 'Когда обработка необходима для исполнения договора с вами (например, для доставки продуктов, которые вы приобрели).' 
            },
            { 
              name: 'Юридическое обязательство', 
              explanation: 'Когда обработка необходима для соблюдения юридического обязательства (например, налоговых правил).' 
            },
            { 
              name: 'Законные интересы', 
              explanation: 'Когда обработка необходима для наших законных интересов или интересов третьей стороны, при условии, что ваши основные права и свободы не преобладают над этими интересами (например, меры безопасности, предотвращение мошенничества).' 
            }
          ]
        },
        disclosure: {
          title: '8. Передача вашей информации',
          content: 'Мы можем передавать вашу информацию:',
          categories: [
            {
              title: 'Поставщикам услуг',
              description: 'Сторонним поставщикам, которые помогают нам предоставлять наши услуги (например, обработчики платежей, поставщики хостинга, службы поддержки клиентов).'
            },
            {
              title: 'Бизнес-партнерам',
              description: 'Компаниям, с которыми мы сотрудничаем для предоставления интегрированных услуг.'
            },
            {
              title: 'Юридические требования',
              description: 'Когда это требуется по закону, постановлению суда или государственному органу.'
            },
            {
              title: 'Передача бизнеса',
              description: 'В связи со слиянием, приобретением или продажей всех или части наших активов.'
            }
          ],
          thirdParties: 'Мы требуем от всех третьих сторон уважать безопасность ваших данных и обращаться с ними в соответствии с законом. Мы не разрешаем нашим сторонним поставщикам услуг использовать ваши персональные данные для своих собственных целей.'
        },
        retention: {
          title: '9. Хранение данных',
          content: 'Мы храним ваши персональные данные только в течение времени, необходимого для выполнения целей, для которых мы их собрали, включая цели удовлетворения любых юридических, бухгалтерских или отчетных требований.'
        },
        international: {
          title: '10. Международная передача данных',
          content: 'Ваша информация может быть передана и обработана в странах, отличных от страны вашего проживания. При передаче вашей информации за пределы Европейской экономической зоны (ЕЭЗ) или Турции, мы обеспечиваем наличие соответствующих гарантий, таких как:',
          safeguards: [
            'Использование Стандартных договорных положений, утвержденных Европейской комиссией',
            'Передача в страны с решениями о достаточности защиты',
            'Передача организациям в рамках обязательных корпоративных правил',
            'Передача на основе соответствующих договорных положений'
          ]
        },
        security: {
          title: '11. Безопасность данных',
          content: 'Мы внедряем соответствующие технические и организационные меры для защиты вашей личной информации от несанкционированного доступа, раскрытия, изменения или уничтожения. Наши меры безопасности включают:',
          measures: [
            'Шифрование персональных данных',
            'Регулярные оценки безопасности',
            'Контроль доступа и процедуры аутентификации',
            'Регулярное обучение персонала по защите данных',
            'Протоколы обнаружения и реагирования на нарушения данных'
          ]
        },
        rights: {
          title: '12. Ваши права на защиту данных',
          content: 'В соответствии с GDPR и KVKK, у вас есть следующие права:',
          rightsList: [
            {
              name: 'Право на доступ',
              description: 'Вы можете запросить копию ваших персональных данных, которые мы храним.'
            },
            {
              name: 'Право на исправление',
              description: 'Вы можете попросить нас исправить неточные или неполные данные.'
            },
            {
              name: 'Право на удаление',
              description: 'Вы можете попросить нас удалить ваши персональные данные при определенных обстоятельствах.'
            },
            {
              name: 'Право на ограничение обработки',
              description: 'Вы можете попросить нас ограничить обработку ваших данных при определенных обстоятельствах.'
            },
            {
              name: 'Право на переносимость данных',
              description: 'Вы можете попросить нас передать ваши данные другой организации или непосредственно вам.'
            },
            {
              name: 'Право на возражение',
              description: 'Вы можете возражать против обработки ваших персональных данных при определенных обстоятельствах.'
            },
            {
              name: 'Права, связанные с автоматизированным принятием решений',
              description: 'Вы можете запросить человеческое вмешательство в автоматизированные решения, которые существенно влияют на вас.'
            },
            {
              name: 'Право на отзыв согласия',
              description: 'Вы можете отозвать свое согласие в любое время, если мы полагаемся на согласие для обработки ваших персональных данных.'
            }
          ],
          exercising: 'Для осуществления этих прав, пожалуйста, свяжитесь с нами, используя данные, указанные в разделе "Свяжитесь с нами". Мы ответим на ваш запрос в течение 30 дней.'
        },
        children: {
          title: '13. Конфиденциальность детей',
          content: 'Наш сервис не предназначен для детей младше 16 лет, и мы сознательно не собираем личную информацию от детей младше 16 лет. Если вы считаете, что мы собрали информацию от ребенка младше 16 лет, пожалуйста, немедленно свяжитесь с нами.'
        },
        cookies: {
          title: '14. Файлы cookie и аналогичные технологии',
          content: 'Мы используем файлы cookie и аналогичные технологии отслеживания для сбора информации о вашей активности в браузере. Для получения дополнительной информации о том, как мы используем файлы cookie, пожалуйста, ознакомьтесь с нашей Политикой использования файлов cookie.'
        },
        changes: {
          title: '15. Изменения в настоящей Политике конфиденциальности',
          content: 'Мы можем время от времени обновлять эту Политику конфиденциальности. Мы уведомим вас о любых существенных изменениях, разместив новую Политику конфиденциальности на этой странице и обновив дату "Последнее обновление". Мы рекомендуем вам периодически просматривать эту Политику конфиденциальности на предмет изменений.'
        },
        complaints: {
          title: '16. Жалобы',
          content: 'Если у вас есть опасения по поводу обработки ваших персональных данных, пожалуйста, сначала свяжитесь с нами. У вас также есть право подать жалобу в надзорный орган:',
          euAuthority: 'Для жителей ЕС: Надзорный орган в вашей стране-члене ЕС',
          turkishAuthority: 'Для жителей Турции: Турецкое управление по защите данных (KVKK)'
        },
        contactUs: {
          title: '17. Свяжитесь с нами',
          content: 'Если у вас есть какие-либо вопросы об этой Политике конфиденциальности или наших методах работы с данными, пожалуйста, свяжитесь с нами:',
          dataController: 'Информация о контроллере данных:',
          company: 'Название компании:',
          address: 'Адрес:',
          representative: 'Представитель по защите данных:',
          email: 'Электронная почта для вопросов конфиденциальности:',
          phone: 'Телефон:'
        }
      }
    }
  };

  openModal(): void {
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  ngOnInit(): void {
    // Get saved language preference or use default (English)
    const savedLang = localStorage.getItem('preferredLanguage');
    this.currentLang = (savedLang as Language) || Language.EN;
  }

  changeLanguage(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }
}