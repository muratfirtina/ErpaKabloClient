import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { DynamicQuery } from 'src/app/contracts/dynamic-query';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {

  constructor(private httpClient: HttpClient, @Inject("baseUrl") private baseUrl: string) {}

  private url(requestParameters: Partial<RequestParameters>): string {
    return `${requestParameters.baseUrl ? requestParameters.baseUrl : this.baseUrl}/${requestParameters.controller}${requestParameters.action ? `/${requestParameters.action}` : ""}`.trim();
  }

  get<T>(requestParameters: Partial<RequestParameters>, id?: string): Observable<T> {
    let url : string = "";

    url = `${this.url(requestParameters)}`;
    if(requestParameters.fullEndpoint){
      url = requestParameters.fullEndpoint;
    }
    else{
     url = `${this.url(requestParameters)}${id ? `/${id}` : ""}${requestParameters.queryString ? `?${requestParameters.queryString}` : ""}`.trim();
    }

    return this.httpClient.get<T>(url, {headers: requestParameters.headers, responseType: requestParameters.responseType as "json" , withCredentials: true })
    .pipe(
      shareReplay({ bufferSize: 1, refCount: true, windowTime: 30000 })
    );
  }

  post<T, R = T>(requestParameters: Partial<RequestParameters>, body: DynamicQuery | Partial<T> | any, options?: any): Observable<R> {
    let url: string = "";
    if(requestParameters.fullEndpoint){
      url = requestParameters.fullEndpoint;
    }
    else{
      url = `${this.url(requestParameters)}${requestParameters.queryString ? `?${requestParameters.queryString}` : ""}`.trim();
    }
    
    // Varsayılan options
    const defaultOptions = {
      headers: requestParameters.headers, 
      responseType: requestParameters.responseType as "json", 
      withCredentials: true
    };
    
    // Eğer özel options parametre verilmişse, varsayılanlarla birleştir
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    
    // CSRF header'ı özel olarak kontrol et
    if (requestParameters.headers && requestParameters.headers.has('X-CSRF-TOKEN') && 
        url.includes('/api/auth/login')) {
      // Login için CSRF header'ını kaldır
      const headersWithoutCsrf = requestParameters.headers.delete('X-CSRF-TOKEN');
      finalOptions.headers = headersWithoutCsrf;
    }
    
    return this.httpClient.post<T>(url, body, finalOptions) as any as Observable<R>;
  }

  put<T, R = T>(requestParameters: Partial<RequestParameters>, body: Partial<T> | FormData, options?: any): Observable<R>{
    let url: string = "";
    if(requestParameters.fullEndpoint){
      url = requestParameters.fullEndpoint;
    }
    else{
      url = `${this.url(requestParameters)}${requestParameters.queryString ? `?${requestParameters.queryString}` : ""}`.trim();
    }
    
    const defaultOptions = {
      headers: requestParameters.headers, 
      responseType: requestParameters.responseType as "json", 
      withCredentials: true 
    };
    
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    
    return this.httpClient.put<T>(url, body, finalOptions) as any as Observable<R>;
  }

  delete<T>(requestParameters: Partial<RequestParameters>, id: string): Observable<T> {
    let url: string = "";
    if(requestParameters.fullEndpoint){
      url = requestParameters.fullEndpoint;
    }
    else{
      url = `${this.url(requestParameters).trim()}/${id}${requestParameters.queryString ? `?${requestParameters.queryString}` : ""}`.trim();
    }
    
    return this.httpClient.delete<T>(url,{headers: requestParameters.headers, responseType: requestParameters.responseType as "json" , withCredentials: true });
  }
}

export class RequestParameters {
  controller?: string;
  action?: string;
  queryString?: string;

  headers?: HttpHeaders;
  baseUrl?: string;
  fullEndpoint?: string;

  responseType?: string = "json";
}