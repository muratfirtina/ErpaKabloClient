import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppState {
  drawer: {
    isOpen: boolean;
    type: string | null;
  };
  user: {
    isAuthenticated: boolean;
    data: any | null;
  };
  auth: {  // Eklenen auth durumu
    isAuthenticated: boolean;
  };
  cart: {
    items: any[];
    total: number;
  };
  theme: {
    name: string;
    isDark: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private initialState: AppState = {
    drawer: {
      isOpen: false,
      type: null
    },
    user: {
      isAuthenticated: false,
      data: null
    },
    auth: {
      isAuthenticated: false
    },
    cart: {
      items: [],
      total: 0
    },
    theme: {
      name: 'light',
      isDark: false
    }
  };

  private state = new BehaviorSubject<AppState>(this.initialState);

  constructor() {
    // State'i localStorage'dan yükle
    this.loadState();
    
    // State değişikliklerini localStorage'a kaydet
    this.state.subscribe(state => {
      localStorage.setItem('appState', JSON.stringify(state));
    });
  }

  private loadState(): void {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      try {
        this.state.next({ ...this.initialState, ...JSON.parse(savedState) });
      } catch (error) {
        console.error('Failed to parse saved state:', error);
        this.state.next(this.initialState);
      }
    }
  }

  // State Selectors
  select<K extends keyof AppState>(key: K): Observable<AppState[K]> {
    return this.state.pipe(map(state => state[key]));
  }

  // State Updates
  update<K extends keyof AppState>(key: K, value: Partial<AppState[K]>): void {
    this.state.next({
      ...this.state.value,
      [key]: { ...this.state.value[key], ...value }
    });
  }

  // Specific Actions
  openDrawer(type: string): void {
    this.update('drawer', { isOpen: true, type });
  }

  closeDrawer(): void {
    this.update('drawer', { isOpen: false, type: null });
  }

  updateCart(items: any[]): void {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.update('cart', { items, total });
  }

  setTheme(theme: { name: string; isDark: boolean }): void {
    this.update('theme', theme);
  }

  // Auth State Updates
  setAuthenticated(isAuthenticated: boolean): void {
    this.update('auth', { isAuthenticated });
    // Kullanıcı durumunu da güncelle
    if (!isAuthenticated) {
      this.update('user', { isAuthenticated: false, data: null });
    }
  }

  // State Reset
  resetState(): void {
    this.state.next(this.initialState);
    localStorage.removeItem('appState');
  }
}