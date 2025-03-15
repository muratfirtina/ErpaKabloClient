import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserAuthService } from 'src/app/services/common/models/user-auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-activation-code',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule],
  templateUrl: './activation-code.component.html',
  styleUrl: './activation-code.component.scss'
})
export class ActivationCodeComponent implements OnInit, AfterViewInit {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef>;
  
  codeForm: FormGroup;
  userId: string;
  email: string;
  isSubmitting = false;
  isResending = false;
  activationSuccess = false;
  companyLogoUrl = 'assets/icons/TUMdex.png';
  isProcessingToken = false;
  showResendOption = false;
  resendEmail: string = '';
  
  // Track remaining attempts
  remainingAttempts = 3;
  attemptsExceeded = false;
  
  // For digit input UI - Her rakam için ayrı FormControl
  digitControls: FormControl[] = Array(6).fill(null).map(() => 
    new FormControl('', [Validators.required, Validators.pattern('[0-9]')])
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userAuthService: UserAuthService,
    private toastr: CustomToastrService,
  ) {
    // Ana form oluştur
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
    });
    
    // Her rakam için formControls ekle
    this.digitControls.forEach((control, i) => {
      this.codeForm.addControl(`digit${i}`, control);
    });
  }

  ngOnInit(): void {
    // Get URL parameters
    const token = this.route.snapshot.queryParams['token'];
    const userId = this.route.snapshot.queryParams['userId'];
    const email = this.route.snapshot.queryParams['email'];
  
    // Handle different parameter scenarios
    if (token) {
      // If token exists, verify and get user information
      this.processToken(token);
    } else if (userId && email) {
      // If userId and email are directly available, use them
      this.setActivationParams(userId, email);
    } else {
      // If no parameters, try to load from session
      this.loadFromSession();
    }
  }
  
  ngAfterViewInit(): void {
    // Auto-focus the first input after view is initialized
    setTimeout(() => {
      if (this.digitInputs && this.digitInputs.first) {
        this.digitInputs.first.nativeElement.focus();
      }
    }, 100);
    
    // Global klavye kopyalama olayını dinle
    document.addEventListener('keydown', (event) => {
      // Ctrl+V veya Cmd+V (Mac için) tuş kombinasyonu algılandı
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        // Odaklanan elementin bulunduğu formu kontrol et
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.classList.contains('digit-input')) {
          // Panodaki veriyi al
          navigator.clipboard.readText()
            .then(clipText => {
              // Yapıştırma işlevini çağır ve olay nesnesini taklit et
              const fakeEvent = {
                preventDefault: () => {},
                clipboardData: {
                  getData: () => clipText
                }
              } as unknown as ClipboardEvent;
              
              this.onPaste(fakeEvent);
            })
            .catch(err => {
              console.error('Pano erişim hatası:', err);
            });
        }
      }
    });
  }

  // Bir rakam girildiğinde sonraki inputa geç
  onKeyUp(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    
    // Rakam girildiyse ve son input değilse, sonraki inputa geç
    if (input.value.match(/^[0-9]$/) && index < 5) {
      this.digitInputs.toArray()[index + 1].nativeElement.focus();
    }
    
    // Form değerini güncelle
    this.updateFormCode();
  }
  
  // Backspace veya yön tuşlarıyla gezinme
  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace') {
      if (input.value === '' && index > 0) {
        // Şu anki input boş ve backspace basıldıysa bir önceki inputa git
        event.preventDefault();
        this.digitControls[index - 1].setValue('');
        this.digitInputs.toArray()[index - 1].nativeElement.focus();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      // Sol ok tuşu
      event.preventDefault();
      this.digitInputs.toArray()[index - 1].nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      // Sağ ok tuşu
      event.preventDefault();
      this.digitInputs.toArray()[index + 1].nativeElement.focus();
    } else if (!/^\d$/.test(event.key) && 
              !['Tab', 'ArrowUp', 'ArrowDown', 'Delete', 'Backspace', 'Home', 'End'].includes(event.key)) {
      // Sadece rakam veya navigasyon tuşlarına izin ver
      event.preventDefault();
    }
  }
  
  // Yapıştırma işlemi
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    
    if (!event.clipboardData) return;
    
    const pastedText = event.clipboardData.getData('text');
    // Yapıştırılan metinden sadece rakamları al
    const numbers = pastedText.replace(/\D/g, '').substring(0, 6).split('');
    
    // Rakamları inputlara dağıt
    numbers.forEach((num, index) => {
      if (index < 6) {
        this.digitControls[index].setValue(num);
      }
    });
    
    // Son rakamdan sonraki ilk boş inputa odaklan veya tüm kutular doluysa son inputa
    if (numbers.length < 6) {
      this.digitInputs.toArray()[numbers.length].nativeElement.focus();
    } else {
      this.digitInputs.toArray()[5].nativeElement.focus();
    }
    
    // Ana form kontrolünü güncelle
    this.updateFormCode();
  }
  
  // Digit kontrollerinden alınan değerleri ana form kontrolüne aktar
  private updateFormCode(): void {
    const code = this.digitControls.map(ctrl => ctrl.value || '').join('');
    this.codeForm.get('code')?.setValue(code);
    
    if (code.length > 0) {
      this.codeForm.get('code')?.markAsTouched();
    }
  }
  
  // Tüm form ve inputları sıfırla
  private resetForm(): void {
    // Ana form ve digit kontrollerini sıfırla
    this.codeForm.reset();
    this.digitControls.forEach(ctrl => ctrl.reset());
    
    // Input alanlarını temizle
    setTimeout(() => {
      if (this.digitInputs) {
        const inputs = this.digitInputs.toArray();
        inputs.forEach(input => {
          input.nativeElement.value = '';
        });
        
        // İlk inputa odaklan
        if (inputs.length > 0) {
          inputs[0].nativeElement.focus();
        }
      }
    }, 0);
  }

  // Token processing method
  private async processToken(token: string): Promise<void> {
    try {
      this.isProcessingToken = true;
      
      // Token verification request
      const result = await this.userAuthService.verifyActivationToken(token);
      
      if (result.success && result.userId && result.email) {
        // Token successfully verified, set user information
        this.setActivationParams(result.userId, result.email);
      }
      else if (result.success === false && 'alreadyActivated' in result) {
        // This activation link has already been used
        this.toastr.message(
          'This account has already been activated. You are being redirected to the login page.',
          'Information',
          {
            toastrMessageType: ToastrMessageType.Info,
            position: ToastrPosition.TopRight
          }
        );
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
        return;
      }
      else {
        // Token couldn't be verified, but check if userId and email parameters exist in URL
        const userId = this.route.snapshot.queryParams['userId'];
        const email = this.route.snapshot.queryParams['email'];
        
        if (userId && email) {
          // Use backup parameters
          this.setActivationParams(userId, email);
          this.toastr.message(
            'Token verification failed, but backup parameters are being used.',
            'Information',
            {
              toastrMessageType: ToastrMessageType.Info,
              position: ToastrPosition.TopRight
            }
          );
        } else {
          // No valid parameters found
          this.toastr.message(
            result.message || 'Activation link is invalid. You can request a new code by entering your email address.',
            'Verification Error',
            {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.TopRight
            }
          );
          // Offer option to request new code
          this.showResendOption = true;
        }
      }
    } catch (error) {
      console.error('Token processing error:', error);
      
      // Check backup parameters in URL again
      const userId = this.route.snapshot.queryParams['userId'];
      const email = this.route.snapshot.queryParams['email'];
      
      if (userId && email) {
        // Use backup parameters
        this.setActivationParams(userId, email);
        this.toastr.message(
          'An error occurred while processing the token, but backup parameters are being used.',
          'Information',
          {
            toastrMessageType: ToastrMessageType.Info,
            position: ToastrPosition.TopRight
          }
        );
      } else {
        this.toastr.message(
          'An error occurred while processing your activation link. Please request a new code.',
          'Error',
          {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
        this.showResendOption = true;
      }
    } finally {
      this.isProcessingToken = false;
    }
  }
  
  // Helper method to set activation parameters
  private setActivationParams(userId: string, email: string): void {
    // Save parameters to component
    this.userId = userId;
    this.email = email;
    
    // Also save to session (for use if page is refreshed)
    sessionStorage.setItem('activationUserId', userId);
    sessionStorage.setItem('activationEmail', email);  
  }
  
  // Helper method to load information from session
  private loadFromSession(): void {
    const storedUserId = sessionStorage.getItem('activationUserId');
    const storedEmail = sessionStorage.getItem('activationEmail');
    
    if (storedUserId && storedEmail) {
      this.userId = storedUserId;
      this.email = storedEmail;
    } else {
      this.redirectToLogin();
    }
  }

  redirectToLogin(): void {
    this.toastr.message(
      'Activation information could not be verified. Please use the link in your email or request a new code.',
      'Error',
      {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      }
    );
    
    // Redirect to login page
    this.router.navigate(['/login']);
  }

  // Submit the activation code
  async onSubmit(): Promise<void> {
    if (this.codeForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const code = this.codeForm.get('code')?.value;

    try {
      const response = await this.userAuthService.verifyActivationCode(this.userId, code);
      
      this.isSubmitting = false;
      if (!this.userId) {
        this.toastr.message(
          'User ID not found. Please revisit the activation page.',
          'Error',
          {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
        return;
      }
      
      if (response && response.verified === true) {
        this.activationSuccess = true;
        
        // Clear session information
        sessionStorage.removeItem('activationToken');
        sessionStorage.removeItem('activationUserId');
        sessionStorage.removeItem('activationEmail');
        
        this.toastr.message(
          'Your email address has been successfully verified.',
          'Success',
          {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          }
        );
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } else {
        // Reset form
        this.resetForm();
        
        // Determine remaining attempts
        if (response && response.remainingAttempts !== undefined) {
          this.remainingAttempts = response.remainingAttempts;
        }
        
        // If attempts exceeded
        if (response.remainingAttempts <= 0 || (response && response.exceeded === true)) {
          this.attemptsExceeded = true;
          this.toastr.message(
            'Too many failed attempts. Please request a new activation code.',
            'Warning',
            {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.TopRight
            }
          );
        } else {
          // Use message directly from API
          const errorMessage = response?.message || `Invalid activation code. You have ${response.remainingAttempts} attempts remaining.`;
          
          this.toastr.message(
            errorMessage,
            'Error',
            {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight
            }
          );
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      this.isSubmitting = false;
      
      // Reset form
      this.resetForm();
      
      // Rate limit error or code invalidated
      if (error && error.status === 429) {
        this.attemptsExceeded = true;
        
        // Check if a new code is required
        if (error.error && error.error.requiresNewCode === true) {
          this.toastr.message(
            'Your activation code has been invalidated. You are being redirected to request a new activation code.',
            'Information',
            {
              toastrMessageType: ToastrMessageType.Info,
              position: ToastrPosition.TopRight
            }
          );
          
          // Clear session information
          sessionStorage.removeItem('activationToken');
          sessionStorage.removeItem('activationUserId');
          sessionStorage.removeItem('activationEmail');
          
          // Preserve email address
          const email = this.email;
          
          // Start new code request process after a short delay
          setTimeout(async () => {
            try {
              if (email) {
                // API call to send new code
                const result = await this.userAuthService.resendActivationCode(email);
                
                if (result && result.success) {
                  this.toastr.message(
                    'A new activation code has been sent to your email address.',
                    'Success',
                    {
                      toastrMessageType: ToastrMessageType.Success,
                      position: ToastrPosition.TopRight
                    }
                  );

                  // Define new attempt rights
                  this.attemptsExceeded = false;
                  this.remainingAttempts = result.remainingAttempts || 5;
                } else {
                  // Redirect user to login page
                  this.router.navigate(['/login']);
                }
              } else {
                // If no email information, redirect to login page
                this.router.navigate(['/login']);
              }
            } catch (err) {
              console.error('Error sending new code:', err);
              this.router.navigate(['/login']);
            }
          }, 2000);
        } else {
          // Normal rate limit error
          this.toastr.message(
            error.error?.message || 'Too many failed attempts. Please request a new activation code.',
            'Warning',
            {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.TopRight
            }
          );
        }
      } else {
        this.toastr.message(
          'An error occurred during verification. Please try again.',
          'Error',
          {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
      }
    }
  }

  // Resend activation code
  async resendCode(): Promise<void> {
    if (this.isResending || !this.email) return;
  
    this.isResending = true;
    try {
      const result = await this.userAuthService.resendActivationCode(this.email);
      
      this.isResending = false;
      
      // Backend başarılı yanıt verdi mi kontrol et
      if (result && result.success === true) {
        // New code request successful, reset parameters
        this.attemptsExceeded = false;
        this.remainingAttempts = result.remainingAttempts || 5; 
        
        // Reset form
        this.resetForm();
        
        // Backend tarafından gelen mesajı kullan, yoksa varsayılan mesaj göster
        this.toastr.message(
          result.message || 'A new activation code has been sent to your email address.',
          'Success',
          {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          }
        );
      } else {
        // Backend tarafından başarısız yanıt geldiğinde
        this.toastr.message(
          result?.message || 'An error occurred while sending the activation code.',
          'Error',
          {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
      }
    } catch (error) {
      this.isResending = false;
      
      // Rate limit check
      if (error.status === 429) {
        this.toastr.message(
          error.error?.message || 'Too many code requests. Please try again later.',
          'Warning',
          {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopRight
          }
        );
      } else {
        this.toastr.message(
          error.error?.message || 'An error occurred while sending the activation code.',
          'Error',
          {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
      }
    }
  }
  
  // Resend code for a specific email
  async resendCodeForEmail(): Promise<void> {
    if (!this.resendEmail || this.isResending) return;
    
    this.isResending = true;
    try {
      const result = await this.userAuthService.resendActivationCode(this.resendEmail);
      
      if (result.success) {
        this.toastr.message(
          'A new activation code has been sent to your email address.',
          'Success',
          {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          }
        );
        
        // If the email address matches a user with an activation code
        // update the email variable (we can't get userId in this case)
        this.email = this.resendEmail;
        sessionStorage.setItem('activationEmail', this.resendEmail);
        
        // Reset form
        this.resetForm();
        this.showResendOption = false;
      } else {
        this.toastr.message(
          result.message || 'Failed to send activation code.',
          'Error',
          {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
      }
    } catch (error) {
      this.toastr.message(
        'An error occurred while sending the activation code.',
        'Error',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    } finally {
      this.isResending = false;
    }
  }
}