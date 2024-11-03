export interface UserAddress {
    id: string;
    name: string;
    addressLine1?: string;
    addressLine2?: string; // Opsiyonel olabilir
    city?: string;
    state?: string; // Opsiyonel olabilir
    postalCode?: string;
    country?: string;
    isDefault: boolean;
}