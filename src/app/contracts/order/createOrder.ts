export interface CreateOrder {
    address: string;      // Siparişin teslim edileceği adres
    description?: string; // Siparişle ilgili notlar (opsiyonel)
    //paymentMethod?: string; // Ödeme yöntemi (opsiyonel)
  }