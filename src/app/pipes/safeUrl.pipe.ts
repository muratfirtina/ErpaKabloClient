import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string | File) {
    if (url instanceof File) {
      return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(url));
    }
    return url;
  }
}