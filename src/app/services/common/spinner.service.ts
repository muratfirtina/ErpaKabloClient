import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private spinnerMap = new Map<string, BehaviorSubject<boolean>>();
  private progressMap = new Map<string, BehaviorSubject<number>>();

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

  // New methods for progress tracking
  getProgress(spinnerType: string): Observable<number> {
    if (!this.progressMap.has(spinnerType)) {
      this.progressMap.set(spinnerType, new BehaviorSubject<number>(0));
    }
    return this.progressMap.get(spinnerType)!.asObservable();
  }

  updateProgress(spinnerType: string, value: number): void {
    if (!this.progressMap.has(spinnerType)) {
      this.progressMap.set(spinnerType, new BehaviorSubject<number>(0));
    }
    this.progressMap.get(spinnerType)?.next(value);
  }

  resetProgress(spinnerType: string): void {
    if (this.progressMap.has(spinnerType)) {
      this.progressMap.get(spinnerType)?.next(0);
    }
  }

  getCurrentProgress(spinnerType: string): number {
    return this.progressMap.get(spinnerType)?.getValue() || 0;
  }
}