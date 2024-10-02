import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { ProductLike } from 'src/app/contracts/productLike/productLike';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { Product } from 'src/app/contracts/product/product';
import { AddProductLikeResponse } from 'src/app/contracts/productLike/addProductLikeResponse';

@Injectable({
  providedIn: 'root'
})
export class ProductLikeService {

  constructor(private httpClientService:HttpClientService) {}
  
  async toggleProductLike(productId: string): Promise<boolean> {
    const observable: Observable<AddProductLikeResponse> = this.httpClientService.post<AddProductLikeResponse>({
      controller: "productlikes"
    }, { ProductId: productId }); // ProductId'yi büyük harfle yazıyoruz

    const response = await firstValueFrom(observable);
    return response.isLiked;
  }

  async getProductsUserLiked(pageRequest:PageRequest, successCallback?: () => void, errorCallback?: (error) => void): Promise<GetListResponse<Product>> {
    const observable: Observable<GetListResponse<Product>> = this.httpClientService.post<GetListResponse<Product>>({
      controller: "productlikes",
      action: "getProductsUserLiked",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    }, pageRequest);

    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback).catch(errorCallback);
    return await promiseData;
  }

  async getUserLikedProductIds(productIds: string[]): Promise<string[]> {
    const observable: Observable<{ likedProductIds: string[] }> = this.httpClientService.get<{ likedProductIds: string[] }>({
      controller: "productlikes",
      action: "liked-product-ids",
      queryString: `productIds=${productIds.join(',')}`
    });

    const response = await firstValueFrom(observable);
    return response.likedProductIds;
  }

  async isProductLiked(productId: string): Promise<boolean> {
    const observable: Observable<{ isLiked: boolean }> = this.httpClientService.get<{ isLiked: boolean }>({
      controller: "productlikes",
      action: `isLiked/${productId}`
    });
    const response = await firstValueFrom(observable);
    return response.isLiked;
  }

}
