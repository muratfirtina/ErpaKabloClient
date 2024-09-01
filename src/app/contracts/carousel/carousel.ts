import { CarouselImageFile } from "./carouselImageFile";

export class Carousel{
    id: string;
    name: string;
    description: string;
    order: number;
    isActive: boolean;
    carouselImageFiles: CarouselImageFile[];
}
