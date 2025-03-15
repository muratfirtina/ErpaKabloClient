import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base/base.component';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerInterceptorService implements HttpInterceptor {

  constructor(
    private toastrService: CustomToastrService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private tokenService: TokenService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError(error => {
      switch (error.status) {
        case HttpStatusCode.Unauthorized:
          // Attempt token refresh using TokenService
          this.tokenService.refreshToken().then(success => {
            if (!success) {
              const url = this.router.url;
              if (url == "/products") {
                this.toastrService.message("Please log in to add products to the cart.", "Login Required", {
                  toastrMessageType: ToastrMessageType.Warning,
                  position: ToastrPosition.TopRight
                });
              } else {
                this.toastrService.message("You are not authorized to perform this action.", "Unauthorized Action!", {
                  toastrMessageType: ToastrMessageType.Warning,
                  position: ToastrPosition.BottomFullWidth
                });
              }

              // Redirect to login page if session has expired
              this.router.navigate(['/login'], {
                queryParams: { returnUrl: this.router.url }
              });
            }
          });
          break;
        case HttpStatusCode.InternalServerError:
          this.toastrService.message("The server is unreachable.", "Server Error", {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.BottomFullWidth
          });
          break;
        case HttpStatusCode.BadRequest:
          this.toastrService.message("Invalid request.", "Invalid Operation!", {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.BottomFullWidth
          });
          break;
        case HttpStatusCode.NotFound:
          this.toastrService.message("Page not found.", "Page Not Found!", {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.TopCenter
          });
          break;
        default:
          /* this.toastrService.message("An unexpected error occurred.", "Error!", {
            toastrMessageType: ToastrMessageType.Warning,
            position: ToastrPosition.BottomFullWidth
          }); */
          break;
      }
      this.spinner.hide(SpinnerType.BallSpinClockwise);
      return of(error);
    }));
  }

    // Error handling helper method (İngilizce'ye çevrilmiş hali)
    handleError(error: any, customMessage?: string): void {
        let errorMessage = customMessage || 'An error occurred';

        console.error('Error details:', error);

        // Handle HTTP error responses
        if (error.error) {
            // Error message from backend
            if (typeof error.error === 'string') {
                errorMessage = error.error;
            }
            // More complex error object
            else if (error.error.message) {
                errorMessage = error.error.message;
            }
            // Validation errors
            else if (error.error.errors) {
                const validationErrors = Object.values(error.error.errors).join(', ');
                errorMessage = `Validation error: ${validationErrors}`;
            }
        }

        // User-friendly messages based on HTTP status codes
        if (error.status === 400) {
            errorMessage = customMessage || 'Invalid request. Please check your information.';
        } else if (error.status === 401) {
            errorMessage = 'Authentication required. Please log in.';
            // Redirect to login page if session may have expired
            this.router.navigate(['/login'], {
                queryParams: { returnUrl: this.router.url }
            });
        } else if (error.status === 403) {
            errorMessage = 'You do not have permission to perform this action.';
        } else if (error.status === 404) {
            errorMessage = 'The requested resource was not found.';
        } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
        }

        // Show toast notification
        this.toastrService.message(
            errorMessage,
            'Error',
            {
                toastrMessageType: ToastrMessageType.Error,
                position: ToastrPosition.TopRight
            }
        );
    }
}