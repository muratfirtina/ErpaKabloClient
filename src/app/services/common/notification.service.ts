import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OrderCreateNotification, OrderUpdateNotification, OrderStatusNotification } from 'src/app/contracts/order/orderNotification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // LocalStorage anahtarları
  private readonly ORDER_NOTIFICATIONS_KEY = 'order_notifications';
  private readonly ORDER_UPDATES_KEY = 'order_updates';
  private readonly ORDER_STATUS_KEY = 'order_status_updates';

  // BehaviorSubject'ler
  private orderNotificationsSubject = new BehaviorSubject<OrderCreateNotification[]>([]);
  private orderUpdatesSubject = new BehaviorSubject<OrderUpdateNotification[]>([]);
  private orderStatusSubject = new BehaviorSubject<OrderStatusNotification[]>([]);

  constructor() {
    // LocalStorage'dan bildirimleri yükle
    this.loadFromLocalStorage();
  }

  // Yeni sipariş bildirimi ekle
  addOrderNotification(notification: OrderCreateNotification): void {
    const currentNotifications = this.orderNotificationsSubject.value;
    // En fazla 100 bildirim sakla (isteğe bağlı limit)
    const updatedNotifications = [notification, ...currentNotifications].slice(0, 100);
    
    this.orderNotificationsSubject.next(updatedNotifications);
    this.saveToLocalStorage(this.ORDER_NOTIFICATIONS_KEY, updatedNotifications);
  }

  // Sipariş güncelleme bildirimi ekle
  addOrderUpdate(update: OrderUpdateNotification): void {
    const currentUpdates = this.orderUpdatesSubject.value;
    const updatedUpdates = [update, ...currentUpdates].slice(0, 100);
    
    this.orderUpdatesSubject.next(updatedUpdates);
    this.saveToLocalStorage(this.ORDER_UPDATES_KEY, updatedUpdates);
  }

  // Sipariş durum bildirimi ekle
  addOrderStatusUpdate(statusUpdate: OrderStatusNotification): void {
    const currentStatusUpdates = this.orderStatusSubject.value;
    const updatedStatusUpdates = [statusUpdate, ...currentStatusUpdates].slice(0, 100);
    
    this.orderStatusSubject.next(updatedStatusUpdates);
    this.saveToLocalStorage(this.ORDER_STATUS_KEY, updatedStatusUpdates);
  }

  // Bildirim silme işlemleri
  removeOrderNotification(index: number): void {
    const currentNotifications = this.orderNotificationsSubject.value;
    currentNotifications.splice(index, 1);
    
    this.orderNotificationsSubject.next([...currentNotifications]);
    this.saveToLocalStorage(this.ORDER_NOTIFICATIONS_KEY, currentNotifications);
  }

  removeOrderStatusUpdate(index: number): void {
    const currentUpdates = this.orderStatusSubject.value;
    currentUpdates.splice(index, 1);
    
    this.orderStatusSubject.next([...currentUpdates]);
    this.saveToLocalStorage(this.ORDER_STATUS_KEY, currentUpdates);
  }

  removeOrderUpdate(index: number): void {
    const currentUpdates = this.orderUpdatesSubject.value;
    currentUpdates.splice(index, 1);
    
    this.orderUpdatesSubject.next([...currentUpdates]);
    this.saveToLocalStorage(this.ORDER_UPDATES_KEY, currentUpdates);
  }

  // Sipariş numarasına göre bildirim silme
  removeOrderNotificationByNumber(orderNumber: string): void {
    const currentNotifications = this.orderNotificationsSubject.value;
    const index = currentNotifications.findIndex(n => n.orderNumber === orderNumber);
    
    if (index !== -1) {
      currentNotifications.splice(index, 1);
      this.orderNotificationsSubject.next([...currentNotifications]);
      this.saveToLocalStorage(this.ORDER_NOTIFICATIONS_KEY, currentNotifications);
    }
  }

  // Tüm bildirimleri temizle
  clearAllNotifications(): void {
    this.orderNotificationsSubject.next([]);
    this.orderUpdatesSubject.next([]);
    this.orderStatusSubject.next([]);
    
    localStorage.removeItem(this.ORDER_NOTIFICATIONS_KEY);
    localStorage.removeItem(this.ORDER_UPDATES_KEY);
    localStorage.removeItem(this.ORDER_STATUS_KEY);
  }

  // Bildirim Observable'ları
  getOrderNotifications(): Observable<OrderCreateNotification[]> {
    return this.orderNotificationsSubject.asObservable();
  }

  getOrderUpdates(): Observable<OrderUpdateNotification[]> {
    return this.orderUpdatesSubject.asObservable();
  }

  getOrderStatusUpdates(): Observable<OrderStatusNotification[]> {
    return this.orderStatusSubject.asObservable();
  }

  // Bildirim sayıları
  getOrderNotificationsCount(): number {
    return this.orderNotificationsSubject.value.length;
  }

  getOrderUpdatesCount(): number {
    return this.orderUpdatesSubject.value.length;
  }

  getOrderStatusUpdatesCount(): number {
    return this.orderStatusSubject.value.length;
  }

  getTotalNotificationsCount(): number {
    return this.getOrderNotificationsCount() + 
           this.getOrderUpdatesCount() + 
           this.getOrderStatusUpdatesCount();
  }

  // LocalStorage'a kaydetme işlemi
  private saveToLocalStorage(key: string, data: any[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // LocalStorage'dan yükleme işlemi
  private loadFromLocalStorage(): void {
    try {
      // Siparişler
      const savedOrderNotifications = localStorage.getItem(this.ORDER_NOTIFICATIONS_KEY);
      if (savedOrderNotifications) {
        this.orderNotificationsSubject.next(JSON.parse(savedOrderNotifications));
      }
      
      // Sipariş güncellemeleri
      const savedOrderUpdates = localStorage.getItem(this.ORDER_UPDATES_KEY);
      if (savedOrderUpdates) {
        this.orderUpdatesSubject.next(JSON.parse(savedOrderUpdates));
      }
      
      // Sipariş durum güncellemeleri
      const savedStatusUpdates = localStorage.getItem(this.ORDER_STATUS_KEY);
      if (savedStatusUpdates) {
        this.orderStatusSubject.next(JSON.parse(savedStatusUpdates));
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
      // Hata durumunda LocalStorage'ı temizle
      this.clearAllNotifications();
    }
  }
}