import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PolicyModalComponent } from '../policy-modal/policy-modal.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule,PolicyModalComponent],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent {
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
