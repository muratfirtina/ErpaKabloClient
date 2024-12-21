import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DialogRef } from '@angular/cdk/dialog';  // MatDialogRef yerine DialogRef kullan

@Component({
  selector: 'app-order-detail-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './order-detail-confirm-dialog.component.html',
  styleUrl: './order-detail-confirm-dialog.component.scss'
})
export class OrderDetailConfirmDialogComponent {
  constructor(public dialogRef: DialogRef<string>) {}  // MatDialogRef yerine DialogRef kullan

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}