import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { Order } from 'src/app/contracts/order/order';
import { OrderFilterByDynamic } from 'src/app/contracts/order/orderFilterByDynamic';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { OrderDetailDialogComponent } from 'src/app/dialogs/orderDialogs/order-detail-dialog/order-detail-dialog.component';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { OrderService } from 'src/app/services/common/models/order.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, 
    ReactiveFormsModule, 
    MatPaginatorModule, 
    MatTableModule, 
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    DeleteDirectiveComponent,
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss','../../../../styles.scss']
})
export class OrdersComponent extends BaseComponent implements OnInit {

  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listOrder: GetListResponse<Order>
  pagedOrders: Order[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  displayedColumns: string[] = ['No', 'Order Code', 'Order Date', 'Order Status', 'Total Price','Detail','Delete'];
  searchForm: FormGroup;
  private searchCache: Order[] = [];
  private currentSearchTerm: string = '';

  constructor(
    spinner: NgxSpinnerService,
    private orderService: OrderService,
    private toastrService: CustomToastrService,
    private fb: FormBuilder,
    private router: Router,
    public dialog: MatDialog
  ) {
    super(spinner);

    this.searchForm = this.fb.group({
      nameSearch: [''],
    });

    this.searchForm.get('nameSearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchOrder(value);
      } else if (value.length === 0) {
        this.getOrders();
        this.searchCache = []; // Önbelleği temizle
        this.currentSearchTerm = '';
      }
    });
  }
  async ngOnInit() {
    await this.getOrders();
  }

  async getOrders() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const data: GetListResponse<Order> = await this.orderService.getAllOrders(
      this.pageRequest,
      () => {},
      (error) => {
        this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
      }
    );
    this.listOrder = data;
    this.pagedOrders = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);

    this.hideSpinner(SpinnerType.BallSpinClockwise);

  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getOrders();
  }

  async searchOrder(searchTerm: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    if (searchTerm.startsWith(this.currentSearchTerm) && this.searchCache.length > 0) {
      // İstemci tarafında filtreleme yap
      this.pagedOrders = this.searchCache.filter(product => 
        this.orderMatchesSearchTerm(product, searchTerm)
      );
      this.count = this.pagedOrders.length;
      this.pages = Math.ceil(this.count / this.pageSize);
      this.currentPageNo = 1;
    } else {
      // Sunucuya yeni bir istek at
      const filters: Filter[] = this.buildFilters(searchTerm);

      const dynamicQuery: DynamicQuery = {
        sort: [{ field: 'OrderCode', dir: 'asc' }], // 'Name' alanını güncellediğinizden emin olun
        filter: filters.length > 0 ? {
          logic: 'and',
          filters: filters
        } : undefined
      };

      const data: GetListResponse<Order> = await this.orderService.getOrdersByDynamic(
        this.pageRequest,
        dynamicQuery,
        () => {},
        (error) => {
          this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
        }
      );
      
      this.pagedOrders = data.items;
      this.count = data.count;
      this.pages = data.pages;
      this.currentPageNo = 1;

      // Önbelleği güncelle
      this.searchCache = data.items;
      this.currentSearchTerm = searchTerm;
    } 
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }
  

  private buildFilters(searchTerm: string): Filter[] {
    const terms = searchTerm.split(' ').filter(term => term.length > 0);
  
    const orderCode = OrderFilterByDynamic.OrderCode;
    const orderDate = OrderFilterByDynamic.OrderDate;
    const status = OrderFilterByDynamic.Status;
    const userName = OrderFilterByDynamic.UserName;
    const filters: Filter[] = terms.map(term => ({
      field: orderCode,
        operator: "contains",
        value: searchTerm,
        logic: "or",
        filters: [
          {
            field: orderDate,
            operator: "gte", // Daha büyük veya eşit (Contains yerine uygun tarih operatörü)
            value: new Date(searchTerm).toISOString(), // Tarih karşılaştırması için geçerli bir tarih değeri
            logic: "or",
            filters: [
              {
                field: status,
                operator: "eq",
                value: searchTerm,
                logic: "or",
                filters: [
                  {
                    field: userName,
                    operator: "contains",
                    value: searchTerm,
                  }
                ],
              },
            ],
          },
        ],
    }));
  
    return filters;
  }
  

  private orderMatchesSearchTerm(order: Order, searchTerm: string): boolean {
    const terms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
    const orderCode = order.orderCode?.toLowerCase() || '';
    const orderDate = order.orderDate?.toString() || '';
    const status = order.status?.toString() || '';
    const userName = order.userName?.toLowerCase() || '';
  
    return terms.every(term => 
      orderCode.includes(term) || orderDate.includes(term) || status.includes(term) || userName.includes(term)
    );
  }

  removeOrderFromList(id: string) {
    this.pagedOrders = this.pagedOrders.filter(order => order.id !== id);
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);
  
    if (this.pagedOrders.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.getOrders();
    }
  }

  async openOrderDetail(id: string) {
    const dialogRef = this.dialog.open(OrderDetailDialogComponent, {
      width: '900px',
      data: { id }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'update') {
        this.getOrders();
      }
    });
  }

  /* getstatusLabel(status: number): string {
    return status[status]; // Sayıyı string'e çevirir
  } */

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Processing':
        return 'status-processing';
      case 'Confirmed':
        return 'status-confirmed';
      case 'Rejected':
        return 'status-rejected';
      case 'Delivered':
        return 'status-delivered';
      case 'Completed':
        return 'status-completed';
      case 'Shipped':
        return 'status-shipped';
      case 'Cancelled':
        return 'status-cancelled';
      case 'Refunded':
        return 'status-refunded';
      default:
        return '';
    }
  }
  getStatusIcon(status: string): string {
    switch (status) {
      case 'Pending':
        return 'schedule'; // Saat ikonu
      case 'Processing':
        return 'autorenew'; // İşleme ikonu
      case 'Confirmed':
        return 'check_circle'; // Onay ikonu
      case 'Rejected':
        return 'cancel'; // Reddedildi ikonu
      case 'Delivered':
        return 'local_shipping'; // Teslim edildi ikonu
      case 'Completed':
        return 'done_all'; // Tamamlandı ikonu
      case 'Shipped':
        return 'flight_takeoff'; // Gönderildi ikonu
      case 'Cancelled':
        return 'remove_circle'; // İptal ikonu
      case 'Refunded':
        return 'refund'; // İade ikonu
      default:
        return '';
    }
  }
  
}
