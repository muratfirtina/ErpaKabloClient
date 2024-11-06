  // user-address.service.ts
  import { Injectable } from '@angular/core';
  import { HttpClientService } from '../http-client.service';
  import { Observable, firstValueFrom } from 'rxjs';
  import { GetListResponse } from 'src/app/contracts/getListResponse';
  import { UserAddress } from 'src/app/contracts/user/userAddress';

  @Injectable({
    providedIn: 'root'
  })
  export class UserAddressService {
    constructor(private httpClientService: HttpClientService) {}

    async getUserAddresses() {
      const observable: Observable<GetListResponse<UserAddress>> = this.httpClientService.get<GetListResponse<UserAddress>>({
        controller: 'useraddresses'
      });
      return await firstValueFrom(observable);
    }

    async addAddress(address: UserAddress) {
      const observable: Observable<UserAddress> = this.httpClientService.post({
        controller: 'useraddresses'
      }, address);
      return await firstValueFrom(observable);
    }

    async updateAddress(id: string, address: UserAddress) {
      const observable: Observable<UserAddress> = this.httpClientService.put({
        controller: 'useraddresses',
        action: id
      }, address);
      return await firstValueFrom(observable);
    }

    async deleteAddress(id: string) {
      const observable: Observable<any> = this.httpClientService.delete({
        controller: 'useraddresses',
      },id);
      const promiseData = firstValueFrom(observable);
      return await promiseData;
    }

    async setDefaultAddress(id: string) {
      const observable: Observable<any> = this.httpClientService.put({
          controller: 'useraddresses',
          action: `${id}/set-default`
      }, {});
      return await firstValueFrom(observable);
  }
  }