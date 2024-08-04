export class VaryantGroup {
    id: string;
    name: string;
    productCount: number;
  
    constructor(id: string, name: string, productCount: number) {
      this.id = id;
      this.name = name;
      this.productCount = productCount;
    }
  }