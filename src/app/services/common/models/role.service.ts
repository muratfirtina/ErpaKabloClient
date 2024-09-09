import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { RoleDto } from 'src/app/contracts/user/roleDto';
import { HttpClientService } from '../http-client.service';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { GetListResponse } from 'src/app/contracts/getListResponse';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(private httpClientService:HttpClientService) { }

  async create(roleData: FormData, successCallBack?: () => void, errorCallBack?: (error) => void) {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "roles"
    }, roleData);

    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallBack)
      .catch(errorCallBack);

    return await promiseData as { succeeded: boolean };
  }

  async getRoles(pageRequest:PageRequest, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<GetListResponse<RoleDto>>{
    const observable : Observable<GetListResponse<RoleDto>> = this.httpClientService.get<GetListResponse<RoleDto>>({
      controller: "roles",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }
  

  async deleteRole(roleId: string, successCallBack?: () => void, errorCallBack?: (error) => void) {
    const observable: Observable<any> = this.httpClientService.delete({
        controller: "roles"
    }, roleId);

    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallBack)
        .catch(errorCallBack);

    return await promiseData as { succeeded: boolean };
}

async updateRole(roleId: string, name: string, successCallBack?: () => void, errorCallBack?: (error) => void) {
  const observable: Observable<any> = this.httpClientService.put({
      controller: "roles"
  }, { roleId: roleId, roleName: name });

  const promiseData = firstValueFrom(observable);
  promiseData.then(successCallBack)
      .catch(errorCallBack);

  return await promiseData as { succeeded: boolean };

}
}