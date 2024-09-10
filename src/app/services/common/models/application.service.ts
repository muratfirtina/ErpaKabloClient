import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClientService } from '../http-client.service';
import { MenuDto } from 'src/app/contracts/auth/MenuDto';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  constructor(private httpClientService:HttpClientService) { }

  async getAuthorizeDefinitionEndpoints(){
    const observable: Observable<MenuDto[]> = this.httpClientService.get<MenuDto[]>({
      controller: 'ApplicationServices',
    });

    return await firstValueFrom(observable);
  }
}
