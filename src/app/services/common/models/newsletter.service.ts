import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  constructor(private httpClientService: HttpClientService) { }

  subscribe(email: string): Observable<any> {
    return this.httpClientService.post({
      controller: "Newsletter",
      action: "subscribe"
    }, { email: email });
  }

  unsubscribe(email: string): Observable<any> {
    return this.httpClientService.post({
      controller: "Newsletter",
      action: "unsubscribe"
    }, { email: email });
  }
}