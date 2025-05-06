import { CarouselVideo } from "./carousel-video";
import { CarouselImageFile } from "./carouselImageFile";

export class Carousel{
    id: string;
    name: string;
    description: string;
    order: number;
    isActive: boolean;
    carouselImageFiles: CarouselImageFile[];

    mediaType?: string; // 'image' or 'video'
    isVideo?: boolean; // Computed property
    videoType?: string; // 'local', 'youtube', 'vimeo'
    videoUrl?: string; // Direct URL or embed URL
    videoId?: string; // YouTube or Vimeo ID
    videoMimeType?: string; // For local videos
    carouselVideo?: CarouselVideo; // Optional detailed video info
}
