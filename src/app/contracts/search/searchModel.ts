import { ProductFeatureValue } from "../product/productDtos/productFeatureValue";
import { ProductImageFile } from "../product/productImageFile";

export interface SearchResult {
    id: string;
    type: string;
    name: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    categoryId?: string;
    categoryName?: string;
    brandId?: string;
    brandName?: string;
    features?: ProductFeatureValue[];
    showcaseImage?: ProductImageFile;
    
}

export interface SearchFilter {
    categoryIds: string[];
    brandIds: string[];
    featureValueIds: string[];
    minPrice?: number;
    maxPrice?: number;
}

export interface SearchRequest {
    searchTerm: string;
    filters?: SearchFilter;
    pageRequest: {
        pageIndex: number;
        pageSize: number;
    };
}