export interface FilterGroup {
  key: string;
  name: string;
  displayName: string;
  type: FilterType;
  options: FilterOption[];
}

export interface FilterOption {
  value: string;
  displayValue: string;
  count: number;
  parentId?: string;
  selected?: boolean;
}

export enum FilterType {
  Checkbox,
  Radio,
  Range,
  Text,
}
