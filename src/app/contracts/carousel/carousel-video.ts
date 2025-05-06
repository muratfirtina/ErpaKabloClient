export interface CarouselVideo {
    id?: string;
    url?: string;
    isExternal: boolean; // To distinguish between uploaded videos and external URLs (YouTube, Vimeo, etc.)
    videoType?: string; // 'youtube', 'vimeo', 'local', etc.
    videoId?: string; // For YouTube/Vimeo videos
  }