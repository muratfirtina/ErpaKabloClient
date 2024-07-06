import { Category } from "../category/category";
import { Featurevalue } from "../featurevalue/featurevalue";

export class FeatureGetById {
    id: string;
    name: string;
    description: string;
    categories: Category[];
    featureValues: Featurevalue[];
}