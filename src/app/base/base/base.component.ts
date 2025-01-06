import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [CommonModule],
  template: ''
})
export class BaseComponent {
  constructor(private spinner: SpinnerService) { }

  showSpinner(spinnerNameType: SpinnerType) {
    this.spinner.show(spinnerNameType);
  }

  hideSpinner(spinnerNameType: SpinnerType) {
    this.spinner.hide(spinnerNameType);
  }
}

export enum SpinnerType {
  BallSpinClockwise = "s1",
  SquareLoader = "s2",
  // İstediğiniz kadar spinner tipi ekleyebilirsiniz
}