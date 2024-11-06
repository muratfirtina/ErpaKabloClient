import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CustomToastrService } from '../../ui/custom-toastr.service';
import { AuthService } from '../auth.service';
import { HttpClientService } from '../http-client.service';
import { ProductService } from './product.service';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { OrderList } from 'src/app/contracts/order/orderList';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { Observable, firstValueFrom } from 'rxjs';
import { CreateOrder } from 'src/app/contracts/order/createOrder';
import { Order } from 'src/app/contracts/order/order';
import { OrderItem } from 'src/app/contracts/order/orderItem';
import { OrderStatus } from 'src/app/contracts/order/orderStatus';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private httpClientService: HttpClientService,
    private authService:AuthService,
    private customToastrService:CustomToastrService,
    private router:Router,
    private productService: ProductService) { }

    async create(createOrder: CreateOrder, successCallback?: (response: any) => void, errorCallback?: (errorMessage: string) => void): Promise<any> {
      const observable: Observable<any> = this.httpClientService.post({
        controller: 'orders',
        action: 'convert-cart-to-order'
      }, createOrder);
    
      const promiseData = firstValueFrom(observable);
      promiseData.then((response) => {
        if (successCallback) successCallback(response);
      }).catch(error => {
        if (errorCallback) errorCallback(error);
      });
    
      return await promiseData;
    }

  async getAllOrders(pageRequest:PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Order>>{
    const observable : Observable<GetListResponse<Order>> = this.httpClientService.get<GetListResponse<Order>>({
      controller: "orders",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async getOrdersByDynamic(pageRequest:PageRequest, dynamicQuery: any, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Order>>{
    const observable : Observable<GetListResponse<Order>> = this.httpClientService.post<GetListResponse<Order>>({
      controller: "orders",
      action: "get-orders-by-dynamic",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    }, dynamicQuery);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async updateOrder(order: Order, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<void> {
    const observable: Observable<any> = this.httpClientService.put({
      controller: 'orders',
      action: 'update'
    }, order);

    const promiseData = firstValueFrom(observable);
    promiseData.then(() => {
      if (successCallback) successCallback();
    }).catch(error => {
      if (errorCallback) errorCallback(error);
    });

    await promiseData;
  }

  async deleteOrder(id: string, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<void> {
    const observable: Observable<any> = this.httpClientService.delete({
      controller: 'orders'
    }, id);

    const promiseData = firstValueFrom(observable);
    promiseData.then(() => {
      if (successCallback) successCallback();
    }).catch(error => {
      if (errorCallback) errorCallback(error);
    });

    await promiseData;
  }

  async getOrderById(id: string, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<Order>{
    const observable : Observable<Order> = this.httpClientService.get<Order>({
      controller: "orders",
    }, id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async updateOrderItem(orderItem: OrderItem, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<void> {
    const observable: Observable<any> = this.httpClientService.put({
      controller: 'orders',
      action: 'update-item'
    }, orderItem);

    const promiseData = firstValueFrom(observable);
    promiseData.then(() => {
      if (successCallback) successCallback();
    }).catch(error => {
      if (errorCallback) errorCallback(error);
    });

    return await promiseData;
  }

  async deleteOrderItem(id: string, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<void> {
    const observable: Observable<any> = this.httpClientService.delete({
      controller: 'orders',
      action: 'delete-item'
    }, id);

    const promiseData = firstValueFrom(observable);
    promiseData.then(() => {
      if (successCallback) successCallback();
    }).catch(error => {
      if (errorCallback) errorCallback(error);
    });

    await promiseData;
  }
  async getOrdersByUser(pageRequest:PageRequest,searchTerm: string, dateRange :string, orderStatus:OrderStatus, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<GetListResponse<Order>>{
    const observable : Observable<GetListResponse<Order>> = this.httpClientService.get<GetListResponse<Order>>({
      controller: "orders",
      action: "user-orders",
      queryString: `orderStatus=${orderStatus}&dateRange=${dateRange}&searchTerm=${searchTerm}&pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getUserOrderById(id: string, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<Order> {
    const observable: Observable<Order> = this.httpClientService.get<Order>({
      controller: "orders",
      action: "user-order"
    }, id);
  
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
  
    return await promiseData;
  }
}

