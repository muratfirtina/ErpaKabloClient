import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { Carousel } from 'src/app/contracts/carousel/carousel';
import { GetListResponse } from 'src/app/contracts/getListResponse';

@Injectable({
  providedIn: 'root'
})
export class CarouselService {

  constructor(private httpClientService: HttpClientService) { }

  async create(carouselData: FormData, successCallback?: () => void, errorCallback?: (errorMessage: string) => void) {
    const observable: Observable<any> = this.httpClientService.post({
      controller: "carousels"
    }, carouselData);

    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback).catch(errorCallback);
    return await promiseData;
  }

  async list(pageRequest: PageRequest, successCallback?: () => void, errorCallback?: (errorMessage: string) => void): Promise<GetListResponse<Carousel>> {
    const observable: Observable<GetListResponse<Carousel>> = this.httpClientService.get<GetListResponse<Carousel>>({
      controller: "carousels",
      queryString: `pageIndex=${pageRequest.pageIndex}&pageSize=${pageRequest.pageSize}`
    });
    const promiseData = firstValueFrom(observable);
    promiseData.then(successCallback)
      .catch(errorCallback);
    return await promiseData;
  }

  async update(carousel: FormData, successCallBack?: () => void, errorCallBack?: (errorMessage: string) => void) {
    const observable: Observable<any> = this.httpClientService.put({
      controller: "carousels"
    }, carousel);

    return firstValueFrom(observable).then(result => {
      successCallBack();
    }).catch(error => {
      errorCallBack(error);
    });
  }

  // Helper method to extract YouTube video ID from URL
  extractYoutubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Helper method to extract Vimeo video ID from URL
  extractVimeoVideoId(url: string): string | null {
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|)(\d+)(?:|\/\?)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }
}