import { Category } from "./category";

export class CategoryUpdate {
    id: string;
    name: string;
    parentCategoryId: string;
    subCategories: Category[];
    featureIds: string[];
}
