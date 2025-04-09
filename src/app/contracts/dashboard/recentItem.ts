import { ImageFile } from "../imageFile";

export interface RecentItem {
    id: string;
    name: string;
    createdDate: Date;
    image?: ImageFile;
  }