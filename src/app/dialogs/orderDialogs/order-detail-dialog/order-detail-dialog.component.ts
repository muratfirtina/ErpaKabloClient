import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Order } from 'src/app/contracts/order/order';
import { OrderService } from 'src/app/services/common/models/order.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderItemRemoveDialogComponent } from '../order-item-remove-dialog/order-item-remove-dialog.component';
import { OrderDetailConfirmDialogComponent } from '../order-detail-confirm-dialog/order-detail-confirm-dialog.component';
import { OrderItem } from 'src/app/contracts/order/orderItem';
import { OrderStatus } from 'src/app/contracts/order/orderStatus';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-order-detail-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule
  ],
  templateUrl: './order-detail-dialog.component.html',
  styleUrls: ['./order-detail-dialog.component.scss']
})
export class OrderDetailDialogComponent implements OnInit {
  orderForm: FormGroup;
  order: Order;
  orderStatuses = Object.keys(OrderStatus).filter((key) => !isNaN(Number(OrderStatus[key]))); // Enum'dan status değerleri alınıyor.
  totalPrice: number;
  updatedTotalPrice: number = 0;

  constructor(
    public dialogRef: MatDialogRef<OrderDetailDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { id: string },
    private orderService: OrderService,
    private toastrService: CustomToastrService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    // Order'ı al
    this.order = await this.orderService.getOrderById(this.data.id, () => {}, (error) => {
      this.toastrService.message(error, "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    });
  
    // Form oluştur ve mevcut değerleri set et
    this.orderForm = this.fb.group({
      status: [this.order.status], // Mevcut status'u set et
      description: [this.order.description],
      adminNote: [this.order.adminNote],
      userAddress: this.fb.group({
        addressLine1: [this.order.userAddress?.addressLine1],
        city: [this.order.userAddress?.city],
        postalCode: [this.order.userAddress?.postalCode],
        country: [this.order.userAddress?.country]
      })
    });
  
    this.calculateTotalPrice();
    this.calculateUpdatedTotalPrice();
  }

  // Toplam fiyatı hesaplar
  calculateTotalPrice() {
    this.totalPrice = this.order.orderItems
      .filter(item => !item.markedForDeletion) // Silinecek ürünleri dikkate almaz
      .reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  calculateUpdatedTotalPrice() {
    this.updatedTotalPrice = this.order.orderItems
      .filter(item => !item.markedForDeletion) // Silinecek ürünleri dışarıda bırak
      .reduce((acc, item) => {
        // Eğer updatedPrice varsa onu, yoksa normal price'ı kullan
        const price = item.updatedPrice;
        return acc + (price * item.quantity);
      }, 0);
  }

  // Siparişi güncelleme işlemi
  async updateOrder() {
    try {
      // Önce orderItem'lar üzerindeki değişiklikler işleniyor
      for (const item of this.order.orderItems) {
        if (item.markedForDeletion) {
          await this.orderService.deleteOrderItem(item.id);
        } else if (item.markedForUpdate) {
          await this.orderService.updateOrderItemDetails(item);
        }
      }

      // OrderItem'lar işlendikten sonra toplam fiyat yeniden hesaplanıyor
      this.calculateTotalPrice();

      // Order güncelleniyor
      const updatedOrder = { ...this.order, ...this.orderForm.value, totalPrice: this.totalPrice };

      // Order güncellemesi yapılır
      await this.orderService.updateOrder(updatedOrder, () => {
        this.toastrService.message("Sipariş başarıyla güncellendi.", "Başarılı", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        this.dialogRef.close({ action: 'update' });
      }, (error) => {
        this.toastrService.message(error, "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      });

    } catch (error) {
      this.toastrService.message("Beklenmedik bir hata oluştu.", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  // OrderItem silme işlemi
  async removeOrderItem(item: OrderItem) {
    const dialogRef = this.dialog.open(OrderItemRemoveDialogComponent, {
      width: '400px',
      data: { productName: item.productName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        item.markedForDeletion = true; // Silinmesi işaretleniyor
        this.calculateTotalPrice(); // Toplam fiyat yeniden hesaplanıyor
      }
    });
  }

  // OrderItem miktar güncelleme işlemi
  updateQuantity(item: OrderItem, newQuantity: number) {
    if (newQuantity > 0) {
      item.quantity = newQuantity;
      item.markedForUpdate = true; // Güncelleme işaretleniyor
      this.calculateTotalPrice(); // Toplam fiyat yeniden hesaplanıyor
      this.calculateUpdatedTotalPrice();
    } else {
      this.toastrService.message("Geçersiz miktar veya stok yetersiz.", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  updatePrice(item: OrderItem, newPrice: number) {
    if (newPrice > 0) {
      item.updatedPrice = newPrice;
      item.markedForUpdate = true; // Güncelleme işaretleniyor
      this.calculateTotalPrice(); // Toplam fiyat yeniden hesaplanıyor
    } else {
      this.toastrService.message("Geçersiz fiyat.", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  updateLeadTime(item: OrderItem, newLeadTime: number) {
    if (newLeadTime > 0) {
      item.leadTime = newLeadTime;
      item.markedForUpdate = true; // Güncelleme işaretleniyor
    } else {
      this.toastrService.message("Geçersiz teslim süresi.", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  /* async confirmChanges() {
    const dialogRef = this.dialog.open(OrderDetailConfirmDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'confirm') {
        try {
          const formValue = this.orderForm.value;
          const updatedOrder = {
            ...this.order,
            ...formValue,
            adminNote: formValue.adminNote,
            orderItems: this.order.orderItems.map(item => ({
              ...item,
              updatedPrice: item.updatedPrice,
              leadTime: item.leadTime
            }))
          };

          await this.orderService.updateOrder(updatedOrder, 
            () => {
              this.toastrService.message("Order updated successfully", "Success", {
                toastrMessageType: ToastrMessageType.Success,
                position: ToastrPosition.TopRight
              });
              this.dialogRef.close({ action: 'update' });
            },
            (error) => {
              this.toastrService.message(error, "Error", {
                toastrMessageType: ToastrMessageType.Error,
                position: ToastrPosition.TopRight
              });
            }
          );
        } catch (error) {
          this.toastrService.message("An error occurred while updating order", "Error", {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          });
        }
      }
    });
  } */

  // Değişiklikleri onayla işlemi
  async confirmChanges() {
    const dialogRef = this.dialog.open(OrderDetailConfirmDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'confirm') {
        try {
          await this.updateOrder(); // Değişiklikler onaylandığında siparişi güncelle
          this.toastrService.message("Değişiklikler başarıyla kaydedildi.", "Başarılı", {
            toastrMessageType: ToastrMessageType.Success,
            position: ToastrPosition.TopRight
          });
          this.dialogRef.close({ action: 'update' });
        } catch (error) {
          this.toastrService.message("Onay sırasında bir hata oluştu.", "Hata", {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          });
        }
      }
    });
  }
}