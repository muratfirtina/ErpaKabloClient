export class ProductCreate {
    name: string;
    description: string;
    title: string;
    categoryId: string;
    brandId: string;
    sku: string;
    price : number;
    stock : number
    varyantGroupID: string;
    tax: number;
    featureIds: string[];
    featureValueIds: string[];

}