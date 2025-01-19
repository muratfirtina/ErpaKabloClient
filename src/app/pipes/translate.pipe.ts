import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/ui/language.service';


@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private languageService: LanguageService) {}

  transform(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }
}