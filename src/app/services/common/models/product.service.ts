import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { ProductCreate } from 'src/app/contracts/product/product-create';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ProductUpdate } from 'src/app/contracts/product/product-update';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { Product } from 'src/app/contracts/product/product';
import { ProductImageList } from 'src/app/contracts/product/product-image-list';
import { ProductImageFile } from 'src/app/contracts/product/productImageFile';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private httpClientService:HttpClientService) {}


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

  async update(formData: FormData, successCallback?: () => void, errorCallback?: (error: any) => void): Promise<any> {
    const observable: Observable<any> = this.httpClientService.put({
      controller: "products"
    }, formData);
    
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback).catch(errorCallback);
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

  async getProductsByDynamicQuery(dynamicQuery: any, pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (error: any) => void): Promise<GetListResponse<Product>> {
    const observable: Observable<GetListResponse<Product>> = this.httpClientService.post<GetListResponse<Product>>({
      controller: 'products',
      action: 'GetList/ByDynamic',
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    }, dynamicQuery);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async delete(id: string, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<any>{
    const observable : Observable<any> = this.httpClientService.delete({
      controller: "products",
    },id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async getById(id: string, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<Product>{
    const observable : Observable<Product> = this.httpClientService.get<Product>({
      controller: "products"
    }, id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async readImages(id: string, successCallBack?: () => void): Promise<ProductImageList[]>{
    const getObservable: Observable<ProductImageList[]> = this.httpClientService.get<ProductImageList[]>({
      controller: "products",
      action: "getproductimages"
    }, id);

    const productImages: ProductImageList[] = await firstValueFrom(getObservable);
    successCallBack();
    return productImages;
  }

  async deleteImage(id: string, imageId: string, successCallBack?: () => void): Promise<void>{
    const deleteObservable: Observable<any> = this.httpClientService.delete<any>({
      controller: "products",
      action: "deleteproductimage",
      queryString: `imageId=${imageId}`
    }, id);

    await firstValueFrom(deleteObservable);
    successCallBack();
  }

  createMultiple(formData: FormData, SuccessCallback?: () => void, ErrorCallback?: (errorMessage: string) => void) {
    this.httpClientService.post({
      controller: "products",
      action: "multiple"
    }, formData).subscribe({
      next: (response) => {
        console.log('Server response:', response);
        SuccessCallback();
      },
      error: (error) => {
        console.error('Server error:', error);
        ErrorCallback(error);
      }
    });
  }

  async getRandomProductsByCategory(categoryId: string, count: number = 4): Promise<Product[]> {
    const observable: Observable<Product[]> = this.httpClientService.get<Product[]>({
      controller: "products",
      action: `GetRandomProductsByCategory/${categoryId}`,
      queryString: `count=${count}`
    });
    return await firstValueFrom(observable);
  }
}
