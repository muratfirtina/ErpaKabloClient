import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum DrawerType {
  Cart = 'cart',
  UserMenu = 'userMenu'
}

interface DrawerState {
  isOpen: boolean;
  type: DrawerType | null;
}

@Injectable({
  providedIn: 'root'
})
export class DrawerService {
  private initialState: DrawerState = {
    isOpen: false,
    type: null
  };

  private drawerState = new BehaviorSubject<DrawerState>(this.initialState);
  private previousScrollPosition = 0;

  constructor() {}

  getDrawerState(): Observable<DrawerState> {
    return this.drawerState.asObservable();
  }

  open(type: DrawerType): void {
    this.previousScrollPosition = window.scrollY;
    this.updateBodyStyles(true);
    
    this.drawerState.next({
      isOpen: true,
      type
    });
  }

  close(): void {
    this.updateBodyStyles(false);
    window.scrollTo(0, this.previousScrollPosition);
    this.previousScrollPosition = 0;
    
    this.drawerState.next(this.initialState);
  }

  private updateBodyStyles(isOpen: boolean): void {
    if (isOpen) {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.previousScrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    }
  }

  toggle(type: DrawerType): void {
    const currentState = this.drawerState.value;
    
    if (currentState.isOpen && currentState.type === type) {
      this.close();
    } else {
      this.open(type);
    }
  }

  isOpen(type: DrawerType): boolean {
    const state = this.drawerState.value;
    return state.isOpen && state.type === type;
  }
}