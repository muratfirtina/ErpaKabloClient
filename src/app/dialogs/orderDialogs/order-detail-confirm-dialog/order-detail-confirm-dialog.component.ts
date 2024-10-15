import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-order-detail-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './order-detail-confirm-dialog.component.html',
  styleUrl: './order-detail-confirm-dialog.component.scss'
})
export class OrderDetailConfirmDialogComponent {
  constructor(public dialogRef: MatDialogRef<OrderDetailConfirmDialogComponent>) {}

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}