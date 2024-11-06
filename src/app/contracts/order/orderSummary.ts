import { ProductFeatureValue } from "../product/productDtos/productFeatureValue";

export interface OrderSummary {
    selectedItems: Array<{
      productId: string;
      productName: string;
      title: string;
      brandName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      productFeatureValues: ProductFeatureValue[];
      showcaseImage?: {
        url: string;
      };
    }>;
    totalPrice: number;
  }