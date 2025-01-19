import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Language } from 'src/app/enums/language';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';
import { LanguageService } from 'src/app/services/ui/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss'
})
export class LanguageSelectorComponent implements OnInit {
  currentLanguage: Language;
  languageOptions = this.languageService.languageOptions;
  isDropdownOpen = false;

  constructor(private languageService: LanguageService) {}

  @HostListener('document:click')
  onDocumentClick() {
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  ngOnInit() {
    this.languageService.getCurrentLanguage().subscribe(
      lang => this.currentLanguage = lang
    );
  }

  async changeLanguage(language: Language) {
    await this.languageService.setLanguage(language);
    this.isDropdownOpen = false;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  getCurrentLanguageOption() {
    return this.languageOptions.find(option => option.code === this.currentLanguage);
  }
}