import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterGroup, FilterType } from 'src/app/contracts/product/filter/filters';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent {
  @Input() availableFilters: FilterGroup[] = [];
  @Output() filterChange = new EventEmitter<{ [key: string]: string[] }>();

  selectedFilters: { [key: string]: string[] } = {};
  FilterType = FilterType;
  customPriceRange: { min: string, max: string } = { min: '', max: '' };

  ngOnInit() {
    this.initializeFilters();
  }

  initializeFilters() {
    this.availableFilters.forEach(filter => {
      this.selectedFilters[filter.key] = [];
    });
  }

  toggleFilter(key: string, value: string) {
    // Manage checkbox selection for predefined price ranges
    if (!this.selectedFilters[key]) {
      this.selectedFilters[key] = [];
    }

    const index = this.selectedFilters[key].indexOf(value);
    if (index > -1) {
      this.selectedFilters[key].splice(index, 1);
    } else {
      this.selectedFilters[key].push(value);
    }
    this.emitFilterChange();
  }

  applyCustomPriceRange() {
    const { min, max } = this.customPriceRange;
    // Handle custom price range input, empty inputs are ignored
    if (min || max) {
      this.selectedFilters['Price'] = [`${min || ''}-${max || ''}`];
    } else {
      delete this.selectedFilters['Price'];
    }
    this.emitFilterChange();
  }

  emitFilterChange() {
    this.filterChange.emit(this.selectedFilters);
    
  }

  isSelected(key: string, value: string): boolean {
    return this.selectedFilters[key]?.includes(value) || false;
  }
}