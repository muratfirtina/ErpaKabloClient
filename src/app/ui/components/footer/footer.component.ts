import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewsletterService } from 'src/app/services/common/models/newsletter.service';
import { ValidationService } from 'src/app/services/common/validation.service';
import {
  CustomToastrService,
  ToastrMessageType,
  ToastrPosition,
} from 'src/app/services/ui/custom-toastr.service';

interface CompanyInfo {
  Logo: string;
  Name: string;
  Address: string;
  Phone: string;
  Email: string;
  SocialMedia: {
    Facebook: string;
    Twitter: string;
    LinkedIn: string;
    Whatsapp: string;
  };
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule,FormsModule, ReactiveFormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  emailSubscribe: string = '';
  newsletterForm: FormGroup;

  companyInfo: CompanyInfo = {
    Logo: 'assets/images/logo.png',
    Name: 'TUMdex',
    Address: 'Örnek Mahallesi, Örnek Sokak No:1, İstanbul',
    Phone: '+90 212 XXX XX XX',
    Email: 'global@tumtrading.com',
    SocialMedia: {
      Facebook: 'https://facebook.com/tumtrading',
      Twitter: 'https://twitter.com/tumtrading',
      LinkedIn: 'https://linkedin.com/company/tumtrading',
      Whatsapp: '', // Whatsapp linkinizi buraya ekleyin
    },
  };

  constructor(
    private newsletterService: NewsletterService,
    private toastrService: CustomToastrService,
    private validationService: ValidationService,
    private formBuilder: FormBuilder,
  ) {
    this.newsletterForm = this.formBuilder.group({
      email: ['', [this.validationService.emailValidator, this.validationService.inputSanitizer]]
    });
  }

  ngOnInit(): void {}

  subscribeToNewsletter() {
    if (this.newsletterForm.invalid) {
      const emailErrors = this.newsletterForm.get('email')?.errors;
      
      if (emailErrors?.['invalidFormat']) {
        this.toastrService.message('Lütfen geçerli bir email adresi giriniz', 'HATA', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      } else if (emailErrors?.['sqlInjection']) {
        this.toastrService.message('Geçersiz karakterler tespit edildi', 'GÜVENLİK UYARISI', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      } else {
        this.toastrService.message('Lütfen email adresinizi kontrol ediniz', 'HATA', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      }
      return;
    }

    const email = this.newsletterForm.get('email')?.value;
    this.newsletterService.subscribe(email).subscribe({
      next: () => {
        this.toastrService.message('Bülten aboneliğiniz başarıyla oluşturuldu', 'BAŞARILI', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Success,
        });
        this.newsletterForm.reset();
      },
      error: (err) => {
        this.toastrService.message(err.error?.message || 'Bir hata oluştu', 'HATA', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      },
    });
  }
}
