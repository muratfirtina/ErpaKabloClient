import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrderItem } from 'src/app/contracts/order/orderItem';

@Component({
  selector: 'app-order-item-dialog',
  standalone: true,
  imports: [],
  templateUrl: './order-item-dialog.component.html',
  styleUrl: './order-item-dialog.component.scss'
})
export class OrderItemDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<OrderItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orderItem: OrderItem }
  ) { }

  onDelete() {
    this.dialogRef.close({ action: 'delete', item: this.data.orderItem });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}