import { Feature } from "../feature/feature";
import { Category } from "./category";
import { CategoryImageFile } from "./categoryImageFile";

export class CategoryGetById {
    id: string;
    name: string;
    title: string;
    parentCategoryId: string;
    subCategories: Category[];
    features: Feature[];
    categoryImage: CategoryImageFile;
}