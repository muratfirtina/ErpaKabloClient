import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { BrandCreate } from 'src/app/contracts/brand/brand-create';
import { Observable, firstValueFrom } from 'rxjs';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { Brand } from 'src/app/contracts/brand/brand';

@Injectable({
  providedIn: 'root'
})
export class BrandService {

  constructor(private httpClientService:HttpClientService) { }

  async create(brandData: FormData, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<Brand>{
    const observable : Observable<Brand> = this.httpClientService.post<Brand>({
      controller: "brands"
    }, brandData);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  
  }

  async list(pageRequest:PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Brand>>{
    const observable : Observable<GetListResponse<Brand>> = this.httpClientService.get<GetListResponse<Brand>>({
      controller: "brands",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async getBrandsByDynamicQuery(dynamicQuery: any, pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Brand>> {
    const observable: Observable<GetListResponse<Brand>> = this.httpClientService.post<GetListResponse<Brand>>({
      controller: 'brands',
      action: 'GetList/ByDynamic',
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    }, dynamicQuery);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async delete(id: string, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<any>{
    const observable : Observable<any> = this.httpClientService.delete({
      controller: "brands",
    },id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async update(brandData: FormData, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<Brand> {
    const observable: Observable<Brand> = this.httpClientService.put<Brand>({
      controller: "brands"
    }, brandData);
    
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getById(id: string, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<Brand>{
    const observable : Observable<Brand> = this.httpClientService.get<Brand>({
      controller: "brands"
    }, id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getBrandsByIds(ids: any): Promise<GetListResponse<Brand>> {
    const observable: Observable<GetListResponse<Brand>> = this.httpClientService.post<GetListResponse<Brand>>({
      controller: "brands",
      action: "GetByIds"
    }, ids);
    return await firstValueFrom(observable);
  }
  async searchBrands(searchTerm: string): Promise<GetListResponse<Brand>> {
    const observable = this.httpClientService.get<GetListResponse<Brand>>({
      controller: 'brands',
      action: 'search',
      queryString: `searchTerm=${searchTerm}`
    });
    return await firstValueFrom(observable);
  }
}
