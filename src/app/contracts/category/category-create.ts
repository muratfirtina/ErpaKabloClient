export class CategoryCreate{
    name: string;
    title: string;
    parentCategoryId: string;
    featureIds?: string[];
    categoryImage?: File;
}