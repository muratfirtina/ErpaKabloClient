import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent {
  @Input() filters: { [key: string]: string[] } = {};
  @Output() filterChange = new EventEmitter<{ [key: string]: string[] }>();

  selectedFilters: { [key: string]: string[] } = {};

  isSelected(key: string, option: string): boolean {
    return this.selectedFilters[key]?.includes(option) || false;
  }

  toggleFilter(key: string, option: string) {
    if (!this.selectedFilters[key]) {
      this.selectedFilters[key] = [];
    }
    const index = this.selectedFilters[key].indexOf(option);
    if (index > -1) {
      this.selectedFilters[key].splice(index, 1);
    } else {
      this.selectedFilters[key].push(option);
    }
  }

  applyFilters() {
    this.filterChange.emit(this.selectedFilters);
  }
}