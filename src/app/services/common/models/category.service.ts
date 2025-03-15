import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { CategoryCreate } from 'src/app/contracts/category/category-create';
import { Category } from 'src/app/contracts/category/category';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { CategoryUpdate } from 'src/app/contracts/category/category-update';
import { CategoryGetById } from 'src/app/contracts/category/category-getbyid';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private httpClientService:HttpClientService) { }

  private cacheDuration: number = 5 * 60 * 1000; // 5 dakika

  async create(categoryData:FormData, successCallback?: () => void, errorCallback?: (errorMessage: string) => void){
    this.httpClientService.post({
      controller: "categories"
    }, categoryData).subscribe({
      next: (response) => {
        successCallback();
      },
      error: (error) => {
        console.error('Server error:', error);
        errorCallback(error);
      }
    });
  }

  private saveCategoriesToLocalStorage(categories: Category[]) {
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('categoriesLastFetchTime', new Date().getTime().toString());
  }

  private getCategoriesFromLocalStorage(): Category[] | null {
    const categoriesJson = localStorage.getItem('categories');
    const lastFetchTime = localStorage.getItem('categoriesLastFetchTime');
    if (categoriesJson && lastFetchTime) {
      const currentTime = new Date().getTime();
      if ((currentTime - parseInt(lastFetchTime)) <= this.cacheDuration) {
        return JSON.parse(categoriesJson);
      }
    }
    return null;
  }

  async getCategories(pageRequest: PageRequest, forceRefresh: boolean = false): Promise<GetListResponse<Category>> {
    if (!forceRefresh) {
      const cachedCategories = this.getCategoriesFromLocalStorage();
      if (cachedCategories) {
        return {
          items: cachedCategories,
          index: pageRequest.pageIndex,
          size: pageRequest.pageSize,
          count: cachedCategories.length,
          pages: Math.ceil(cachedCategories.length / pageRequest.pageSize),
          hasPrevious: pageRequest.pageIndex > 1,
          hasNext: pageRequest.pageIndex < Math.ceil(cachedCategories.length / pageRequest.pageSize)
        };
      }
    }

    const response = await this.list(pageRequest);
    this.saveCategoriesToLocalStorage(response.items);
    return response;
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

  async update(categoryData: FormData, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<CategoryUpdate> {
    const observable: Observable<CategoryUpdate> = this.httpClientService.put<CategoryUpdate>({
      controller: "categories"
    }, categoryData);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getById(id: string, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<CategoryGetById>{
    const observable : Observable<CategoryGetById> = this.httpClientService.get<CategoryGetById>({
      controller: "categories"
    }, id);
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getMainCategories(pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Category>> {
    const observable: Observable<GetListResponse<Category>> = this.httpClientService.get<GetListResponse<Category>>({
      controller: 'categories',
      action: 'GetMainCategories',
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getCategoriesByIds(ids: any): Promise<GetListResponse<Category>> {
    const observable: Observable<GetListResponse<Category>> = this.httpClientService.post<GetListResponse<Category>>({
      controller: "categories",
      action: "GetByIds"
    }, ids);
    return await firstValueFrom(observable);
  }
  
  async getSubCategories(parentCategoryId: string): Promise<GetListResponse<Category>> {
    const observable: Observable<GetListResponse<Category>> = this.httpClientService.get<GetListResponse<Category>>({
      controller: 'categories',
      action: `GetSubCategoriesByCategoryId/${parentCategoryId}`
    });
    return await firstValueFrom(observable);
  }

  async getSubCategoriesByBrandId(brandId: string): Promise<GetListResponse<Category>> {
    const observable: Observable<GetListResponse<Category>> = this.httpClientService.get<GetListResponse<Category>>({
      controller: 'categories',
      action: `GetSubCategoriesByBrandId/${brandId}`,
    });
    return await firstValueFrom(observable);
  }

  async searchCategories(searchTerm: string): Promise<GetListResponse<Category>> {
    const observable = this.httpClientService.get<GetListResponse<Category>>({
      controller: 'categories',
      action: 'search',
      queryString: `searchTerm=${searchTerm}`
    });
    return await firstValueFrom(observable);
  }
}
