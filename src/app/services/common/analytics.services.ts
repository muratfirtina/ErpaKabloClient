import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';

declare let gtag: Function;
declare let ym: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private googleInitialized = false;
  private yandexInitialized = false;
  
  constructor(private router: Router) {
    // Add listener for route changes to track page views
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.trackPageView(event.urlAfterRedirects);
    });
  }

  // Initialize all analytics platforms based on consent
  initializeAnalytics(consentSettings: {analytics: boolean}) {
    if (consentSettings.analytics) {
      this.initGoogleAnalytics(environment.analytics.googleAnalyticsId);
      this.initYandexMetrika(environment.analytics.yandexMetrikaId);
    }
  }

  // Initialize Google Analytics
  initGoogleAnalytics(trackingId: string) {
    if (typeof window !== 'undefined' && !this.googleInitialized) {
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
      
      this.googleInitialized = true;
      console.log('Google Analytics initialized with consent');
    }
  }

  // Initialize Yandex Metrika
  initYandexMetrika(counterId: string) {
    if (typeof window !== 'undefined' && !this.yandexInitialized) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(${counterId}, "init", {
          clickmap:true,
          trackLinks:true,
          accurateTrackBounce:true,
          webvisor:true,
          ecommerce:"dataLayer"
        });
      `;
      
      const noscript = document.createElement('noscript');
      const div = document.createElement('div');
      const img = document.createElement('img');
      img.src = `https://mc.yandex.ru/watch/${counterId}`;
      img.style.position = 'absolute';
      img.style.left = '-9999px';
      img.alt = '';
      
      div.appendChild(img);
      noscript.appendChild(div);
      
      document.head.appendChild(script);
      document.body.appendChild(noscript);
      
      this.yandexInitialized = true;
      console.log('Yandex Metrika initialized with consent');
    }
  }

  disableTracking() {
    this.disableGoogleAnalytics();
    this.disableYandexMetrika();
  }
  
  private disableGoogleAnalytics() {
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
      this.googleInitialized = false;
      console.log('Google Analytics disabled');
    }
  }
  
  private disableYandexMetrika() {
    if (typeof window !== 'undefined' && typeof ym === 'function') {
      // Remove Yandex Metrika cookies
      this.removeCookies(['_ym_uid', '_ym_d', '_ym_isad', '_ym_visorc']);
      this.yandexInitialized = false;
      console.log('Yandex Metrika disabled');
    }
  }
  
  private removeCookies(cookieNames: string[]) {
    cookieNames.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }

  // Track page views
  trackPageView(path: string) {
    if (this.googleInitialized && typeof gtag === 'function') {
      gtag('config', environment.analytics.googleAnalyticsId, {
        'page_path': path
      });
    }
    if (this.yandexInitialized && typeof ym === 'function') {
      ym(environment.analytics.yandexMetrikaId, 'hit', path);
    }
  }

  // Track events
  trackEvent(eventName: string, eventCategory: string, eventAction: string, eventLabel: string = null, eventValue: number = null) {
    if (this.googleInitialized && typeof gtag === 'function') {
      gtag('event', eventName, {
        'event_category': eventCategory,
        'event_action': eventAction,
        'event_label': eventLabel,
        'value': eventValue
      });
    }
    if (this.yandexInitialized && typeof ym === 'function') {
      ym(environment.analytics.yandexMetrikaId, 'reachGoal', eventName, {
        category: eventCategory,
        action: eventAction,
        label: eventLabel,
        value: eventValue
      });
    }
  }

  // Track user login
  trackLogin(method: string) {
    this.trackEvent('login', 'User', 'Login', method);
  }

  // Track e-commerce events
  trackAddToCart(product: any, quantity: number = 1) {
    if (this.googleInitialized && typeof gtag === 'function') {
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
    if (this.yandexInitialized && typeof ym === 'function') {
      ym(environment.analytics.yandexMetrikaId, 'reachGoal', 'add_to_cart', {
        currency: 'USD',
        value: product.price * quantity,
        item: {
          id: product.id,
          name: product.name,
          brand: product.brandName,
          category: product.categoryName,
          price: product.price,
          quantity: quantity
        }
      });
    }
  }

  trackRemoveFromCart(product: any, quantity: number = 1) {
    if (this.googleInitialized && typeof gtag === 'function') {
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
    if (this.yandexInitialized && typeof ym === 'function') {
      ym(environment.analytics.yandexMetrikaId, 'reachGoal', 'remove_from_cart', {
        currency: 'USD',
        value: product.price * quantity,
        item: {
          id: product.id,
          name: product.name,
          brand: product.brandName,
          category: product.categoryName,
          price: product.price,
          quantity: quantity
        }
      });
    }
  }

  trackPurchase(order: any) {
    if (this.googleInitialized && typeof gtag === 'function') {
      gtag('event', 'purchase', {
        transaction_id: order.orderCode,
        value: order.totalAmount,
        currency: 'USD',
        tax: order.tax,
        items: order.orderItems.map(item => ({
          item_id: item.productId,
          item_name: item.productName,
          price: item.price,
          quantity: item.quantity
        }))
      });
    }
    if (this.yandexInitialized && typeof ym === 'function') {
      ym(environment.analytics.yandexMetrikaId, 'reachGoal', 'purchase', {
        order_id: order.orderCode,
        order_price: order.totalAmount,
        currency: 'USD',
        goods: order.orderItems.map(item => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity
        }))
      });
    }
  }

  // Track product views
  trackViewItem(product: any) {
    if (this.googleInitialized && typeof gtag === 'function') {
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
    if (this.yandexInitialized && typeof ym === 'function') {
      ym(environment.analytics.yandexMetrikaId, 'reachGoal', 'view_item', {
        currency: 'USD',
        value: product.price,
        item: {
          id: product.id,
          name: product.name,
          brand: product.brandName,
          category: product.categoryName,
          price: product.price
        }
      });
    }
  }
}