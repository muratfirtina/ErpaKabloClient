import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;

  private readonly defaultTheme: Theme = {
    name: 'light',
    isDark: false,
    colors: {
      primary: '#e53935',
      secondary: '#003366',
      accent: '#ff9900',
      success: '#059669',
      warning: '#f59e0b',
      error: '#d32f2f',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#212121'
    }
  };

  private currentTheme = new BehaviorSubject<Theme>(this.defaultTheme);

  private readonly darkTheme: Theme = {
    name: 'dark',
    isDark: true,
    colors: {
      primary: '#f87171',
      secondary: '#60a5fa',
      accent: '#fbbf24',
      success: '#34d399',
      warning: '#fcd34d',
      error: '#ef4444',
      background: '#1f2937',
      surface: '#374151',
      text: '#f3f4f6'
    }
  };

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.setTheme(savedTheme === 'dark' ? this.darkTheme : this.defaultTheme);
    } else {
      this.setTheme(this.defaultTheme);
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.next(theme);
    localStorage.setItem('theme', theme.name);

    // CSS değişkenlerini güncelle
    Object.entries(theme.colors).forEach(([key, value]) => {
      this.renderer.setStyle(
        document.documentElement,
        `--color-${key}`,
        value
      );
    });

    // Dark mode class'ını ekle/kaldır
    if (theme.isDark) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }

  toggleTheme(): void {
    const current = this.currentTheme.value;
    this.setTheme(current.isDark ? this.defaultTheme : this.darkTheme);
  }

  getCurrentTheme() {
    return this.currentTheme.asObservable();
  }
}