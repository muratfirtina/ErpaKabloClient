import { ProductImageFile } from "../product/productImageFile";

export class CartItem {
    cartItemId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    showcaseImage?: ProductImageFile;
    productId: string;
    quantityPrice: number;
    showCase: boolean;
    isChecked: boolean;
}