import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | File): SafeUrl {
    if (value instanceof File) {
      // File objesi için blob URL oluştur
      const url = URL.createObjectURL(value);
      return this.sanitizer.bypassSecurityTrustUrl(url);
    } else if (typeof value === 'string') {
      return this.sanitizer.bypassSecurityTrustUrl(value);
    }
    return value;
  }
}