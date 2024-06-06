import { ProductVariantDto } from "./productDtos/productVariantDto";

export class ProductCreate {
    name: string;
    description: string;
    categoryId: string;
    brandId: string;
    sku: string;
    variants: ProductVariantDto[];
}