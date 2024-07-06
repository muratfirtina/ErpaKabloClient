import { FeaturevalueCreate } from "../featurevalue/featurevalue-create";

export class FeatureCreate {
    id: string;
    name: string;
    categoryIds?: string[];
    featureValues: { name: string }[];
}