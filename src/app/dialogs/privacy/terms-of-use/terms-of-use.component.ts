import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PolicyModalComponent } from '../policy-modal/policy-modal.component';

@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [CommonModule,PolicyModalComponent],
  templateUrl: './terms-of-use.component.html',
  styleUrl: './terms-of-use.component.scss'
})
export class TermsOfUseComponent {
  isOpen: boolean = false;

  openModal(): void {
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}