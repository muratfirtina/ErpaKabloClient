export interface FilterGroup {
  key: string;
  displayName: string;
  type: FilterType;
  options: FilterOption[];
}

export interface FilterOption {
  value: string;
  count: number;
}

export enum FilterType {
  Checkbox,
  Radio,
  Range,
  Text,
}
