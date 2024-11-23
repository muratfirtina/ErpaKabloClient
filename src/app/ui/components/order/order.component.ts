import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { OrderService } from 'src/app/services/common/models/order.service';
import { Order } from 'src/app/contracts/order/order';
import { OrderStatus } from 'src/app/contracts/order/orderStatus';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NavbarComponent } from '../navbar/navbar.component';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { DownbarComponent } from '../downbar/downbar.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { DesktopUserSidebarComponent } from '../user/desktop-user-sidebar/desktop-user-sidebar.component';
import { BreadcrumbService } from 'src/app/services/common/breadcrumb.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatPaginatorModule, 
    NavbarComponent, 
    MainHeaderComponent, 
    BreadcrumbComponent, 
    DesktopUserSidebarComponent, 
    DownbarComponent,
    BreadcrumbComponent
  ],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent extends BaseComponent implements OnInit {
  orders: Order[] = [];
  totalItems: number = 0;
  searchQuery: string = '';
  statusFilter: OrderStatus = OrderStatus.All;
  dateRange: string = 'all';
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  loading: boolean = false;

  public OrderStatus = OrderStatus;  // Template'de enum değerlerine erişim için

  constructor(
    spinner: NgxSpinnerService,
    private breadcrumbService: BreadcrumbService,
    private orderService: OrderService,
    private toastr: CustomToastrService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Orders', url: '/order' }
    ]);
    await this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.loading = true;
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const searchTerm = this.searchQuery.trim() === '' ? null : this.searchQuery;
    
    try {
      const response = await this.orderService.getOrdersByUser(
        this.pageRequest,
        searchTerm || '',
        this.dateRange,
        this.statusFilter,
        () => {
          this.hideSpinner(SpinnerType.BallSpinClockwise);
          this.loading = false;
        },
        (error) => {
          console.error('Error loading orders:', error);
          this.toastr.message('Orders loading error', 'Error',{
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
            
          });
          this.hideSpinner(SpinnerType.BallSpinClockwise);
          this.loading = false;
        }
      );
      
      this.orders = response.items;
      this.totalItems = response.count;
    } catch (error) {
      this.toastr.message('Orders loading error', 'Error',{
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
        
      });
      console.error('Error:', error);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.loading = false;
    }
  }

  // Arama inputu değiştiğinde çağrılır
  searchOrders(): void {
    // Debounce eklenebilir
    this.pageRequest.pageIndex = 0; // Aramada ilk sayfaya dön
    this.loadOrders();
  }

  // Sipariş durumuna göre filtreler
  filterByStatus(status: OrderStatus): void {
    this.statusFilter = status;
    this.pageRequest.pageIndex = 0; // Filtrelemede ilk sayfaya dön
    this.loadOrders();
  }

  // Sipariş durumuna göre renk sınıfı döndürür
  getStatusColorClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending:
      case OrderStatus.Processing:
        return 'text-warning';
      case OrderStatus.Confirmed:
      case OrderStatus.Shipped:
        return 'text-light-green';
      case OrderStatus.Completed:
        return 'text-dark-green';
      case OrderStatus.Returned:
      case OrderStatus.Cancelled:
      case OrderStatus.Rejected:
        return 'text-danger';
      default:
        return '';
    }
  }

  // Türkçe sipariş durumu metni döndürür
  getStatusText(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.Pending:
        return 'Pending';
      case OrderStatus.Processing:
        return 'Processing';
      case OrderStatus.Confirmed:
        return 'Confirmed';
      case OrderStatus.Rejected:
        return 'Rejected';
      case OrderStatus.Delivered:
        return 'Delivered';
      case OrderStatus.Completed:
        return 'Completed';
      case OrderStatus.Shipped:
        return 'Shipped';
      case OrderStatus.Cancelled:
        return 'Cancelled';
      case OrderStatus.Returned:
        return 'Refunded';
      default:
        return 'Unknown Status';
    }
  }

  // Tarih aralığına göre filtreler
  filterByDateRange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.dateRange = target.value;
    this.pageRequest.pageIndex = 0; // Filtrelemede ilk sayfaya dön
    this.loadOrders();
  }

  // Sayfalama değiştiğinde tetiklenir
  onPageChange(event: PageEvent): void {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.loadOrders();
  }

  // Sipariş detaylarını açıp kapatır
  toggleOrderDetails(order: Order): void {
    order.expanded = !order.expanded;
  }

  // Aktif filtre butonunu kontrol eder
  isActiveFilter(status: OrderStatus): boolean {
    return this.statusFilter === status;
  }

  // Sipariş grubuna göre filtreleme mantığı
  isInProgressGroup(status: OrderStatus): boolean {
    return status === OrderStatus.Pending || 
           status === OrderStatus.Processing || 
           status === OrderStatus.Confirmed || 
           status === OrderStatus.Shipped;
  }

  isInCancelledGroup(status: OrderStatus): boolean {
    return status === OrderStatus.Cancelled || 
           status === OrderStatus.Rejected;
  }

  isInRefundedGroup(status: OrderStatus): boolean {
    return status === OrderStatus.Returned;
  }

  isInCompletedGroup(status: OrderStatus): boolean {
    return status === OrderStatus.Completed;
  }
}