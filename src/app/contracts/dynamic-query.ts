export interface DynamicQuery {
    sort?: Sort[]; // Sıralama için
    filter?: Filter; // Filtreleme için
  }
  
  export interface Sort {
    field: string; // Hangi alanın sıralanmak istendiği
    dir: string; // Sıralamanın yönü, örneğin 'asc' veya 'desc'
  }
  
  // Filter sınıfı için bir interface
  export interface Filter {
    field?: string; // Hangi alanın filtrelenmek istendiği
    operator?: string; // Hangi operatörün kullanılacağı, örneğin: 'eq', 'neq', 'contains' vb.
    value?: string; // Filtre değeri
    logic?: string; // Mantıksal operatör, örneğin: 'and', 'or'
    filters?: Filter[]; // İç içe filtreler için
  }
  
  