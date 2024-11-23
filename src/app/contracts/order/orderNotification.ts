export interface OrderNotification {
    type: string;
    orderId: string;
    message: string;
    timestamp: Date;
  }

  export interface OrderStatusNotification extends OrderNotification {
    status: string;
  }