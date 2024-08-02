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
    description: string;
    categoryId: string;
    brandId: string;
    varyantGroupID: string;
    features: Feature[];
    productFeatureValues: ProductFeatureValue[];
    productImageFiles: ProductImageFile[];
    relatedProducts: Product[];
    availableFeatures: { [key: string]: string[] };

}