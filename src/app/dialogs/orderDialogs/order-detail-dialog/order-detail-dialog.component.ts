import { A11yModule, FocusMonitor } from "@angular/cdk/a11y";
import { DialogModule, DialogRef, Dialog } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from "@angular/forms";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Order } from "src/app/contracts/order/order";
import { OrderItem } from "src/app/contracts/order/orderItem";
import { OrderStatus } from "src/app/contracts/order/orderStatus";
import { OrderService } from "src/app/services/common/models/order.service";
import { CustomToastrService, ToastrMessageType, ToastrPosition } from "src/app/services/ui/custom-toastr.service";
import { OrderDetailConfirmDialogComponent } from "../order-detail-confirm-dialog/order-detail-confirm-dialog.component";
import { OrderItemRemoveDialogComponent } from "../order-item-remove-dialog/order-item-remove-dialog.component";



@Component({
  selector: 'app-order-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    A11yModule,
  ],
  templateUrl: './order-detail-dialog.component.html',
  styleUrls: ['./order-detail-dialog.component.scss']
})
export class OrderDetailDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('dialogTitle') dialogTitle: ElementRef;
  @ViewChild('scrollContainer') scrollContainer: ElementRef;

  orderForm: FormGroup;
  order: Order;
  OrderStatus = OrderStatus;
  orderStatuses = Object.entries(OrderStatus)
    .filter(([key, value]) => !isNaN(Number(key))) // Sayısal key'leri filtrele
    .map(([key, value]) => ({
      value: Number(key),
      label: value as string
    }));
  totalPrice: number = 0;
  updatedTotalPrice: number = 0;

  constructor(
    public dialogRef: DialogRef<string>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { id: string },
    private orderService: OrderService,
    private toastrService: CustomToastrService,
    private dialog: Dialog,
    private focusMonitor: FocusMonitor
  ) {}

  async ngOnInit() {
    try {
      this.order = await this.orderService.getOrderById(this.data.id, () => {}, (error) => {
        this.toastrService.message(error, "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      });

      const statusValue = OrderStatus[this.order.status as keyof typeof OrderStatus];

      this.orderForm = this.fb.group({
        status: [statusValue], // Sayısal değeri kullan
        description: [this.order.description],
        adminNote: [this.order.adminNote],
        userAddress: this.fb.group({
          addressLine1: [this.order.userAddress?.addressLine1],
          countryName: [this.order.userAddress?.countryName],
          cityName: [this.order.userAddress?.cityName],
          districtName: [this.order.userAddress?.districtName],
          postalCode: [this.order.userAddress?.postalCode],
        })
      });

      this.calculateTotalPrice();
      this.calculateUpdatedTotalPrice();
    } catch (error) {
      this.handleError("Error loading order details");
    }
  }


  ngAfterViewInit() {
    // Dialog başlığına focus ver ve ekran okuyucular için duyur
    if (this.dialogTitle) {
      this.focusMonitor.focusVia(this.dialogTitle.nativeElement, 'program');
    }
  }

  calculateTotalPrice() {
    this.totalPrice = this.order.orderItems
      .filter(item => !item.markedForDeletion)
      .reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  calculateUpdatedTotalPrice() {
    this.updatedTotalPrice = this.order.orderItems
      .filter(item => !item.markedForDeletion)
      .reduce((acc, item) => {
        const price = item.updatedPrice || item.price;
        return acc + (price * item.quantity);
      }, 0);
  }

  async updateOrder() {
    try {
      // OrderItem güncellemeleri
      const itemUpdates = this.order.orderItems.map(async item => {
        if (item.markedForDeletion) {
          return this.orderService.deleteOrderItem(item.id);
        } else if (item.markedForUpdate) {
          return this.orderService.updateOrderItemDetails(item);
        }
        return Promise.resolve();
      });

      await Promise.all(itemUpdates);
      this.calculateTotalPrice();

      const updatedOrder = { 
        ...this.order, 
        ...this.orderForm.value, 
        totalPrice: this.totalPrice 
      };

      await this.orderService.updateOrder(updatedOrder);
      
      this.toastrService.message(
        "Order updated successfully", 
        "Success", 
        { 
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight 
        }
      );
      
      this.dialogRef.close('update');
    } catch (error) {
      this.handleError("An error occurred while updating the order");
    }
  }

  async removeOrderItem(item: OrderItem) {
    const dialogRef = this.dialog.open(OrderItemRemoveDialogComponent, {
      width: '400px',
      data: { productName: item.productName }
    });

    dialogRef.closed.subscribe(result => {
      if (result === 'yes') {
        item.markedForDeletion = true;
        this.calculateTotalPrice();
        this.calculateUpdatedTotalPrice();
      }
    });
  }

  updateQuantity(item: OrderItem, newQuantity: number) {
    if (newQuantity > 0) {
      item.quantity = newQuantity;
      item.markedForUpdate = true;
      this.calculateTotalPrice();
      this.calculateUpdatedTotalPrice();
    } else {
      this.handleError("Invalid quantity");
    }
  }

  updatePrice(item: OrderItem, newPrice: number) {
    if (newPrice > 0) {
      item.updatedPrice = newPrice;
      item.markedForUpdate = true;
      this.calculateUpdatedTotalPrice();
    } else {
      this.handleError("Invalid price");
    }
  }

  updateLeadTime(item: OrderItem, newLeadTime: number) {
    if (newLeadTime > 0) {
      item.leadTime = newLeadTime;
      item.markedForUpdate = true;
    } else {
      this.handleError("Invalid lead time");
    }
  }

  async confirmChanges() {
    const dialogRef = this.dialog.open(OrderDetailConfirmDialogComponent, { 
      width: '400px' 
    });
  
    dialogRef.closed.subscribe(async result => {
      if (result === 'confirm') {
        try {
          // Toplu güncelleme için
          const updatedItems = this.order.orderItems
            .filter(item => item.markedForUpdate && !item.markedForDeletion);
            
          if (updatedItems.length > 0) {
            await this.orderService.updateOrderItems(this.order.id, updatedItems);
          }
          
          // Silinecek öğeler
          const deletedItems = this.order.orderItems
            .filter(item => item.markedForDeletion);
            
          if (deletedItems.length > 0) {
            for (const item of deletedItems) {
              await this.orderService.deleteOrderItem(item.id);
            }
          }
          
          // Sipariş durumu güncellemesi
          const updatedOrder = { 
            ...this.order, 
            ...this.orderForm.value, 
            totalPrice: this.updatedTotalPrice 
          };
  
          await this.orderService.updateOrder(updatedOrder);
          
          this.toastrService.message(
            "Order updated successfully", 
            "Success", 
            { 
              toastrMessageType: ToastrMessageType.Success,
              position: ToastrPosition.TopRight 
            }
          );
          
          this.dialogRef.close('update');
        } catch (error) {
          this.handleError("An error occurred while updating the order");
        }
      }
    });
  }

  close() {
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
      this.focusMonitor.focusVia(mainContent as HTMLElement, 'program');
    }
    this.dialogRef.close();
  }

  private handleError(message: string) {
    this.toastrService.message(
      message,
      "Error",
      {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      }
    );
  }

  ngOnDestroy() {
    if (this.dialogTitle) {
      this.focusMonitor.stopMonitoring(this.dialogTitle.nativeElement);
    }
  }
  
}