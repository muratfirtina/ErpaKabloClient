import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseDialog } from '../baseDialog';

@Component({
  selector: 'app-cart-item-remove-dialog',
  standalone: true,
  imports: [],
  templateUrl: './cart-item-remove-dialog.component.html',
  styleUrl: './cart-item-remove-dialog.component.scss'
})
export class CartItemRemoveDialogComponent extends BaseDialog<CartItemRemoveDialogComponent> {
  constructor(
    dialogRef: MatDialogRef<CartItemRemoveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CartItemRemoveDialogState
  ) {
    super(dialogRef);
  }

  
  confirm() {
    this.dialogRef.close(CartItemRemoveDialogState.Yes);
  }
}

export enum CartItemRemoveDialogState {
  Yes,
  No
}