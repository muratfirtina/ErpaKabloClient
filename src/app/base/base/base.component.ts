import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})


export class BaseComponent {
  constructor(private spinner:NgxSpinnerService) { }

  showSpinner(spinnerNameType: SpinnerType) {
    this.spinner.show(spinnerNameType);
    
    
  }

  hideSpinner(spinnerNameType: SpinnerType) {
    this.spinner.hide(spinnerNameType);
  }
}

export enum SpinnerType {
  BallSpinClockwise = "s1",
}