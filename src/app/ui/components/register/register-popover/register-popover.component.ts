import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-register-popover',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './register-popover.component.html',
  styleUrl: './register-popover.component.scss'
})
export class RegisterPopoverComponent extends BaseComponent {
  @Output() closePopover = new EventEmitter<void>();
  isVisible = false;
  isDarkTheme = false;
  frm: FormGroup;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private userAuthService: UserAuthService,
    private toastrService: CustomToastrService,
    private authService: AuthService,
    spinner: NgxSpinnerService,
    private el: ElementRef
  ) {
    super(spinner);
    this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.createForm();
  }

  createForm() {
    this.frm = this.formBuilder.group({
      nameSurname: ['', [Validators.required]],
      userName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required, this.passwordsMatchValidator.bind(this)]]
    });
  }

  passwordsMatchValidator(control: AbstractControl) {
    const password = control.root.get('password');
    return password && control.value !== password.value ? { 'notSame': true } : null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  show() {
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
    this.closePopover.emit();
  }

  get component() {
    return this.frm.controls;
  }

  async onSubmit(user: any) {
    this.submitted = true;
    if (this.frm.invalid) return;

    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      const result = await this.userService.create(user);
      if (result.isSuccess) {
        this.toastrService.message(result.message, "Success", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        
        await this.userAuthService.login(user.userName, user.password, () => {
          this.authService.identityCheck();
          this.close();
        });
      }
    } catch (error) {
      this.toastrService.message("Registration failed", "Error", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
}