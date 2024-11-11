import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GetListResponse } from "src/app/contracts/getListResponse";
import { SearchRequest, SearchResult } from "src/app/contracts/search/searchModel";
import { HttpClientService } from "../http-client.service";

@Injectable({
    providedIn: 'root'
})
export class SearchService {

    constructor(private httpClientService:HttpClientService) {}

    search(request: SearchRequest): Observable<GetListResponse<SearchResult>> {
        return this.httpClientService.post<GetListResponse<SearchResult>>({
            controller: "search",
            action: "search"
        }, request);
    }
}