import { Product } from "../product/product";
import { CategoryImageFile } from "./categoryImageFile";

export class Category{
    id: string;
    name: string;
    title: string;
    parentCategoryId: string;
    subCategories?: Category[];
    checked?: boolean;
    expanded?: boolean;
    products?: Product[];
    categoryImage?: CategoryImageFile;
    productCount?:number
}