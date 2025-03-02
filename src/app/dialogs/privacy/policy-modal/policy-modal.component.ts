import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-policy-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './policy-modal.component.html',
  styleUrl: './policy-modal.component.scss'
})
export class PolicyModalComponent {
  @Input() title: string = '';
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }
}