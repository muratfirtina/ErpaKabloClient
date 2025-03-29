import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(html: string): SafeHtml {
    if (!html) return this.sanitizer.bypassSecurityTrustHtml('');
    
    // HTML içeriğindeki img etiketlerine style ekle
    const modifiedHtml = html
      // Resimlere max-width ekle
      .replace(/<img(.*?)>/gi, '<img$1 style="max-width:100%;height:auto;">')
      
      // Tabloları responsive wrap div içine al
      .replace(/<table(.*?)>([\s\S]*?)<\/table>/gi, 
        '<div class="table-responsive" style="width:100%;overflow-x:auto;"><table$1>$2</table></div>');
    
    return this.sanitizer.bypassSecurityTrustHtml(modifiedHtml);
  }
}