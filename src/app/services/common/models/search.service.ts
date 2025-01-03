import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { HttpClientService } from '../http-client.service';
import { SearchRequest, SearchResult } from 'src/app/contracts/search/searchModel';
import { FilterOption } from 'src/app/contracts/product/filter/filters';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private httpClientService: HttpClientService) {}

  search(request: SearchRequest): Observable<GetListResponse<SearchResult>> {
    return this.httpClientService.post<GetListResponse<SearchResult>>(
      {
        controller: 'search',
        action: 'search',
      },
      request
    );
  }

  getFilterOptions(searchTerm: string): Observable<FilterOption> {
    return this.httpClientService.get<FilterOption>({
      controller: 'search',
      action: 'filter-options',
      queryString: `searchTerm=${searchTerm}`,
    });
  }
}
