import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { CategoryCreate } from 'src/app/contracts/category/category-create';
import { Category } from 'src/app/contracts/category/category';
import { GetListResponse } from 'src/app/contracts/getListResponse';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private httpClientService:HttpClientService) { }

  async create(category:CategoryCreate, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<CategoryCreate>{
    const observable : Observable<CategoryCreate> = this.httpClientService.post<CategoryCreate>({
      controller: "categories"
    }, category);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async list(pageRequest:PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Category>>{
    const observable : Observable<GetListResponse<Category>> = this.httpClientService.get<GetListResponse<Category>>({
      controller: "categories",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async getCategoriesByDynamicQuery(dynamicQuery: any, pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Category>> {
    const observable: Observable<GetListResponse<Category>> = this.httpClientService.post<GetListResponse<Category>>({
      controller: 'categories',
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
      controller: "categories",
    },id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }
}
