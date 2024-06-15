export class Category{
    id: string;
    name: string;
    parentCategoryId: string;
    subCategories: Category[];
    checked: boolean;
    expanded?: boolean;
}