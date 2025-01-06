import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private spinnerMap = new Map<string, BehaviorSubject<boolean>>();

  show(spinnerType: string) {
    if (!this.spinnerMap.has(spinnerType)) {
      this.spinnerMap.set(spinnerType, new BehaviorSubject<boolean>(false));
    }
    this.spinnerMap.get(spinnerType)?.next(true);
  }

  hide(spinnerType: string) {
    this.spinnerMap.get(spinnerType)?.next(false);
  }

  getSpinner(spinnerType: string) {
    if (!this.spinnerMap.has(spinnerType)) {
      this.spinnerMap.set(spinnerType, new BehaviorSubject<boolean>(false));
    }
    return this.spinnerMap.get(spinnerType)!.asObservable();
  }

  isLoading(spinnerType: string): boolean {
    return this.spinnerMap.get(spinnerType)?.getValue() || false;
  }
}