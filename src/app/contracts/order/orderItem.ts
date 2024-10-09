import { ProductImageFile } from "../product/productImageFile";

export interface OrderItem{
    orderId: string;
    productId: string;
    productName: string;
    productPrice: number;
    quantity: number;
    isChecked: boolean;
    showcaseImage?: ProductImageFile; 

}