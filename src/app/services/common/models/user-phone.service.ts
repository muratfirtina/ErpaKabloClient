// user-phone.service.ts
import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { UserPhone } from 'src/app/contracts/user/userPhone';

@Injectable({
  providedIn: 'root'
})
export class UserPhoneService {
  constructor(private httpClientService: HttpClientService) {}

  async getUserPhones() {
    const observable: Observable<GetListResponse<UserPhone>> = this.httpClientService.get<GetListResponse<UserPhone>>({
      controller: 'phonenumbers'
    });
    return await firstValueFrom(observable);
  }

  async addPhone(phone: UserPhone) {
    const observable: Observable<UserPhone> = this.httpClientService.post({
      controller: 'phonenumbers'
    }, phone);
    return await firstValueFrom(observable);
  }

  async updatePhone(id: string, phone: UserPhone) {
    const observable: Observable<UserPhone> = this.httpClientService.put({
      controller: 'phonenumbers',
      action: id
    }, phone);
    return await firstValueFrom(observable);
  }

  async deletePhone(id: string) {
    const observable: Observable<UserPhone> = this.httpClientService.delete({
      controller: 'phonenumbers',
    },id);
    return await firstValueFrom(observable);
  }
  async setDefaultPhone(id: string) {
    const observable: Observable<any> = this.httpClientService.put({
      controller: 'phonenumbers',
      action: `${id}/set-default`
    }, {});
    return await firstValueFrom(observable);
  }
}