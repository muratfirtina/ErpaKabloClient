export class FeatureUpdate {
    id: string;
    name: string;
    categoryIds?: string[];
    featureValueIds?: string[];
    featureValues?: { name: string }[];
}