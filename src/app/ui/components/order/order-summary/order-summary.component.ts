import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { DownbarComponent } from '../../downbar/downbar.component';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { Order } from 'src/app/contracts/order/order';
import { OrderService } from 'src/app/services/common/models/order.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, NavbarComponent, MainHeaderComponent, DownbarComponent],
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.scss']
})
export class OrderSummaryComponent extends BaseComponent implements OnInit {
  orderSummary: Order;
  orderId: string;

  constructor(
    spinner: NgxSpinnerService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    // URL parametresinden orderId'yi al
    this.activatedRoute.params.subscribe(async params => {
      this.orderId = params['orderId'];
      
      if (!this.orderId) {
        this.router.navigate(['/']);
        return;
      }

      await this.loadOrderSummary();
    });
  }
  
  private async loadOrderSummary() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
  
    try {
      this.orderSummary = await this.orderService.getUserOrderById(
        this.orderId,
        () => {
          this.hideSpinner(SpinnerType.BallSpinClockwise);
        },
        (error) => {
          this.toastrService.message(
            'Sipariş detayları yüklenirken bir hata oluştu',
            'Hata',
            {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight
            }
          );
          console.error('Error loading order:', error);
          this.hideSpinner(SpinnerType.BallSpinClockwise);
        }
      );
    } catch (error) {
      this.toastrService.message(
        'Sipariş detayları yüklenirken bir hata oluştu',
        'Hata',
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
      console.error('Error:', error);
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  // Component destroy olduğunda local storage'ı temizleyelim
  ngOnDestroy() {
    localStorage.removeItem('currentOrderId');
  }

  // Ana sayfaya dön
  goToHome(): void {
    localStorage.removeItem('currentOrderId'); // Navigation öncesi temizleyelim
    this.router.navigate(['/']);
  }

  // Siparişlerim sayfasına git
  goToOrders(): void {
    localStorage.removeItem('currentOrderId'); // Navigation öncesi temizleyelim
    this.router.navigate(['/order']);
  }
}