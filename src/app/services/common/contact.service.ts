import { Injectable } from '@angular/core';

import { Observable, firstValueFrom } from 'rxjs';
import { Contact } from 'src/app/contracts/contact/contact';
import { HttpClientService } from './http-client.service';
import { CreateContact } from 'src/app/contracts/contact/create-contact';
import { CreatedContactResponse } from 'src/app/contracts/contact/created-contact-response';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
    constructor(private httpClientService: HttpClientService) { }
  
    create(contact: CreateContact): Promise<CreatedContactResponse> {
      return firstValueFrom(this.httpClientService.post<CreatedContactResponse>({
        controller: "contacts"
      }, contact));
    }
  }