// src/app/services/common/analytics/analytics.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';

declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private isInitialized = false;
  constructor(private router: Router) {
    // Add listener for route changes to track page views
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.trackPageView(event.urlAfterRedirects);
    });
  }

  // Initialize Google Analytics
  initGoogleAnalytics(trackingId: string) {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
      
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${trackingId}', { 
          'send_page_view': false,
          'anonymize_ip': true,
          'cookie_flags': 'SameSite=None;Secure'
        });
      `;
      
      document.head.appendChild(script1);
      document.head.appendChild(script2);
      
      this.isInitialized = true;
      console.log('Google Analytics initialized with consent');
    }
  }
  disableTracking() {
    if (typeof window !== 'undefined' && window['gaOptout'] === undefined) {
      window['gaOptout'] = true;
      // Opt-out for GA
      if (typeof gtag === 'function') {
        gtag('consent', 'update', {
          'analytics_storage': 'denied'
        });
      }
      // Remove GA cookies
      this.removeCookies(['_ga', '_gat', '_gid']);
      
      this.isInitialized = false;
      console.log('Google Analytics disabled');
    }
  }
  private removeCookies(cookieNames: string[]) {
    cookieNames.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

  // Track page views
  trackPageView(path: string) {
    if (this.isInitialized && typeof gtag === 'function') {
      gtag('config', environment.googleAnalyticsId, {
        'page_path': path
      });
    }
  }

  // Track events
  trackEvent(eventName: string, eventCategory: string, eventAction: string, eventLabel: string = null, eventValue: number = null) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        'event_category': eventCategory,
        'event_action': eventAction,
        'event_label': eventLabel,
        'value': eventValue
      });
    }
  }

  // Track user login
  trackLogin(method: string) {
    this.trackEvent('login', 'User', 'Login', method);
  }

  // Track e-commerce events
  trackAddToCart(product: any, quantity: number = 1) {
    if (typeof gtag === 'function') {
      gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: product.price * quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_brand: product.brandName,
          item_category: product.categoryName,
          price: product.price,
          quantity: quantity
        }]
      });
    }
  }

  trackRemoveFromCart(product: any, quantity: number = 1) {
    if (typeof gtag === 'function') {
      gtag('event', 'remove_from_cart', {
        currency: 'USD',
        value: product.price * quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_brand: product.brandName,
          item_category: product.categoryName,
          price: product.price,
          quantity: quantity
        }]
      });
    }
  }

  trackPurchase(order: any) {
    if (typeof gtag === 'function') {
      gtag('event', 'purchase', {
        transaction_id: order.orderCode,
        value: order.totalAmount,
        currency: 'USD',
        tax: order.tax,
        //shipping: order.shippingCost || 0,
        items: order.orderItems.map(item => ({
          item_id: item.productId,
          item_name: item.productName,
          price: item.price,
          quantity: item.quantity
        }))
      });
    }
  }

  // Track product views
  trackViewItem(product: any) {
    if (typeof gtag === 'function') {
      gtag('event', 'view_item', {
        currency: 'USD',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_brand: product.brandName,
          item_category: product.categoryName,
          price: product.price
        }]
      });
    }
  }
}