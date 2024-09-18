import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterGroup, FilterType } from 'src/app/contracts/product/filter/filters';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnChanges {
  @Input() availableFilters: FilterGroup[] = [];
  @Input() selectedFilters: { [key: string]: string[] } = {};
  @Output() filterChange = new EventEmitter<{ [key: string]: string[] }>();

  FilterType = FilterType;
  customPriceRange: { min: string, max: string } = { min: '', max: '' };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['availableFilters'] || changes['selectedFilters']) {
      this.initializeFilters();
    }
  }

  initializeFilters() {
    // Mevcut seçili filtreleri koruyarak yeni filtreleri ekle
    this.availableFilters.forEach(filter => {
      if (!this.selectedFilters[filter.key]) {
        this.selectedFilters[filter.key] = [];
      }
    });
  }

  toggleFilter(key: string, value: string) {
    if (!this.selectedFilters[key]) {
      this.selectedFilters[key] = [];
    }

    const index = this.selectedFilters[key].indexOf(value);
    if (index > -1) {
      this.selectedFilters[key].splice(index, 1);
    } else {
      this.selectedFilters[key].push(value);
    }

    if (this.selectedFilters[key].length === 0) {
      delete this.selectedFilters[key];
    }

    this.emitFilterChange();
  }

  applyCustomPriceRange() {
    const { min, max } = this.customPriceRange;
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