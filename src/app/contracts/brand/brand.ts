import { Product } from "../product/product";
import { BrandImageFile } from "./brandImageFile";

export class Brand{
    id: string;
    name: string;
    brandImage: BrandImageFile;
    products:Product[];
    productCount:number;
}