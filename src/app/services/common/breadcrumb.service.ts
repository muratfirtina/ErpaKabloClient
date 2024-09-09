import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbs = new BehaviorSubject<Breadcrumb[]>([]);

  constructor() { }

  setBreadcrumbs(breadcrumbs: Breadcrumb[]) {
    this.breadcrumbs.next(breadcrumbs);
  }

  getBreadcrumbs() {
    return this.breadcrumbs.asObservable();
  }
}