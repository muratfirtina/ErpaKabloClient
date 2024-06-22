import { Feature } from "../feature/feature";
import { Category } from "./category";

export class CategoryGetById {
    id: string;
    name: string;
    parentCategoryId: string;
    subCategories: Category[];
    features: Feature[];
}