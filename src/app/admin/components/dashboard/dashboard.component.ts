import { CommonModule } from "@angular/common";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { NgxSpinnerService } from "ngx-spinner";
import { Subscription } from "rxjs";
import { BaseComponent } from "src/app/base/base/base.component";
import { OrderNotification, OrderStatusNotification } from "src/app/contracts/order/orderNotification";
import { SignalrService } from "src/app/services/common/signalr.service";
import { SitemapMonitoringComponent } from "../sitemap-monitoring/sitemap-monitoring.component";
import { SeoImageComponent } from "src/app/common/seo-image/seo-image.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SitemapMonitoringComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BaseComponent implements OnInit, OnDestroy {
  orderNotifications: OrderNotification[] = [];
  statusUpdates: OrderStatusNotification[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    spinner: NgxSpinnerService,
    private signalrService: SignalrService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    await this.signalrService.initialize();
  }

  ngOnDestroy() {
  }
}