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

  async create(brand:BrandCreate, SuccessCallback: (data: any) => void, ErrorCallback: (error: any) => void): Promise<BrandCreate>{
    const observable : Observable<BrandCreate> = this.httpClientService.post<BrandCreate>({
      controller: "brands"
    }, brand);
    const promiseData = firstValueFrom(observable);
    promiseData.then((data: BrandCreate) => {
      SuccessCallback(data);
    }).catch((error) => {
      ErrorCallback(error);
    });
    return await promiseData;
    
  }

  async list(pageRequest:PageRequest, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<GetListResponse<Brand>>{
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
}
