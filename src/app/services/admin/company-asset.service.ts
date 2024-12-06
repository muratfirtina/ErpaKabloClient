import { Injectable } from '@angular/core';
import { HttpClientService } from '../common/http-client.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanyAssetService {

  constructor(private httpClientService: HttpClientService) { }

  async uploadLogo(file: File, successCallBack?: () => void, errorCallBack?: (error) => void) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await firstValueFrom(this.httpClientService.post({
        controller: "CompanyAssetes",
        action: "logo"
      }, formData));
      
      successCallBack?.();
      return response;
    } catch(error) {
      errorCallBack?.(error);
      throw error;
    }
  }

  async updateLogo(file: File, successCallBack?: () => void, errorCallBack?: (error) => void) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await firstValueFrom(this.httpClientService.put({
        controller: "CompanyAssetes",
        action: "logo"
      }, formData));
      
      successCallBack?.();
      return response;
    } catch(error) {
      errorCallBack?.(error);
      throw error;
    }
  }

  async getLogo() {
    const response = await firstValueFrom(this.httpClientService.get<{url: string}>({
      controller: "CompanyAssetes",
      action: "logo"
    }));
    return response;
  }
}