import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookieModalService {
  private showModalSource = new Subject<boolean>();
  
  showModal$ = this.showModalSource.asObservable();
  
  openCookieModal() {
    this.showModalSource.next(true);
  }
}