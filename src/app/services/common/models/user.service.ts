import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { CustomToastrService } from '../../ui/custom-toastr.service';
import { CreateUser } from 'src/app/contracts/user/createUser';
import { User } from 'src/app/contracts/user/user';
import { Observable, firstValueFrom } from 'rxjs';
import { UserDto } from 'src/app/contracts/user/userDto';
import { RoleDto } from 'src/app/contracts/user/roleDto';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { GetListResponse } from 'src/app/contracts/getListResponse';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClientService: HttpClientService, private toastrService : CustomToastrService) { }

 async create(user:User): Promise<CreateUser> {
    const observable: Observable<CreateUser | User> = this.httpClientService.post<CreateUser | User>({
      controller: "users"
    }, user);

    return await firstValueFrom(observable) as CreateUser;
  }

  async updateForgotPassword(password:string, passwordConfirm:string, userId:string, resetToken:string, successCallBack?: () => void, errorCallBack?: (error) => void){
    const observable: Observable<any> = this.httpClientService.post<any>({
      controller: "users",
      action: "update-forgot-password"
    }, {
      password: password, passwordConfirm : passwordConfirm, userId:userId, resetToken:resetToken}
    );

    const promiseData : Promise<any> = firstValueFrom(observable);
    promiseData.then(value => successCallBack()).catch(error => errorCallBack(error));
    await promiseData;

  }

  async getAllUsers(pageRequest:PageRequest, successCallback: (data: any) => void, errorCallback: (error: any) => void): Promise<GetListResponse<User>>{
    const observable : Observable<GetListResponse<User>> = this.httpClientService.get<GetListResponse<User>>({
      controller: "users",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
    
  }

  async getUserByDynamicQuery(dynamicQuery: any, pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (error: any) => void): Promise<GetListResponse<User>> {
    const observable: Observable<GetListResponse<User>> = this.httpClientService.post<GetListResponse<User>>({
      controller: 'users',
      action: 'GetList/ByDynamic',
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    }, dynamicQuery);

    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);

    return await promiseData;
  }

  async assignRoleToUser(userId: string, roles: RoleDto[], successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void) {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "users",
      action: "assign-role-to-user"
    }, {
      userId: userId,
      roles: roles
    });

    const promiseData = firstValueFrom(observable);
    promiseData.then(value => successCallBack())
      .catch(error => errorCallBack(error));

    await promiseData;
  }

  async getRolesToUser(userId: string, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<RoleDto[]> {
    const observable: Observable<{userRoles: RoleDto[]}> = this.httpClientService.get({
      controller: "users",
      action: "get-roles-to-user"
    },
      userId
    );

    const promiseData = firstValueFrom(observable);
    promiseData.then(value => successCallBack())
      .catch(error => errorCallBack(error));

    return (await promiseData).userRoles;
  }

  async isAdmin(): Promise<boolean> {
    const observable: Observable<boolean> = this.httpClientService.get<boolean>({
      controller: 'users',
      action: 'is-admin'
    });
    const result = await firstValueFrom(observable);
    return result

    
  }

  async getCurrentUser(){
    const observable: Observable<UserDto> = this.httpClientService.get<UserDto>({
      controller: 'users',
      action: 'current-user'
    });

    return await firstValueFrom(observable);
  }


}
