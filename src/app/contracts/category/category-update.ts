import { Category } from "./category";
import { CategoryImageFile } from "./categoryImageFile";

export interface CategoryUpdate {
    id: string;
    name: string;
    title: string;
    parentCategoryId: string;
    subCategories?: Category[];
    featureIds?: string[];
    categoryImage?:CategoryImageFile;
}
