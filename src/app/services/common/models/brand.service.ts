import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';

@Injectable({
  providedIn: 'root'
})
export class BrandService {

  constructor(private httpClientService:HttpClientService) { }
}
