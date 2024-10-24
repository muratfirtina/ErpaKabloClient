import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { OrderService } from 'src/app/services/common/models/order.service';
import { Order } from 'src/app/contracts/order/order';
import { OrderStatus } from 'src/app/contracts/order/orderStatus';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { UserSidebarComponent } from '../user/user-sidebar/user-sidebar.component';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, NavbarComponent,MainHeaderComponent,BreadcrumbComponent,UserSidebarComponent],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent extends BaseComponent implements OnInit {
  orders: Order[] = [];
  totalItems: number = 0;
  searchQuery: string = '';  // Varsayılan olarak boş string
  statusFilter: OrderStatus = OrderStatus.All;  // Enum kullanımı
  dateRange: string = 'all';  // Varsayılan tarih aralığı
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };

  public OrderStatus = OrderStatus;  // Enum erişimi

  constructor(
    spinner: NgxSpinnerService,
    private orderService: OrderService
  ) {
    super(spinner);
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    await this.loadOrders(); // Sayfa ilk açıldığında tüm siparişler yüklenecek
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  // Siparişleri yükler
  async loadOrders(): Promise<void> {
    // Eğer arama boşsa searchQuery'e boş string gönderiyoruz
    const searchTerm = this.searchQuery.trim() === '' ? null : this.searchQuery;

    this.orderService.getOrdersByUser(
      this.pageRequest, 
      searchTerm || '', 
      this.dateRange, 
      this.statusFilter, 
      () => {}, 
      (error) => console.error('Error loading orders:', error)
    ).then(response => {
      this.orders = response.items;
      this.totalItems = response.count;
    });
  }

  // Arama inputu değiştiğinde çağrılır
  searchOrders() {
    this.loadOrders();
  }

  // Sipariş durumuna göre filtreler
  filterByStatus(status: OrderStatus) {
    this.statusFilter = status;
    this.loadOrders();
  }

  // Tarih aralığına göre filtreler
  filterByDateRange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.dateRange = target.value;
    this.loadOrders();
  }

  // Sayfa değişiminde tetiklenir
  onPageChange(event: PageEvent) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.loadOrders();
  }

  // Sipariş detaylarını açıp kapatır
  toggleOrderDetails(order: Order) {
    order.expanded = !order.expanded;
  }
}