import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { FeaturevalueCreate } from 'src/app/contracts/featurevalue/featurevalue-create';
import { Featurevalue } from 'src/app/contracts/featurevalue/featurevalue';
import { FeaturevalueUpdate } from 'src/app/contracts/featurevalue/featurevalue-update';
import { FeaturevalueGetById } from 'src/app/contracts/featurevalue/featurevalue-getbyid';


@Injectable({
  providedIn: 'root'
})
export class FeaturevalueService {

  constructor(private httpClientService:HttpClientService) { }

  async create(featurevalue:FeaturevalueCreate, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<FeaturevalueCreate>{
    const observable : Observable<FeaturevalueCreate> = this.httpClientService.post<FeaturevalueCreate>({
      controller: "featurevalues"
    }, featurevalue);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async list(pageRequest:PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Featurevalue>>{
    const observable : Observable<GetListResponse<Featurevalue>> = this.httpClientService.get<GetListResponse<Featurevalue>>({
      controller: "featurevalues",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async getFeaturevaluesByDynamicQuery(dynamicQuery: any, pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Featurevalue>> {
    const observable: Observable<GetListResponse<Featurevalue>> = this.httpClientService.post<GetListResponse<Featurevalue>>({
      controller: 'featurevalues',
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
      controller: "featurevalues",
    },id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async update(featurevalue:FeaturevalueUpdate, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<FeaturevalueUpdate>{
    const observable : Observable<FeaturevalueUpdate> = this.httpClientService.put<FeaturevalueUpdate>({
      controller: "featurevalues"
    }, featurevalue);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getById(id: string, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<FeaturevalueGetById>{
    const observable : Observable<FeaturevalueGetById> = this.httpClientService.get<FeaturevalueGetById>({
      controller: "featurevalues",
    },id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }
}
