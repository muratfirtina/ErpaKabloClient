import { CommonModule } from "@angular/common";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { BaseComponent } from "src/app/base/base/base.component";
import { OrderCreateNotification, OrderNotification, OrderStatusNotification, OrderUpdateNotification } from "src/app/contracts/order/orderNotification";
import { SignalrService } from "src/app/services/common/signalr.service";
import { SitemapMonitoringComponent } from "../sitemap-monitoring/sitemap-monitoring.component";
import { SpinnerService } from "src/app/services/common/spinner.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SitemapMonitoringComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BaseComponent implements OnInit, OnDestroy {
  orderNotifications: OrderCreateNotification[] = [];
  statusUpdates: OrderStatusNotification[] = [];
  orderUpdates: OrderUpdateNotification[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    spinner: SpinnerService,
    private signalrService: SignalrService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    await this.signalrService.initialize();

    // Yeni sipariş bildirimleri
    this.subscriptions.push(
      this.signalrService.getOrderNotifications().subscribe(notifications => {
        this.orderNotifications = notifications;
        // UI güncelleme işlemleri
      })
    );

    // Sipariş durum güncellemeleri
    this.subscriptions.push(
      this.signalrService.getOrderStatusUpdates().subscribe(updates => {
        this.statusUpdates = updates;
        // UI güncelleme işlemleri
      })
    );

    // Sipariş güncellemeleri
    this.subscriptions.push(
      this.signalrService.getOrderUpdates().subscribe(updates => {
        this.orderUpdates = updates;
        // UI güncelleme işlemleri
      })
    );
  }

  ngOnDestroy() {
    // Subscription'ları temizle
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
}