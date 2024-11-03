export enum OrderStatus {


    Pending = 0,    // Sipariş beklemede
    Processing = 1, // Sipariş hazırlanıyor
    Confirmed = 2,  // Sipariş onaylandı
    Rejected = 3,   // Sipariş reddedildi
    Delivered = 4,  // Sipariş teslim edildi
    Completed = 5,  // Sipariş tamamlandı
    Shipped = 6,    // Sipariş gönderildi
    Cancelled = 7,  // Sipariş iptal edildi
    Returned = 8,    // Sipariş iade edildi
    All = 9         // Tümü
}