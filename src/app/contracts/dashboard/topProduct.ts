import { ProductImageFile } from "../product/productImageFile";

export interface TopProduct {
    id: string;
    name: string;
    count: number;
    image?: ProductImageFile;
    price?: number;
    brandName?: string;
  }