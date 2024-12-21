import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { Contact } from 'src/app/contracts/contact/contact';
import { ContactService } from 'src/app/services/common/contact.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { DownbarComponent } from '../downbar/downbar.component';
import { FooterComponent } from '../footer/footer.component';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ValidationService } from 'src/app/services/common/validation.service';
import { COMPANY_INFO } from 'src/app/config/company-info.config';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MainHeaderComponent,
    NavbarComponent,
    BreadcrumbComponent,
    DownbarComponent,
    FooterComponent
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting: boolean = false;
  companyInfo = COMPANY_INFO;

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService,
    private toastr: CustomToastrService,
    private spinner: NgxSpinnerService,
    private validationService: ValidationService
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.contactForm = this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        this.validationService.nameSurnameValidator
      ]],
      email: ['', [
        Validators.required,
        this.validationService.emailValidator
      ]],
      subject: ['', [
        Validators.required,
        Validators.minLength(5),
        this.validationService.inputSanitizer
      ]],
      message: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500),
        this.validationService.inputSanitizer
      ]]
    });
  }

  ngOnInit(): void {}

  get name() { return this.contactForm.get('name'); }
  get email() { return this.contactForm.get('email'); }
  get subject() { return this.contactForm.get('subject'); }
  get message() { return this.contactForm.get('message'); }

  async onSubmit() {
    if (this.contactForm.invalid) {
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.isSubmitting = true;
    await this.spinner.show();

    const contact: Contact = {
      name: this.name?.value,
      email: this.email?.value,
      subject: this.subject?.value,
      message: this.message?.value
    };

    try {
      await this.contactService.create(contact);
      
      this.toastr.message('Your message has been sent successfully!', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      
      this.contactForm.reset();
    } catch (error) {
      this.toastr.message('An error occurred while sending your message.', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.isSubmitting = false;
      await this.spinner.hide();
    }
  }
}