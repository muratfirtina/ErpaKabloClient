// location.service.ts
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { HttpClientService } from './http-client.service';

// Define interfaces for the response data
interface GeoNamesResponse<T> {
  geonames: T[];
  totalResultsCount?: number;
}

interface LocationItem {
  id: string;
  name: string;
}

// location.service.ts
@Injectable({
    providedIn: 'root'
  })
  export class LocationService {
    private readonly API_BASE_URL = 'https://countriesnow.space/api/v0.1';
  
    constructor(private httpClientService: HttpClientService) {}
  
    async getCountries(): Promise<LocationItem[]> {
      const observable = this.httpClientService.get<any>({
        fullEndpoint: `${this.API_BASE_URL}/countries`
      });
  
      try {
        const response = await firstValueFrom(observable);
        return response.data.map((country: any) => ({
          id: country.iso2,
          name: country.country
        }));
      } catch (error) {
        console.error('Ülkeler yüklenirken hata oluştu:', error);
        return [];
      }
    }
  
    async getCities(countryName: string): Promise<LocationItem[]> {
      const observable = this.httpClientService.post<any>({
        fullEndpoint: `${this.API_BASE_URL}/countries/population/cities/filter`
      }, {
        country: countryName,
        order: "asc",
        orderBy: "name",
        limit: 100
      });
  
      try {
        const response = await firstValueFrom(observable);
        if (response.error === false && response.data && response.data.length > 0) {
          return response.data.map((city: any) => ({
            id: city.city,
            name: city.city
          }));
        } else {
          console.error('Bu ülke için şehir bulunamadı:', countryName);
          return [];
        }
      } catch (error) {
        console.error('Şehirler yüklenirken hata oluştu:', error);
        return [];
      }
    }
  
    async getDistricts(countryName: string, cityName: string): Promise<LocationItem[]> {
      // API ilçe verisi sağlamıyor
      console.warn('API ilçe verisi sağlamıyor. İlçe verileri yerel olarak saklanmalı.');
      return [];
    }
  }