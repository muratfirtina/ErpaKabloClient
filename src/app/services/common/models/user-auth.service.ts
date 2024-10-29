import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { TokenResponse } from 'src/app/contracts/token/tokenResponse';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../ui/custom-toastr.service';
import { HttpClientService } from '../http-client.service';
import { SocialUser } from '@abacritt/angularx-social-login';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {

  constructor(private httpClientService: HttpClientService, private toastrService : CustomToastrService) { }


  async login(userNameOrEmail: string, password: string, callBackFunction?:() => void): Promise<any>{
    const observable: Observable<any | TokenResponse> = this.httpClientService.post<any | TokenResponse>({
      controller: "auth",
      action: "login"
    }, {
      userNameOrEmail, password}
    );

    const tokenResponse : TokenResponse = await firstValueFrom(observable) as TokenResponse;
    if(tokenResponse){
      localStorage.setItem("accessToken", tokenResponse.token.accessToken);
      localStorage.setItem("refreshToken", tokenResponse.token.refreshToken);
      localStorage.setItem("userId", tokenResponse.token.userId);

      this.toastrService.message("Login successful", "Success",{
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      })
      
    }
    callBackFunction();
  } 
  
  async logout(callBackFunction?: () => void): Promise<boolean> {
    try {
      const observable: Observable<any> = this.httpClientService.post({
        controller: "auth",
        action: "logout"
      }, {});

      await firstValueFrom(observable);

      // Local storage'ı temizle
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");

      this.toastrService.message("Logged out successfully", "Success", {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });

      if (callBackFunction) callBackFunction();
      return true;
    } catch (error) {
      this.toastrService.message("Logout failed", "Error", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return false;
    }
  }
  

  

  async refreshTokenLogin(refreshToken: string, callBackFunction?:(state) => void): Promise<any> {
    const observable: Observable<any | TokenResponse> = this.httpClientService.post<any | TokenResponse>({
      controller: "auth",
      action: "refreshtokenlogin"
    }, {refreshToken: refreshToken});

    try{
      const tokenResponse : TokenResponse = await firstValueFrom(observable) as TokenResponse;
      if(tokenResponse){
        localStorage.setItem("accessToken", tokenResponse.token.accessToken);
        localStorage.setItem("refreshToken", tokenResponse.token.refreshToken);
      }
      callBackFunction(tokenResponse ? true : false);

    }catch{
      callBackFunction(false);
    }
  }
  
  async passwordReset(email: string, callBackFunction?:()=> void): Promise<any>{
    const observable: Observable<any> = this.httpClientService.post<any>({
      action:"password-reset",
      controller:"auth"
    },{email: email});

    await firstValueFrom(observable);
    callBackFunction();
  }

  async verifyResetPasswordToken(resetToken: string, userId:string, callBackFunction?:()=> void): Promise<boolean>{
    const observable: Observable<any> = this.httpClientService.post<any>({
      action:"verify-reset-password-token",
      controller:"auth"
    },{resetToken: resetToken, userId: userId});

    const state: boolean = await firstValueFrom(observable);
    callBackFunction();
    return state;
  }


}
