import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { ProductCreate } from 'src/app/contracts/product/product-create';
import { Observable, firstValueFrom } from 'rxjs';
import { ProductUpdate } from 'src/app/contracts/product/product-update';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { Product } from 'src/app/contracts/product/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private httpClientService:HttpClientService) { }

  async create(product:ProductCreate, SuccessCallback: (data: any) => void, ErrorCallback: (error: any) => void): Promise<ProductCreate>{
    const observable : Observable<ProductCreate> = this.httpClientService.post<ProductCreate>({
      controller: "products"
    }, product);
    const promiseData = firstValueFrom(observable);
    promiseData.then((data: ProductCreate) => {
      SuccessCallback(data);
    }).catch((error) => {
      ErrorCallback(error);
    });
    return await promiseData;
    
  }

  async update(product:ProductUpdate, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<ProductUpdate>{
    const observable : Observable<ProductUpdate> = this.httpClientService.put<ProductUpdate>({
      controller: "products"
    }, product);
    const promiseData = firstValueFrom(observable);
    promiseData.then((data: ProductUpdate) => {
      successCallback(data);
    }).catch((error) => {
      errorCallback(error);
    });
    return await promiseData;
    
  }

  async list(pageRequest:PageRequest, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<GetListResponse<Product>>{
    const observable : Observable<GetListResponse<Product>> = this.httpClientService.get<GetListResponse<Product>>({
      controller: "products",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }
}
