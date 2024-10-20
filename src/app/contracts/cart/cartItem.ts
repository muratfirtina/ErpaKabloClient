import { ProductFeatureValue } from "../product/productDtos/productFeatureValue";
import { ProductImageFile } from "../product/productImageFile";

export class CartItem {
    cartItemId: string;
    brandName: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    showcaseImage?: ProductImageFile;
    productId: string;
    quantityPrice: number;
    showCase: boolean;
    isChecked: boolean;
    title: string;
    productFeatureValues: ProductFeatureValue[];
}