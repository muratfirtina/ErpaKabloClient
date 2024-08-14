import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { CustomToastrService } from '../../ui/custom-toastr.service';
import { CreateUser } from 'src/app/contracts/user/createUser';
import { User } from 'src/app/contracts/user/user';
import { Observable, firstValueFrom } from 'rxjs';
import { UserDto } from 'src/app/contracts/user/userDto';
import { RoleDto } from 'src/app/contracts/user/roleDto';

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

  async getAllUsers(page: number = 0, size: number = 5, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void): Promise<{ totalCount: number; users: UserDto[] }> {
    const observable: Observable<{ totalCount: number; users: UserDto[] }> = this.httpClientService.get({
      controller: "users",
      queryString: `page=${page}&size=${size}`
    });

    const promiseData = firstValueFrom(observable);
    promiseData.then(value => successCallBack())
      .catch(error => errorCallBack(error));

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


}
