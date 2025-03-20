export interface UserAddress {
    id: string;
    name: string;
    addressLine1?: string;
    addressLine2?: string;
    cityId?: number;     // Şehir ID'si
    districtId?: number; // İlçe ID'si 
    postalCode?: string;
    countryId?: number;  // Ülke ID'si
    isDefault: boolean;
    
    // Görüntüleme için ekstra alanlar (opsiyonel)
    cityName?: string;
    districtName?: string;
    countryName?: string;
}