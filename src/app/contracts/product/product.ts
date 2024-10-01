import { Feature } from "../feature/feature";
import { ProductFeatureValue } from "./productDtos/productFeatureValue";
import { ProductImageFile } from "./productImageFile";

export class Product {
    id: string;
    name: string;
    stock: number;
    price: number;
    sku: string;
    tax: number;
    title: string;
    description: string;
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
    varyantGroupID: string;
    features: Feature[];
    productFeatureValues: ProductFeatureValue[];
    productImageFiles: ProductImageFile[];
    relatedProducts: Product[];
    availableFeatures: { [key: string]: string[] };
    showcaseImage?: ProductImageFile;
    isLiked: boolean;

}