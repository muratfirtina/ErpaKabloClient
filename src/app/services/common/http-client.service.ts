import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {

  constructor(private httpClient:HttpClient, @Inject("baseUrl") private baseUrl: string) {}

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

    return this.httpClient.get<T>(url, {headers: requestParameters.headers, responseType: requestParameters.responseType as "json"})

  }

  post<T>(requestParameters: Partial<RequestParameters>, body: Partial<T>): Observable<T> {
    let url: string = "";
    if(requestParameters.fullEndpoint){
      url = requestParameters.fullEndpoint;
    }
    else{
      url = `${this.url(requestParameters)}${requestParameters.queryString ? `?${requestParameters.queryString}` : ""}`.trim();
    }
    
    return this.httpClient.post<T>(url,body,{headers: requestParameters.headers, responseType: requestParameters.responseType as "json"});

  }

  put<T>(requestParameters: Partial<RequestParameters>, body: Partial<T>): Observable<T>{
    let url: string = "";
    if(requestParameters.fullEndpoint){
      url = requestParameters.fullEndpoint;
    }
    else{
      url = `${this.url(requestParameters)}${requestParameters.queryString ? `?${requestParameters.queryString}` : ""}`.trim();
    }
    
    return this.httpClient.put<T>(url,body,{headers: requestParameters.headers, responseType: requestParameters.responseType as "json"});

  }
  delete<T>(requestParameters: Partial<RequestParameters>, id: string): Observable<T> {
    let url: string = "";
    if(requestParameters.fullEndpoint){
      url = requestParameters.fullEndpoint;
    }
    else{
      url = `${this.url(requestParameters).trim()}/${id}${requestParameters.queryString ? `?${requestParameters.queryString}` : ""}`.trim();
    }
    
    return this.httpClient.delete<T>(url,{headers: requestParameters.headers, responseType: requestParameters.responseType as "json"});
    
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
