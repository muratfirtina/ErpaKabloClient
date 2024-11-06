// user-phone.service.ts
import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PhoneNumber } from 'src/app/contracts/user/phoneNumber';


@Injectable({
  providedIn: 'root'
})
export class PhoneNumberService {
  constructor(private httpClientService: HttpClientService) {}

  async getUserPhones() {
    const observable: Observable<GetListResponse<PhoneNumber>> = this.httpClientService.get<GetListResponse<PhoneNumber>>({
      controller: 'phonenumbers'
    });
    return await firstValueFrom(observable);
  }

  async addPhone(phone: PhoneNumber) {
    const observable: Observable<PhoneNumber> = this.httpClientService.post({
      controller: 'phonenumbers'
    }, phone);
    return await firstValueFrom(observable);
  }

  async updatePhone(id: string, phone: PhoneNumber) {
    const observable: Observable<PhoneNumber> = this.httpClientService.put({
      controller: 'phonenumbers',
      action: id
    }, phone);
    return await firstValueFrom(observable);
  }

  async deletePhone(id: string) {
    const observable: Observable<PhoneNumber> = this.httpClientService.delete({
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