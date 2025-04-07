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
import { COMPANY_INFO } from 'src/app/config/company-info.config';
import { RouterModule } from '@angular/router';
import { PrivacyPolicyComponent } from 'src/app/dialogs/privacy/privacy-policy/privacy-policy.component';
import { CookiePolicyComponent } from '../cookie/cookie-policy/cookie-policy.component';
import { TermsOfUseComponent } from 'src/app/dialogs/privacy/terms-of-use/terms-of-use.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,RouterModule,PrivacyPolicyComponent,TermsOfUseComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  emailSubscribe: string = '';
  newsletterForm: FormGroup;
  companyInfo = COMPANY_INFO;

  constructor(
    private newsletterService: NewsletterService,
    private toastrService: CustomToastrService,
    private validationService: ValidationService,
    private formBuilder: FormBuilder,
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.newsletterForm = this.formBuilder.group({
      email: ['', [
        this.validationService.emailValidator, 
        this.validationService.inputSanitizer
      ]]
    });
  }

  ngOnInit(): void {}

  subscribeToNewsletter() {
    if (this.newsletterForm.invalid) {
      const emailErrors = this.newsletterForm.get('email')?.errors;
      
      if (emailErrors?.['invalidFormat']) {
        this.toastrService.message('Please enter a valid email address', 'ERROR', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      } else if (emailErrors?.['sqlInjection']) {
        this.toastrService.message('Invalid characters detected', 'SECURITY WARNING', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      } else {
        this.toastrService.message('Please check your email address', 'ERROR', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      }
      return;
    }

    const email = this.newsletterForm.get('email')?.value;
    this.newsletterService.subscribe(email).subscribe({
      next: () => {
        this.toastrService.message('Successfully subscribed to newsletter', 'SUCCESS', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Success,
        });
        this.newsletterForm.reset();
      },
      error: (err) => {
        this.toastrService.message(err.error?.message || 'An error occurred', 'ERROR', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      },
    });
  }
}