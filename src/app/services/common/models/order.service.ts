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

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private httpClientService: HttpClientService,
    private authService:AuthService,
    private customToastrService:CustomToastrService,
    private router:Router,
    private productService: ProductService) { }

    async create(createOrder: CreateOrder, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<void> {
      const observable: Observable<any> = this.httpClientService.post({
        controller: 'orders',
        action: 'convert-cart-to-order'
      }, createOrder);
  
      const promiseData = firstValueFrom(observable);
      promiseData.then(() => {
        if (successCallback) successCallback();
      }).catch(error => {
        if (errorCallback) errorCallback(error);
      });
  
      await promiseData;
    }

  async getAllOrders(pageRequest:PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<OrderList>>{
    const observable : Observable<GetListResponse<OrderList>> = this.httpClientService.get<GetListResponse<OrderList>>({
      controller: "orders",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }
}
