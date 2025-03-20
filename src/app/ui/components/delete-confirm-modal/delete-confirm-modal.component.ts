// delete-confirm-modal.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirm-modal.component.html',
  styleUrls: ['./delete-confirm-modal.component.scss']
})
export class DeleteConfirmModalComponent implements OnInit {
  @Input() message: string = '';
  @Output() confirmDelete = new EventEmitter<void>();
  @Output() cancelDelete = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
    // Modal kapatıldığında cancel event'ini tetikle
    const modalElement = document.getElementById('deleteConfirmModal');
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.cancelDelete.emit();
      });
    }
  }

  onConfirm(): void {
    this.confirmDelete.emit();
    this.closeModal();
  }

  onCancel(): void {
    this.cancelDelete.emit();
    this.closeModal();
  }

  closeModal(): void {
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal'));
    modal.hide();
  }
}