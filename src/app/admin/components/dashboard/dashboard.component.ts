import { CommonModule } from "@angular/common";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { Subscription } from "rxjs";
import { BaseComponent, SpinnerType } from "src/app/base/base/base.component";
import { OrderCreateNotification, OrderStatusNotification, OrderUpdateNotification } from "src/app/contracts/order/orderNotification";
import { SignalrService } from "src/app/services/common/signalr.service";
import { SpinnerService } from "src/app/services/common/spinner.service";
import { AuthService } from "src/app/services/common/auth.service";
import { NotificationService } from "src/app/services/common/notification.service";
import { CustomToastrService, ToastrMessageType, ToastrPosition } from "src/app/services/ui/custom-toastr.service";
import { DashboardStatistics } from "src/app/contracts/dashboard/dashboardStatistics";
import { RecentItem } from "src/app/contracts/dashboard/recentItem";
import { TopLocation } from "src/app/contracts/dashboard/topLocation";
import { TopProduct } from "src/app/contracts/dashboard/topProduct";
import { DashboardService } from "src/app/services/common/models/dashboard.service";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BaseComponent implements OnInit, OnDestroy {
  // Notifications properties from old version
  orderNotifications: OrderCreateNotification[] = [];
  statusUpdates: OrderStatusNotification[] = [];
  orderUpdates: OrderUpdateNotification[] = [];
  notificationsCollapsed: boolean = false;
  
  // New dashboard data properties
  statistics: DashboardStatistics | null = null;
  topSellingProducts: TopProduct[] = [];
  topCartProducts: TopProduct[] = [];
  topOrderLocations: TopLocation[] = [];
  recentCategories: RecentItem[] = [];
  recentBrands: RecentItem[] = [];
  
  // UI control properties
  selectedTimeFrame: string = 'all';
  timeFrameOptions = [
    { value: 'all', label: 'Tüm Zamanlar' },
    { value: 'month', label: 'Bu Ay' },
    { value: 'week', label: 'Bu Hafta' },
    { value: 'day', label: 'Son 24 Saat' },
    { value: 'days10', label: 'Son 10 Gün' },
    { value: 'days30', label: 'Son 30 Gün' }
  ];
  
  loading: boolean = false;
  error: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    spinner: SpinnerService,
    private signalrService: SignalrService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private toastrService: CustomToastrService,
    private dashboardService: DashboardService
  ) {
    super(spinner);
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // SignalR servisini başlat (eski sürümden)
      await this.signalrService.initialize();

      // NotificationService'den bildirimleri takip et (eski sürümden)
      this.subscriptions.push(
        this.notificationService.getOrderNotifications().subscribe(notifications => {
          this.orderNotifications = notifications;
        })
      );

      this.subscriptions.push(
        this.notificationService.getOrderStatusUpdates().subscribe(updates => {
          this.statusUpdates = updates;
        })
      );

      this.subscriptions.push(
        this.notificationService.getOrderUpdates().subscribe(updates => {
          this.orderUpdates = updates;
        })
      );
      
      // Yeni dashboard verilerini yükle
      await this.loadDashboardData();
      
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.toastrService.message("Dashboard yüklenirken bir hata oluştu", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      this.error = "Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    } finally {
      this.hideSpinner(SpinnerType.SquareLoader);
    }
  }

  ngOnDestroy() {
    // Subscription'ları temizle
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Notification methods (from old version)
  getTotalUnreadNotifications(): number {
    return this.notificationService.getTotalNotificationsCount();
  }

  hasNotifications(): boolean {
    return this.getTotalUnreadNotifications() > 0;
  }

  toggleNotificationsCollapsed(): void {
    this.notificationsCollapsed = !this.notificationsCollapsed;
  }

  clearAllNotifications(): void {
    this.notificationService.clearAllNotifications();
    this.toastrService.message("Tüm bildirimler temizlendi", "Bildirimler", {
      toastrMessageType: ToastrMessageType.Success,
      position: ToastrPosition.TopRight
    });
  }

  dismissNotification(type: string, index: number): void {
    switch(type) {
      case 'order':
        this.notificationService.removeOrderNotification(index);
        break;
      case 'status':
        this.notificationService.removeOrderStatusUpdate(index);
        break;
      case 'update':
        this.notificationService.removeOrderUpdate(index);
        break;
    }
  }

  processOrder(orderNumber: string): void {
    // Sipariş işleme mantığı burada olacak
    this.toastrService.message(`Sipariş #${orderNumber} işleme alındı`, "Sipariş İşlemi", {
      toastrMessageType: ToastrMessageType.Success,
      position: ToastrPosition.TopRight
    });
    
    // Bildirimi kaldır
    this.notificationService.removeOrderNotificationByNumber(orderNumber);
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

  // New dashboard methods
  async onTimeFrameChange() {
    this.loading = true;
    this.error = null;
    
    try {
      await this.loadDashboardData();
      this.toastrService.message(`${this.getTimeFrameLabel()} veriler yüklendi`, "Bilgi", {
        toastrMessageType: ToastrMessageType.Info,
        position: ToastrPosition.TopRight
      });
    } catch (error) {
      console.error('Error changing time frame:', error);
      this.toastrService.message("Veriler yüklenirken bir hata oluştu", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      this.error = "Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    } finally {
      this.loading = false;
    }
  }

  private async loadDashboardData() {
    // Load all data in parallel for better performance
    const [
      statistics,
      topSellingProducts,
      topCartProducts,
      topOrderLocations,
      recentCategories,
      recentBrands
    ] = await Promise.all([
      this.dashboardService.getStatistics(this.selectedTimeFrame),
      this.dashboardService.getTopSellingProducts(this.selectedTimeFrame),
      this.dashboardService.getTopCartProducts(this.selectedTimeFrame),
      this.dashboardService.getTopOrderLocations(this.selectedTimeFrame),
      this.dashboardService.getRecentCategories(),
      this.dashboardService.getRecentBrands()
    ]);

    this.statistics = statistics;
    this.topSellingProducts = topSellingProducts;
    this.topCartProducts = topCartProducts;
    this.topOrderLocations = topOrderLocations;
    this.recentCategories = recentCategories;
    this.recentBrands = recentBrands;
  }

  private getTimeFrameLabel(): string {
    const option = this.timeFrameOptions.find(o => o.value === this.selectedTimeFrame);
    return option ? option.label : 'Tüm Zamanlar';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  }

  formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('tr-TR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatPercentage(value: number): string {
    return value.toFixed(2) + '%';
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('tr-TR').format(value);
  }

  navigateToProduct(productId: string): void {
    // Ürün detay sayfasına yönlendirme işlemleri
    console.log(`Navigating to product: ${productId}`);
  }

  navigateToCategory(categoryId: string): void {
    // Kategori detay sayfasına yönlendirme işlemleri
    console.log(`Navigating to category: ${categoryId}`);
  }

  navigateToBrand(brandId: string): void {
    // Marka detay sayfasına yönlendirme işlemleri
    console.log(`Navigating to brand: ${brandId}`);
  }

  getEmptyStateMessage(dataType: string): string {
    const timeFrame = this.getTimeFrameLabel().toLowerCase();
    
    switch(dataType) {
      case 'topSellingProducts':
        return `${timeFrame} için satış verisi bulunamadı.`;
      case 'topCartProducts':
        return `${timeFrame} için sepet verisi bulunamadı.`;
      case 'topOrderLocations':
        return `${timeFrame} için sipariş lokasyonu verisi bulunamadı.`;
      case 'recentCategories':
        return `Henüz kategori eklenmemiş.`;
      case 'recentBrands':
        return `Henüz marka eklenmemiş.`;
      default:
        return `Veri bulunamadı.`;
    }
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    this.toastrService.message("Dashboard yenilendi", "Bilgi", {
      toastrMessageType: ToastrMessageType.Info,
      position: ToastrPosition.TopRight
    });
  }
}