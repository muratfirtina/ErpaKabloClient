interface ProductFeature {
  featureName: string;
  valueName: string;
 }
 
 interface OrderItem {
  productName: string;
  brandName?: string;
  quantity: number;
  price: number;
  featureValues?: ProductFeature[];
 }
 
 interface ChangeInfo<T> {
  previous: T;
  current: T; 
  changed: boolean;
 }
 
 interface OrderItemChange {
  id: string;
  productName: string;
  brandName?: string;
  featureValues?: ProductFeature[];
  quantity: ChangeInfo<number>;
  price: ChangeInfo<number>;
  leadTime: ChangeInfo<number>;
 }
 
 export interface BaseNotification {
  type: string;
  orderId: string;
  orderNumber: string;
  message: string;
  timestamp: Date | null;
  customerName?: string;
  updatedBy?: string;
 }
 
 export interface OrderStatusNotification extends BaseNotification {
  status: ChangeInfo<string>;
 }
 
 export interface OrderCreateNotification extends BaseNotification {
  items: {
    productName: string;
    brandName?: string;
    featureValues?: ProductFeature[];
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
 }
 
 export interface OrderUpdateNotification extends BaseNotification {
  status?: ChangeInfo<string>;
  items?: OrderItemChange[];
  totalAmount?: ChangeInfo<number>;
  adminNote?: ChangeInfo<string>;
 }
 
 export type OrderNotification = OrderCreateNotification | OrderUpdateNotification;