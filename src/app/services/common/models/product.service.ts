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
import { Brand } from 'src/app/contracts/brand/brand';
import { Feature } from 'src/app/contracts/feature/feature';
import { DynamicQuery } from 'src/app/contracts/dynamic-query';
import { FilterGroup } from 'src/app/contracts/product/filter/filters';
import { Category } from 'src/app/contracts/category/category';

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

  async getProductsByDynamicQuery(dynamicQuery: DynamicQuery, pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (error: any) => void): Promise<GetListResponse<Product>> {
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

  async createMultiple(formData: FormData, successCallback?: () => void, errorCallback?: (errorMessage: string) => void) {
  const observable = this.httpClientService.post({
    controller: "products",
    action: "multiple"
  }, formData);

  // Subscribe yerine firstValueFrom kullanıyoruz
  try {
    const response = await firstValueFrom(observable);
    successCallback?.(); // Başarılı callback'i çağır
    return response;
  } catch (error) {
    errorCallback?.(error);
    throw error;
  }
}

  async getRandomProductsByCategory(categoryId: string, count: number = 4): Promise<GetListResponse<Product>> {
    const observable: Observable<GetListResponse<Product>> = this.httpClientService.get<GetListResponse<Product>>({
      controller: "products",
      action: `GetRandomProductsByCategory/${categoryId}`,
      queryString: `count=${count}`
    });
    return await firstValueFrom(observable);
  }

  async getAvailableFilters(searchTerm?: string, categoryIds?: string[], brandIds?: string[]): Promise<FilterGroup[]> {
    let queryParams: string[] = [];
    
    if (searchTerm) {
        queryParams.push(`searchTerm=${searchTerm}`);
    }
    
    if (categoryIds && categoryIds.length > 0) {
        // Her bir kategori ID'sini ayrı parametre olarak ekle
        categoryIds.forEach(id => {
            queryParams.push(`categoryIds=${id}`);
        });
    }
    
    if (brandIds && brandIds.length > 0) {
        // Her bir marka ID'sini ayrı parametre olarak ekle
        brandIds.forEach(id => {
            queryParams.push(`brandIds=${id}`);
        });
    }
    
    const queryString = queryParams.join('&');
    
    const observable = this.httpClientService.get<FilterGroup[]>({
        controller: 'products',
        action: 'filters',
        queryString: queryString
    });
    
    return await firstValueFrom(observable);
}

async searchProducts(searchTerm: string, pageRequest: PageRequest): Promise<{
  products: GetListResponse<Product>;
  categories: Category[];
  brands: Brand[];
}> {
  const observable = this.httpClientService.get<{
    products: GetListResponse<Product>;
    categories: Category[];
    brands: Brand[];
  }>({
    controller: 'products',
    action: 'search',
    queryString: `searchTerm=${searchTerm}&pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
  });

  return await firstValueFrom(observable);
}

  async filterProducts(searchTerm: string, filters: { [key: string]: string[] }, pageRequest: PageRequest,sortOrder : string, successCallback?: () => void, errorCallback?: (error: any) => void): Promise<GetListResponse<Product>> {
    const observable: Observable<GetListResponse<Product>> = this.httpClientService.post<GetListResponse<Product>>({
      controller: 'products',
      action: 'filter',
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    }, { searchTerm: searchTerm, filters: filters , sortOrder: sortOrder});

    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async getRandomProductsByProductId(productId: string): Promise<GetListResponse<Product>> {
    const observable: Observable<GetListResponse<Product>> = this.httpClientService.get<GetListResponse<Product>>({
      controller: 'products',
      action: `GetRandomsByProductId/${productId}`
    });
    return await firstValueFrom(observable);
  }

  async getMostLikedProducts(count: number = 10): Promise<GetListResponse<Product>> {
    const observable: Observable<GetListResponse<Product>> = this.httpClientService.get<GetListResponse<Product>>({
      controller: "products",
      action: "most-liked",
      queryString: `count=${count}`
    });
    return await firstValueFrom(observable);
  }

  async getRandomProductsForBrandByProductId(productId: string): Promise<GetListResponse<Product>> {
    const observable: Observable<GetListResponse<Product>> = this.httpClientService.get<GetListResponse<Product>>({
      controller: 'products',
      action: `GetRandomsForBrand/${productId}`
    });
    return await firstValueFrom(observable);
  }

  async uploadDescriptionImage(formData: FormData): Promise<any> {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "products",
      action: "upload-description-image"
    }, formData);
    
    return await firstValueFrom(observable);
  }
  async getMostViewedProducts(count: number = 10): Promise<GetListResponse<Product>> {
    const observable: Observable<GetListResponse<Product>> = this.httpClientService.get<GetListResponse<Product>>({
        controller: "products",
        action: "most-viewed",
        queryString: `count=${count}`
    });
    return await firstValueFrom(observable);
}

async trackProductView(productId: string): Promise<void> {
  const observable: Observable<void> = this.httpClientService.post<void>({
      controller: "products",
      action: `track-view/${productId}`
  }, {});
  await firstValueFrom(observable);
}


async getBestSellingProducts(count: number = 10): Promise<GetListResponse<Product>> {
  const observable: Observable<GetListResponse<Product>> = this.httpClientService.get<GetListResponse<Product>>({
      controller: "products",
      action: "best-selling",
      queryString: `count=${count}`
  });
  return await firstValueFrom(observable);
}

async getRandomProducts(count: number = 10): Promise<GetListResponse<Product>> {
  const observable: Observable<GetListResponse<Product>> = this.httpClientService.get<GetListResponse<Product>>({
      controller: "products",
      action: "random",
      queryString: `count=${count}`
  });
  return await firstValueFrom(observable);
}
}

