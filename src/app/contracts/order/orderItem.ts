import { ProductFeatureValue } from "../product/productDtos/productFeatureValue";
import { ProductImageFile } from "../product/productImageFile";

export interface OrderItem{
    id: string;
    brandName: string;
    productId: string;
    productName: string;
    price: number;
    productTitle: string;
    quantity: number;
    //isChecked: boolean;
    productFeatureValues: ProductFeatureValue[];
    showcaseImage?: ProductImageFile; 
    updatedPrice?: number; // Opsiyonel olarak güncellenen fiyatı tutar
    leadTime?: number;      // Opsiyonel olarak teslim süresini tutar

    markedForDeletion?: boolean;  // Opsiyonel olarak silinip silinmeye işaret eder
    markedForUpdate?: boolean;    // Opsiyonel olarak güncellenip güncellenmeyeceğini işaret eder

}