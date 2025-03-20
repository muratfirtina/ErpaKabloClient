import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GetListResponse } from "src/app/contracts/getListResponse";
import { City } from "src/app/contracts/location/city";
import { Country } from "src/app/contracts/location/country";
import { District } from "src/app/contracts/location/district";
import { HttpClientService, RequestParameters } from "./http-client.service";

@Injectable({
    providedIn: 'root'
  })
  export class LocationService {
    private controller = "locations";
  
    constructor(private httpClientService: HttpClientService) { }
  
    // Country methods
    getAllCountries(): Observable<GetListResponse<Country>> {
      const requestParams: Partial<RequestParameters> = {
        controller: this.controller,
        action: "countries"
      };
      return this.httpClientService.get<GetListResponse<Country>>(requestParams);
    }
  
    getCountryById(id: number): Observable<Country> {
      const requestParams: Partial<RequestParameters> = {
        controller: this.controller,
        action: "countries"
      };
      return this.httpClientService.get<Country>(requestParams, id.toString());
    }
  
    // City methods
    getAllCities(): Observable<GetListResponse<City>> {
      const requestParams: Partial<RequestParameters> = {
        controller: this.controller,
        action: "cities"
      };
      return this.httpClientService.get<GetListResponse<City>>(requestParams);
    }
  
    getCityById(id: number): Observable<City> {
      const requestParams: Partial<RequestParameters> = {
        controller: this.controller,
        action: "cities"
      };
      return this.httpClientService.get<City>(requestParams, id.toString());
    }
  
    getCitiesByCountryId(countryId: number): Observable<GetListResponse<City>> {
      const requestParams: Partial<RequestParameters> = {
        controller: this.controller,
        action: `countries/${countryId}/cities`
      };
      return this.httpClientService.get<GetListResponse<City>>(requestParams);
    }
  
    // District methods
    getAllDistricts(): Observable<GetListResponse<District>> {
      const requestParams: Partial<RequestParameters> = {
        controller: this.controller,
        action: "districts"
      };
      return this.httpClientService.get<GetListResponse<District>>(requestParams);
    }
  
    getDistrictById(id: number): Observable<District> {
      const requestParams: Partial<RequestParameters> = {
        controller: this.controller,
        action: "districts"
      };
      return this.httpClientService.get<District>(requestParams, id.toString());
    }
  
    getDistrictsByCityId(cityId: number): Observable<GetListResponse<District>> {
      const requestParams: Partial<RequestParameters> = {
        controller: this.controller,
        action: `cities/${cityId}/districts`
      };
      return this.httpClientService.get<GetListResponse<District>>(requestParams);
    }
  }