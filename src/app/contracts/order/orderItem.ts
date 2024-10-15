import { ProductFeatureValue } from "../product/productDtos/productFeatureValue";
import { ProductImageFile } from "../product/productImageFile";

export interface OrderItem{
    id: string;
    brandName: string;
    productId: string;
    productName: string;
    price: number;
    title: string;
    quantity: number;
    //isChecked: boolean;
    productFeatureValues: ProductFeatureValue[];
    showcaseImage?: ProductImageFile; 

    markedForDeletion?: boolean;  // Opsiyonel olarak silinip silinmeye işaret eder
    markedForUpdate?: boolean;    // Opsiyonel olarak güncellenip güncellenmeyeceğini işaret eder

}