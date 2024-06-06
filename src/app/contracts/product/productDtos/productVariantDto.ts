import { DecimalPipe } from "@angular/common";
import { VariantFeatureDto } from "../../feature/featureDtos/variantFeatureDto";

export class ProductVariantDto{
    price : number;
    stock : number
    features : VariantFeatureDto[];
}