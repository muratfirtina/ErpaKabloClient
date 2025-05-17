// Kategori ağacı için node yapısı
export interface CategoryTreeNode {
  category: any; // Category türünde
  children: CategoryTreeNode[];
  level: number;
}