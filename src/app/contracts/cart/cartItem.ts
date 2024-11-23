import { ProductFeatureValue } from "../product/productDtos/productFeatureValue";

export interface CartItem {
    cartItemId: string;
    productId: string;
    productName: string;
    title: string;
    brandName: string;
    quantity: number;
    unitPrice: number;
    quantityPrice: number;
    isChecked: boolean;
    productFeatureValues: ProductFeatureValue[];
    showcaseImage?: {
      url: string;
    };
  }