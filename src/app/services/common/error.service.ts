import { Injectable } from '@angular/core';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(private toastrService: CustomToastrService) {}

  handleError(error: any, defaultMessage: string = 'An error occurred'): void {
    let errorMessage = defaultMessage;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

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