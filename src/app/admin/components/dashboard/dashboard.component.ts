import { CommonModule } from "@angular/common";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { BaseComponent } from "src/app/base/base/base.component";
import { OrderCreateNotification, OrderNotification, OrderStatusNotification, OrderUpdateNotification } from "src/app/contracts/order/orderNotification";
import { SignalrService } from "src/app/services/common/signalr.service";
import { SitemapMonitoringComponent } from "../sitemap-monitoring/sitemap-monitoring.component";
import { SpinnerService } from "src/app/services/common/spinner.service";
import { PerformanceMonitoringComponent } from "../performance-monitoring/performance-monitoring.component";
import { AuthService } from "src/app/services/common/auth.service";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    SitemapMonitoringComponent,
    PerformanceMonitoringComponent
  ],
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
    private signalrService: SignalrService,
    public authService: AuthService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    await this.signalrService.initialize();

    // Yeni sipariş bildirimleri
    this.subscriptions.push(
      this.signalrService.getOrderNotifications().subscribe(notifications => {
        this.orderNotifications = notifications;
      })
    );

    // Sipariş durum güncellemeleri
    this.subscriptions.push(
      this.signalrService.getOrderStatusUpdates().subscribe(updates => {
        this.statusUpdates = updates;
      })
    );

    // Sipariş güncellemeleri
    this.subscriptions.push(
      this.signalrService.getOrderUpdates().subscribe(updates => {
        this.orderUpdates = updates;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getTotalUnreadNotifications(): number {
    return this.orderNotifications.length + 
           this.statusUpdates.length + 
           this.orderUpdates.length;
  }

  getTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = date instanceof Date ? date : new Date(date);
    const diff = now.getTime() - past.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  }
}