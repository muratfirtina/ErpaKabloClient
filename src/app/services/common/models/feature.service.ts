import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { FeatureCreate } from 'src/app/contracts/feature/feature-create';
import { Feature } from 'src/app/contracts/feature/feature';
import { FeatureUpdate } from 'src/app/contracts/feature/feature-update';
import { FeatureGetById } from 'src/app/contracts/feature/feature-getbyid';

@Injectable({
  providedIn: 'root'
})
export class FeatureService {

  constructor(private httpClientService:HttpClientService) { }

  async create(feature:FeatureCreate, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<FeatureCreate>{
    const observable : Observable<FeatureCreate> = this.httpClientService.post<FeatureCreate>({
      controller: "features"
    }, feature);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async list(pageRequest:PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Feature>>{
    const observable : Observable<GetListResponse<Feature>> = this.httpClientService.get<GetListResponse<Feature>>({
      controller: "features",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async getFeaturesByDynamicQuery(dynamicQuery: any, pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Feature>> {
    const observable: Observable<GetListResponse<Feature>> = this.httpClientService.post<GetListResponse<Feature>>({
      controller: 'features',
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
      controller: "features",
    },id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async update(feature:FeatureUpdate, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<FeatureUpdate>{
    const observable : Observable<FeatureUpdate> = this.httpClientService.put<FeatureUpdate>({
      controller: "features"
    },feature);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getById(id: string, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<FeatureGetById>{
    const observable : Observable<FeatureGetById> = this.httpClientService.get<FeatureGetById>({
      controller: "features"
    }, id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }
}
